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
    
    // 24 hours ago (for reminders)
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    
    // 48 hours ago (for auto-cancellation)
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const fortyNineHoursAgo = new Date(now.getTime() - 49 * 60 * 60 * 1000);

    logStep("Starting payment reminder cron job", { 
      reminderWindow: `${twentyFiveHoursAgo.toISOString()} to ${twentyFourHoursAgo.toISOString()}`,
      cancelWindow: `${fortyNineHoursAgo.toISOString()} to ${fortyEightHoursAgo.toISOString()}`
    });

    const results = {
      reminders: [] as any[],
      cancellations: [] as any[]
    };

    // 1. Find orders needing 24h reminder (failed payment, no reminder sent yet)
    const { data: reminderOrders, error: reminderError } = await supabase
      .from("orders")
      .select("id, order_number, customer_email")
      .eq("payment_method", "stripe")
      .eq("payment_status", "failed")
      .eq("status", "pending")
      .is("payment_reminder_sent_at", null)
      .gte("created_at", twentyFiveHoursAgo.toISOString())
      .lte("created_at", twentyFourHoursAgo.toISOString());

    if (reminderError) {
      logStep("Error fetching reminder orders", { error: reminderError.message });
    } else {
      logStep(`Found ${reminderOrders?.length || 0} orders needing reminder`);

      for (const order of reminderOrders || []) {
        try {
          // Send reminder email
          const { error: emailError } = await supabase.functions.invoke("send-order-email", {
            body: {
              orderId: order.id,
              emailType: "payment_reminder",
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
            
            logStep(`Reminder sent for ${order.order_number}`);
            results.reminders.push({ orderId: order.id, success: true });
          }
        } catch (err: any) {
          logStep(`Exception for ${order.order_number}`, { error: err.message });
          results.reminders.push({ orderId: order.id, success: false, error: err.message });
        }
      }
    }

    // 2. Find orders to auto-cancel (48h+ with failed payment)
    const { data: cancelOrders, error: cancelError } = await supabase
      .from("orders")
      .select("id, order_number, customer_email")
      .eq("payment_method", "stripe")
      .eq("payment_status", "failed")
      .eq("status", "pending")
      .gte("created_at", fortyNineHoursAgo.toISOString())
      .lte("created_at", fortyEightHoursAgo.toISOString());

    if (cancelError) {
      logStep("Error fetching cancel orders", { error: cancelError.message });
    } else {
      logStep(`Found ${cancelOrders?.length || 0} orders to auto-cancel`);

      for (const order of cancelOrders || []) {
        try {
          // Update order to cancelled
          const { error: updateError } = await supabase
            .from("orders")
            .update({ 
              status: "cancelled",
              cancel_reason: "Plata nu a fost finalizată în 48 de ore",
              cancel_source: "auto_48h",
              cancelled_email_sent_at: now.toISOString()
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
                cancellationReason: "Plata nu a fost finalizată în 48 de ore",
                language: "ro",
              },
            });

            logStep(`Auto-cancelled ${order.order_number}`);
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
