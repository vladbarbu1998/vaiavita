import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderNumber } = await req.json();

    if (!orderNumber) {
      return new Response(
        JSON.stringify({ error: "Order number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch only the minimal data needed for confirmation page
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("order_number, customer_email, customer_first_name, delivery_method, payment_method, total")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (error) {
      console.error("Error fetching order:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return limited data - mask email for privacy
    const maskedEmail = order.customer_email.replace(
      /(.{2})(.*)(@.+)/,
      (_: string, start: string, middle: string, end: string) => start + "*".repeat(Math.min(middle.length, 5)) + end
    );

    return new Response(
      JSON.stringify({
        order_number: order.order_number,
        customer_email: maskedEmail,
        customer_first_name: order.customer_first_name,
        delivery_method: order.delivery_method,
        payment_method: order.payment_method,
        total: order.total,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
