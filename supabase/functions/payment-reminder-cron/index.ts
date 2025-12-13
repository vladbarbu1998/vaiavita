import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAYMENT-REMINDER-CRON] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    
    // 12 hours ago (for reminders - abandoned checkouts)
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    
    // 24 hours ago (for auto-cancellation)
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    logStep("Starting payment reminder cron job", { 
      reminderWindow: `orders older than ${twelveHoursAgo.toISOString()}`,
      cancelWindow: `orders older than ${twentyFourHoursAgo.toISOString()}`
    });

    const results = {
      reminders: [] as any[],
      cancellations: [] as any[]
    };

    // 1. Find ABANDONED orders needing reminder (pending payment, no reminder sent, 12h+ old)
    // This catches abandoned Stripe checkouts where user never completed payment
    const { data: reminderOrders, error: reminderError } = await supabase
      .from("orders")
      .select("id, order_number, customer_email, payment_status")
      .eq("payment_method", "stripe")
      .in("payment_status", ["pending", "failed"]) // Both abandoned and failed
      .eq("status", "pending")
      .is("payment_reminder_sent_at", null)
      .lt("created_at", twelveHoursAgo.toISOString());

    if (reminderError) {
      logStep("Error fetching reminder orders", { error: reminderError.message });
    } else {
      logStep(`Found ${reminderOrders?.length || 0} orders needing reminder`);

      for (const order of reminderOrders || []) {
        try {
          // Send reminder email based on status
          const emailType = order.payment_status === "failed" ? "payment_failed" : "payment_reminder";
          
          const { error: emailError } = await supabase.functions.invoke("send-order-email", {
            body: {
              orderId: order.id,
              emailType,
              language: "ro",
            },
          });

          if (emailError) {
            logStep(`Error sending reminder for ${order.order_number}`, { error: emailError.message });
            results.reminders.push({ orderId: order.id, success: false, error: emailError.message });
          } else {
            // Update reminder sent timestamp
            await supabase
              .from("orders")
              .update({ payment_reminder_sent_at: now.toISOString() })
              .eq("id", order.id);
            
            logStep(`Reminder sent for ${order.order_number} (status: ${order.payment_status})`);
            results.reminders.push({ orderId: order.id, success: true });
          }
        } catch (err: any) {
          logStep(`Exception for ${order.order_number}`, { error: err.message });
          results.reminders.push({ orderId: order.id, success: false, error: err.message });
        }
      }
    }

    // 2. Find orders to auto-cancel (24h+ with pending or failed payment)
    // This catches both abandoned checkouts and failed payments
    const { data: cancelOrders, error: cancelError } = await supabase
      .from("orders")
      .select("id, order_number, customer_email, payment_status")
      .eq("payment_method", "stripe")
      .in("payment_status", ["pending", "failed"]) // Both abandoned and failed
      .eq("status", "pending")
      .lt("created_at", twentyFourHoursAgo.toISOString());

    if (cancelError) {
      logStep("Error fetching cancel orders", { error: cancelError.message });
    } else {
      logStep(`Found ${cancelOrders?.length || 0} orders to auto-cancel`);

      for (const order of cancelOrders || []) {
        try {
          const cancelReason = order.payment_status === "failed" 
            ? "Plata a eșuat și nu a fost reîncercată în 24 de ore"
            : "Plata nu a fost finalizată în 24 de ore (checkout abandonat)";
          
          // Update order to cancelled
          const { error: updateError } = await supabase
            .from("orders")
            .update({ 
              status: "cancelled",
              cancel_reason: cancelReason,
              cancel_source: "auto_24h_abandoned",
            })
            .eq("id", order.id);

          if (updateError) {
            logStep(`Error cancelling ${order.order_number}`, { error: updateError.message });
            results.cancellations.push({ orderId: order.id, success: false, error: updateError.message });
          } else {
            // Send cancellation email
            await supabase.functions.invoke("send-order-email", {
              body: {
                orderId: order.id,
                emailType: "cancelled",
                cancellationReason: cancelReason,
                language: "ro",
              },
            });
            
            // Update email sent timestamp
            await supabase
              .from("orders")
              .update({ cancelled_email_sent_at: now.toISOString() })
              .eq("id", order.id);

            logStep(`Auto-cancelled ${order.order_number} (was: ${order.payment_status})`);
            results.cancellations.push({ orderId: order.id, success: true });
          }
        } catch (err: any) {
          logStep(`Exception cancelling ${order.order_number}`, { error: err.message });
          results.cancellations.push({ orderId: order.id, success: false, error: err.message });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        remindersProcessed: results.reminders.length,
        cancellationsProcessed: results.cancellations.length,
        results 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
