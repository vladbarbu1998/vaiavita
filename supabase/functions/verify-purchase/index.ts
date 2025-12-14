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
    const { email, product_id, product_name_ro, product_name_en } = await req.json();

    if (!email || !product_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const normalizedEmail = email.trim().toLowerCase();

    // Check if customer already left a review for this product
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("customer_email", normalizedEmail)
      .eq("product_id", product_id)
      .limit(1);

    if (existingReview && existingReview.length > 0) {
      return new Response(
        JSON.stringify({ 
          verified: false, 
          reason: "already_reviewed",
          message_ro: "Ai lăsat deja o recenzie pentru acest produs.",
          message_en: "You have already left a review for this product."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for delivered orders containing this product
    const { data: orderData } = await supabase
      .from("orders")
      .select(`
        id,
        status,
        order_items!inner(product_id, product_name)
      `)
      .eq("customer_email", normalizedEmail)
      .eq("status", "delivered");

    // Filter orders that contain this product
    const validOrder = orderData?.find((order: any) => {
      const items = order.order_items as Array<{ product_id: string | null; product_name: string }>;
      return items.some(item => 
        item.product_id === product_id || 
        (product_name_ro && item.product_name.trim().toLowerCase() === product_name_ro.trim().toLowerCase()) ||
        (product_name_en && item.product_name.trim().toLowerCase() === product_name_en.trim().toLowerCase())
      );
    });

    if (validOrder) {
      return new Response(
        JSON.stringify({ 
          verified: true, 
          order_id: validOrder.id 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if they have a pending (non-delivered) order
    const { data: pendingOrderData } = await supabase
      .from("orders")
      .select(`
        id,
        status,
        order_items!inner(product_id, product_name)
      `)
      .eq("customer_email", normalizedEmail)
      .neq("status", "delivered");

    const hasPendingOrder = pendingOrderData?.some((order: any) => {
      const items = order.order_items as Array<{ product_id: string | null; product_name: string }>;
      return items.some(item => 
        item.product_id === product_id || 
        (product_name_ro && item.product_name.trim().toLowerCase() === product_name_ro.trim().toLowerCase()) ||
        (product_name_en && item.product_name.trim().toLowerCase() === product_name_en.trim().toLowerCase())
      );
    });

    if (hasPendingOrder) {
      return new Response(
        JSON.stringify({ 
          verified: false, 
          reason: "order_not_delivered",
          message_ro: "Poți lăsa o recenzie doar după ce comanda a fost livrată.",
          message_en: "You can leave a review only after your order has been delivered."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        verified: false, 
        reason: "no_purchase",
        message_ro: "Doar clienții care au cumpărat acest produs pot lăsa o recenzie. Verifică adresa de email folosită la comandă.",
        message_en: "Only customers who have purchased this product can leave a review. Please check the email address used for your order."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error verifying purchase:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
