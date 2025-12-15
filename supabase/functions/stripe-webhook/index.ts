import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("ERROR: No signature found");
      return new Response("No signature", { status: 400 });
    }

    // Get the raw body
    const body = await req.text();
    logStep("Body received", { length: body.length });

    // Verify the event
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      logStep("Event verified", { type: event.type, id: event.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logStep("Webhook signature verification failed", { error: errorMessage });
      return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.orderId;
        const orderNumber = paymentIntent.metadata?.orderNumber;
        
        logStep("Payment succeeded", { 
          paymentIntentId: paymentIntent.id, 
          orderId, 
          orderNumber,
          amount: paymentIntent.amount 
        });

        if (orderId) {
          // First, check if this order was already processed (prevent duplicate emails on webhook retries)
          const { data: existingOrder, error: fetchError } = await supabaseClient
            .from("orders")
            .select("confirmation_email_sent_at, payment_status")
            .eq("id", orderId)
            .single();

          if (fetchError) {
            logStep("Error fetching order", { error: fetchError.message });
            throw new Error(`Failed to fetch order: ${fetchError.message}`);
          }

          // Check if confirmation email was already sent (webhook retry protection)
          const alreadyProcessed = existingOrder?.confirmation_email_sent_at !== null;
          
          if (alreadyProcessed) {
            logStep("Order already processed, skipping duplicate email", { orderId, sentAt: existingOrder.confirmation_email_sent_at });
          }

          // Update the order status to card_paid (admin will manually change to processing)
          const { error } = await supabaseClient
            .from("orders")
            .update({ 
              payment_status: "paid",
              payment_id: paymentIntent.id,
              status: "card_paid" // New status for card payments - admin manually moves to processing
            })
            .eq("id", orderId);

          if (error) {
            logStep("Error updating order", { error: error.message });
            throw new Error(`Failed to update order: ${error.message}`);
          }

          logStep("Order updated successfully", { orderId, status: "card_paid" });

          // Only send confirmation email if not already sent (prevents duplicates on webhook retries)
          if (!alreadyProcessed) {
            // Send order confirmation email to customer
            try {
              const confirmationEmailResponse = await fetch(
                `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-order-email`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                  },
                  body: JSON.stringify({
                    orderId,
                    emailType: "confirmation",
                  }),
                }
              );
              
              if (confirmationEmailResponse.ok) {
                logStep("Order confirmation email sent to customer", { orderId });
                
                // Mark confirmation email as sent to prevent duplicates
                await supabaseClient
                  .from("orders")
                  .update({ confirmation_email_sent_at: new Date().toISOString() })
                  .eq("id", orderId);
              } else {
                logStep("Failed to send order confirmation email", { orderId });
              }
            } catch (confirmEmailError) {
              logStep("Error sending order confirmation email", { error: confirmEmailError });
            }

            // Send admin notification email for successful payment
            try {
              const adminEmailResponse = await fetch(
                `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-order-email`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                  },
                  body: JSON.stringify({
                    orderId,
                    emailType: "admin_notification",
                    language: "ro",
                  }),
                }
              );
              
              if (adminEmailResponse.ok) {
                logStep("Admin notification email sent", { orderId });
              } else {
                logStep("Failed to send admin notification email", { orderId });
              }
            } catch (adminEmailError) {
              logStep("Error sending admin notification email", { error: adminEmailError });
            }
          } // End of if (!alreadyProcessed)

          // Now sync to Ecolet after successful payment
          // Fetch order details to get all required data
          const { data: orderData, error: orderError } = await supabaseClient
            .from("orders")
            .select("*, order_items(*)")
            .eq("id", orderId)
            .single();

          if (orderError) {
            logStep("Error fetching order for Ecolet sync", { error: orderError.message });
          } else if (orderData && orderData.delivery_method !== 'pickup') {
            logStep("Syncing order to Ecolet", { orderId, deliveryMethod: orderData.delivery_method });
            
            const shippingAddress = orderData.shipping_address as any;
            
            const ecoletPayload = {
              orderId: orderData.id,
              orderNumber: orderData.order_number,
              customerFirstName: orderData.customer_first_name,
              customerLastName: orderData.customer_last_name,
              customerEmail: orderData.customer_email,
              customerPhone: orderData.customer_phone,
              deliveryMethod: orderData.delivery_method,
              shippingAddress: orderData.delivery_method !== 'locker' ? {
                country: shippingAddress?.country || 'România',
                countryCode: shippingAddress?.countryCode || 'RO',
                address: shippingAddress?.address || '',
                addressLine2: shippingAddress?.addressLine2 || '',
                city: shippingAddress?.city || '',
                county: shippingAddress?.county || '',
                postalCode: shippingAddress?.postalCode || '',
              } : null,
              lockerId: orderData.locker_id,
              lockerName: orderData.locker_name,
              lockerAddress: orderData.locker_address,
              lockerLocalityId: orderData.locker_locality_id,
              total: orderData.total,
              paymentMethod: orderData.payment_method,
              items: (orderData.order_items || []).map((item: any) => ({
                productName: item.product_name,
                quantity: item.quantity,
              })),
            };

            // Call Ecolet function (fire and forget within webhook)
            try {
              const ecoletResponse = await fetch(
                `${Deno.env.get("SUPABASE_URL")}/functions/v1/create-ecolet-parcel`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                  },
                  body: JSON.stringify(ecoletPayload),
                }
              );
              
              const ecoletResult = await ecoletResponse.json();
              if (ecoletResponse.ok) {
                logStep("Ecolet sync successful", { orderId });
              } else {
                logStep("Ecolet sync failed", { error: ecoletResult });
              }
            } catch (ecoletError) {
              const ecoletErrorMessage = ecoletError instanceof Error ? ecoletError.message : String(ecoletError);
              logStep("Ecolet sync error", { error: ecoletErrorMessage });
            }
          } else {
            logStep("Skipping Ecolet sync - pickup order or no order data");
          }
        } else {
          logStep("WARNING: No orderId in payment metadata");
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.orderId;
        const failureReason = paymentIntent.last_payment_error?.message || 'Plata nu a putut fi procesată';
        
        logStep("Payment failed", { 
          paymentIntentId: paymentIntent.id, 
          orderId,
          error: failureReason 
        });

        if (orderId) {
          // Update the order payment status to failed
          const { error } = await supabaseClient
            .from("orders")
            .update({ 
              payment_status: "failed",
              payment_id: paymentIntent.id,
              cancel_reason: failureReason,
              cancel_source: 'stripe_webhook'
            })
            .eq("id", orderId);

          if (error) {
            logStep("Error updating order for failed payment", { error: error.message });
          } else {
            logStep("Order marked as payment failed", { orderId });
            
            // Send payment failed email
            try {
              const emailResponse = await fetch(
                `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-order-email`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                  },
                  body: JSON.stringify({
                    orderId,
                    emailType: "payment_failed",
                    language: "ro",
                  }),
                }
              );
              
              if (emailResponse.ok) {
                logStep("Payment failed email sent", { orderId });
                
                // Update email sent timestamp
                await supabaseClient
                  .from("orders")
                  .update({ payment_failed_email_sent_at: new Date().toISOString() })
                  .eq("id", orderId);
              } else {
                logStep("Failed to send payment failed email", { orderId });
              }
            } catch (emailError) {
              logStep("Error sending payment failed email", { error: emailError });
            }
          }
        }
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed - IGNORED for Ecolet sync", { 
          sessionId: session.id,
          paymentStatus: session.payment_status,
          orderId: session.metadata?.orderId
        });
        // NOTE: We intentionally do NOT sync to Ecolet here.
        // Ecolet sync happens only on payment_intent.succeeded to ensure payment is confirmed.
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
