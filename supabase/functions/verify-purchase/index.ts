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

    // Count delivered orders containing this product
    const { data: deliveredOrders } = await supabase
      .from("orders")
      .select(`
        id,
        order_items!inner(product_id, product_name)
      `)
      .eq("customer_email", normalizedEmail)
      .eq("status", "delivered");

    const deliveredOrdersWithProduct = deliveredOrders?.filter((order: any) => {
      const items = order.order_items as Array<{ product_id: string | null; product_name: string }>;
      return items.some(item => 
        item.product_id === product_id || 
        (product_name_ro && item.product_name.trim().toLowerCase() === product_name_ro.trim().toLowerCase()) ||
        (product_name_en && item.product_name.trim().toLowerCase() === product_name_en.trim().toLowerCase())
      );
    }) || [];

    // Count existing reviews for this product from this customer
    const { data: existingReviews } = await supabase
      .from("reviews")
      .select("id")
      .eq("customer_email", normalizedEmail)
      .eq("product_id", product_id);

    const reviewCount = existingReviews?.length || 0;
    const deliveredCount = deliveredOrdersWithProduct.length;

    // Allow review only if they have more delivered orders than reviews
    if (reviewCount >= deliveredCount) {
      if (deliveredCount === 0) {
        // No delivered orders at all - check if they have pending orders
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
      }

      // They have reviews equal to delivered orders - already reviewed all
      return new Response(
        JSON.stringify({ 
          verified: false, 
          reason: "already_reviewed",
          message_ro: "Ai lăsat deja o recenzie pentru fiecare comandă livrată cu acest produs.",
          message_en: "You have already left a review for each delivered order with this product."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // They can leave a review - return the first order without a review
    return new Response(
      JSON.stringify({ 
        verified: true, 
        order_id: deliveredOrdersWithProduct[reviewCount]?.id 
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
