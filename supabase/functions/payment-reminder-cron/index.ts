import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find orders with failed payments that are exactly 24 hours old (within 1 hour window)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const twentyFiveHoursAgo = new Date();
    twentyFiveHoursAgo.setHours(twentyFiveHoursAgo.getHours() - 25);

    console.log(`Checking for failed payments between ${twentyFiveHoursAgo.toISOString()} and ${twentyFourHoursAgo.toISOString()}`);

    const { data: failedOrders, error: fetchError } = await supabase
      .from("orders")
      .select("id, order_number, customer_email")
      .eq("payment_method", "stripe")
      .eq("payment_status", "failed")
      .eq("status", "pending")
      .gte("created_at", twentyFiveHoursAgo.toISOString())
      .lte("created_at", twentyFourHoursAgo.toISOString());

    if (fetchError) {
      console.error("Error fetching failed orders:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${failedOrders?.length || 0} orders needing payment reminder`);

    const results = [];

    for (const order of failedOrders || []) {
      try {
        // Call the send-order-email function
        const { data, error } = await supabase.functions.invoke("send-order-email", {
          body: {
            orderId: order.id,
            emailType: "payment_reminder",
            language: "ro",
          },
        });

        if (error) {
          console.error(`Error sending reminder for order ${order.order_number}:`, error);
          results.push({ orderId: order.id, success: false, error: error.message });
        } else {
          console.log(`Payment reminder sent for order ${order.order_number}`);
          results.push({ orderId: order.id, success: true });
        }
      } catch (err: any) {
        console.error(`Exception sending reminder for order ${order.order_number}:`, err);
        results.push({ orderId: order.id, success: false, error: err.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processedOrders: failedOrders?.length || 0,
        results 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in payment-reminder-cron:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
