import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EcoletTokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-ECOLET-AWB] ${step}${detailsStr}`);
};

async function getEcoletToken(): Promise<string> {
  const clientId = Deno.env.get('ECOLET_CLIENT_ID');
  const clientSecret = Deno.env.get('ECOLET_CLIENT_SECRET');
  const username = Deno.env.get('ECOLET_USERNAME');
  const password = Deno.env.get('ECOLET_PASSWORD');

  if (!clientId || !clientSecret || !username || !password) {
    throw new Error('Ecolet credentials not configured');
  }

  logStep('Requesting Ecolet access token...');

  const response = await fetch('https://panel.ecolet.ro/api/v1/oauth/token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: clientId,
      client_secret: clientSecret,
      username: username,
      password: password,
      scope: '',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logStep('Ecolet auth error', { status: response.status, error: errorText });
    throw new Error(`Ecolet authentication failed: ${response.status}`);
  }

  const tokenData: EcoletTokenResponse = await response.json();
  logStep('Ecolet token obtained successfully');
  return tokenData.access_token;
}

async function getOrdersToSend(token: string, orderNumber: string): Promise<any> {
  logStep('Fetching orders to send from Ecolet', { orderNumber });
  
  // Fetch orders to send - paginated, search by order reference
  const response = await fetch(`https://panel.ecolet.ro/api/v1/orders-to-send?page=1&per_page=50&search=${encodeURIComponent(orderNumber)}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept-Language': 'ro',
    },
  });

  // Handle 404 gracefully
  if (response.status === 404) {
    logStep('No orders to send found (404)', { orderNumber });
    return { data: [], total: 0 };
  }

  if (!response.ok) {
    const errorText = await response.text();
    logStep('Ecolet fetch error', { status: response.status, error: errorText });
    return { data: [], total: 0 };
  }

  const data = await response.json();
  logStep('Ecolet orders response', { total: data.total, count: data.data?.length });
  
  return data;
}

async function getShippedOrders(token: string, orderNumber: string): Promise<any> {
  logStep('Fetching shipped orders from Ecolet', { orderNumber });
  
  // Fetch shipped orders - these have AWB
  const response = await fetch(`https://panel.ecolet.ro/api/v1/orders?page=1&per_page=50&search=${encodeURIComponent(orderNumber)}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept-Language': 'ro',
    },
  });

  // Handle 404 gracefully - means no shipped orders found
  if (response.status === 404) {
    logStep('No shipped orders found (404)', { orderNumber });
    return { data: [], total: 0 };
  }

  if (!response.ok) {
    const errorText = await response.text();
    logStep('Ecolet shipped orders error', { status: response.status, error: errorText });
    // Return empty instead of throwing to allow fallback to orders-to-send
    return { data: [], total: 0 };
  }

  const data = await response.json();
  logStep('Ecolet shipped orders response', { total: data.total, count: data.data?.length });
  
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    
    if (!orderId) {
      throw new Error('orderId is required');
    }

    logStep('Starting AWB fetch', { orderId });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch order from database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("order_number, ecolet_order_id, ecolet_synced")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    logStep('Order found', { orderNumber: order.order_number, ecoletSynced: order.ecolet_synced });

    if (!order.ecolet_synced) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Comanda nu a fost încă sincronizată în Ecolet',
          needsSync: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Get Ecolet token
    const token = await getEcoletToken();

    // First, try to find in shipped orders (these have AWB)
    const shippedData = await getShippedOrders(token, order.order_number);
    
    if (shippedData.data && shippedData.data.length > 0) {
      // Find the matching order
      const ecoletOrder = shippedData.data.find((o: any) => 
        o.order_reference === order.order_number || 
        o.observations?.includes(order.order_number)
      );

      if (ecoletOrder && ecoletOrder.awb) {
        logStep('Found AWB in shipped orders', { 
          awb: ecoletOrder.awb, 
          courier: ecoletOrder.courier_name || ecoletOrder.courier?.name 
        });

        // Build tracking URL based on courier
        let trackingUrl = '';
        const courierSlug = ecoletOrder.courier_slug || ecoletOrder.courier?.slug || '';
        const awb = ecoletOrder.awb;

        if (courierSlug.includes('fan_courier') || courierSlug.includes('fan')) {
          trackingUrl = `https://www.fancourier.ro/awb-tracking/?metession=${awb}`;
        } else if (courierSlug.includes('dpd')) {
          trackingUrl = `https://tracking.dpd.ro/?parcelno=${awb}`;
        } else if (courierSlug.includes('gls')) {
          trackingUrl = `https://gls-group.com/RO/ro/urmarire-colete?match=${awb}`;
        } else if (courierSlug.includes('cargus')) {
          trackingUrl = `https://www.cargus.ro/tracking-romania/?t=${awb}`;
        } else if (courierSlug.includes('sameday')) {
          trackingUrl = `https://sameday.ro/#/awb/${awb}`;
        }

        // Update order in database with ecolet_order_id
        await supabase
          .from("orders")
          .update({ ecolet_order_id: String(ecoletOrder.id) })
          .eq("id", orderId);

        return new Response(
          JSON.stringify({ 
            success: true,
            awb_number: awb,
            courier_name: ecoletOrder.courier_name || ecoletOrder.courier?.name || 'Curier',
            tracking_url: trackingUrl,
            ecolet_order_id: ecoletOrder.id
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    // If not in shipped, check orders-to-send (AWB might not be generated yet)
    const toSendData = await getOrdersToSend(token, order.order_number);
    
    if (toSendData.data && toSendData.data.length > 0) {
      const pendingOrder = toSendData.data.find((o: any) => 
        o.order_reference === order.order_number || 
        o.observations?.includes(order.order_number)
      );

      if (pendingOrder) {
        // Update ecolet_order_id in database
        await supabase
          .from("orders")
          .update({ ecolet_order_id: String(pendingOrder.id) })
          .eq("id", orderId);

        // Check if this order has AWB (some might have it pre-assigned)
        if (pendingOrder.awb) {
          let trackingUrl = '';
          const courierSlug = pendingOrder.courier_slug || pendingOrder.courier?.slug || '';
          const awb = pendingOrder.awb;

          if (courierSlug.includes('fan_courier') || courierSlug.includes('fan')) {
            trackingUrl = `https://www.fancourier.ro/awb-tracking/?metession=${awb}`;
          } else if (courierSlug.includes('dpd')) {
            trackingUrl = `https://tracking.dpd.ro/?parcelno=${awb}`;
          } else if (courierSlug.includes('gls')) {
            trackingUrl = `https://gls-group.com/RO/ro/urmarire-colete?match=${awb}`;
          } else if (courierSlug.includes('cargus')) {
            trackingUrl = `https://www.cargus.ro/tracking-romania/?t=${awb}`;
          } else if (courierSlug.includes('sameday')) {
            trackingUrl = `https://sameday.ro/#/awb/${awb}`;
          }

          return new Response(
            JSON.stringify({ 
              success: true,
              awb_number: awb,
              courier_name: pendingOrder.courier_name || pendingOrder.courier?.name || 'Curier',
              tracking_url: trackingUrl,
              ecolet_order_id: pendingOrder.id
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
          );
        }

        // Order found but AWB not generated yet
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Comanda este în Ecolet dar AWB-ul nu a fost încă generat. Generează AWB-ul din panoul Ecolet.',
            awbNotGenerated: true,
            ecolet_order_id: pendingOrder.id
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    // Order not found in Ecolet
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Comanda nu a fost găsită în Ecolet. Verifică sincronizarea.',
        notFound: true 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
