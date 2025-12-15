import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutItem {
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CheckoutRequest {
  items: CheckoutItem[];
  customerEmail: string;
  customerName: string;
  orderId: string;
  orderNumber: string;
  successUrl: string;
  cancelUrl: string;
  discountAmount?: number;
  couponCode?: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-STRIPE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    logStep("Stripe key verified");

    const body: CheckoutRequest = await req.json();
    logStep("Request body received", { 
      itemCount: body.items.length, 
      orderId: body.orderId,
      customerEmail: body.customerEmail 
    });

    // Validate required fields
    if (!body.items || body.items.length === 0) {
      throw new Error("No items provided");
    }
    if (!body.customerEmail) {
      throw new Error("Customer email is required");
    }
    if (!body.orderId) {
      throw new Error("Order ID is required");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ 
      email: body.customerEmail, 
      limit: 1 
    });
    
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      // Create new customer
      const newCustomer = await stripe.customers.create({
        email: body.customerEmail,
        name: body.customerName,
      });
      customerId = newCustomer.id;
      logStep("Created new Stripe customer", { customerId });
    }

    // Calculate total before discount
    const itemsTotal = body.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = body.discountAmount && body.discountAmount > 0 ? body.discountAmount : 0;
    
    logStep("Calculating totals", { itemsTotal, discountAmount });

    let lineItems: any[];
    let stripeCouponId: string | undefined;

    if (discountAmount > 0) {
      // Create a one-time Stripe coupon for this checkout
      const stripeCoupon = await stripe.coupons.create({
        amount_off: Math.round(discountAmount * 100), // Convert to bani
        currency: "ron",
        name: body.couponCode ? `Cupon: ${body.couponCode}` : "Reducere",
        duration: "once",
      });
      stripeCouponId = stripeCoupon.id;
      logStep("Created Stripe coupon", { couponId: stripeCoupon.id, amountOff: discountAmount });
    }

    // Create line items for checkout
    lineItems = body.items.map(item => ({
      price_data: {
        currency: "ron",
        product_data: {
          name: item.name,
          ...(item.image && { images: [item.image] }),
        },
        unit_amount: Math.round(item.price * 100), // Convert to bani (cents)
      },
      quantity: item.quantity,
    }));

    logStep("Created line items", { count: lineItems.length });

    // Create checkout session with optional discount
    const sessionConfig: any = {
      customer: customerId,
      line_items: lineItems,
      mode: "payment",
      success_url: body.successUrl,
      cancel_url: body.cancelUrl,
      metadata: {
        orderId: body.orderId,
        orderNumber: body.orderNumber,
        ...(body.couponCode && { couponCode: body.couponCode }),
        ...(body.discountAmount && { discountAmount: String(body.discountAmount) }),
      },
      payment_intent_data: {
        metadata: {
          orderId: body.orderId,
          orderNumber: body.orderNumber,
          ...(body.couponCode && { couponCode: body.couponCode }),
        },
      },
    };

    // Add discount if coupon was created
    if (stripeCouponId) {
      sessionConfig.discounts = [{ coupon: stripeCouponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
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
