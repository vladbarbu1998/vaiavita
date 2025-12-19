import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[OBLIO-INVOICE] ${step}${detailsStr}`);
};

interface OblioTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface InvoiceRequest {
  action: 'create' | 'view' | 'cancel' | 'delete';
  orderId: string;
  invoiceNumber?: string;
  seriesName?: string;
}

async function getOblioAccessToken(): Promise<string> {
  const email = Deno.env.get("OBLIO_EMAIL") || "office@vaiavita.com";
  const secret = Deno.env.get("OBLIO_SECRET");
  
  if (!secret) {
    throw new Error("OBLIO_SECRET not configured");
  }

  logStep("Getting Oblio access token");

  const response = await fetch("https://www.oblio.eu/api/authorize/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: email,
      client_secret: secret,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logStep("Token error", { status: response.status, error: errorText });
    throw new Error(`Failed to get Oblio token: ${errorText}`);
  }

  const data: OblioTokenResponse = await response.json();
  logStep("Token obtained successfully");
  return data.access_token;
}

async function createInvoice(orderId: string, supabaseClient: any, accessToken: string) {
  const cif = Deno.env.get("OBLIO_CIF");
  const seriesName = Deno.env.get("OBLIO_SERIES_NAME") || "VV";

  if (!cif) {
    throw new Error("OBLIO_CIF not configured");
  }

  // Fetch order with items
  const { data: order, error: orderError } = await supabaseClient
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error(`Order not found: ${orderError?.message}`);
  }

  if (order.oblio_invoice_number) {
    throw new Error(`Invoice already exists: ${order.oblio_series_name} ${order.oblio_invoice_number}`);
  }

  logStep("Creating invoice for order", { orderId, orderNumber: order.order_number });

  const shippingAddress = order.shipping_address as any;

  // CRITICAL: Always use customer's billing address from shipping_address
  // This is the address filled by customer in checkout, NOT the pickup/locker location
  let clientAddress = "";
  let clientCity = "";
  let clientState = "";
  let clientCountry = "Romania";

  if (shippingAddress && shippingAddress.address) {
    // Customer billing address from checkout form
    clientAddress = [
      shippingAddress.address,
      shippingAddress.addressLine2
    ].filter(Boolean).join(", ");
    clientCity = shippingAddress.city || "";
    clientState = shippingAddress.county || "";
    clientCountry = shippingAddress.country || "Romania";
  } else {
    // Fallback error - shipping_address should always be present
    logStep("WARNING: No shipping_address found for billing", { 
      orderId, 
      orderNumber: order.order_number,
      deliveryMethod: order.delivery_method
    });
    throw new Error(`Eroare: Adresa de facturare lipsește pentru comanda ${order.order_number}. Verifică datele comenzii.`);
  }

  logStep("Client billing address for invoice", { 
    deliveryMethod: order.delivery_method,
    billingAddress: clientAddress, 
    city: clientCity, 
    state: clientState,
    country: clientCountry
  });

  // Prepare invoice data
  const invoiceData: any = {
    cif: cif,
    client: {
      cif: "", // Person without CIF (empty string instead of fake number)
      name: `${order.customer_first_name} ${order.customer_last_name}`,
      rc: "",
      code: "",
      address: clientAddress,
      state: clientState,
      city: clientCity,
      country: clientCountry,
      iban: "",
      bank: "",
      email: order.customer_email,
      phone: order.customer_phone,
      contact: `${order.customer_first_name} ${order.customer_last_name}`,
      vatPayer: false,
      save: false,
    },
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    seriesName: seriesName,
    orderNumber: order.order_number, // Reference to original order (BT-13)
    collect: order.payment_method === 'cash_on_delivery' ? null : {
      type: "Card",
      documentNumber: order.payment_id || order.order_number,
      value: order.total,
    },
    products: order.order_items.map((item: any) => ({
      name: item.product_name,
      code: item.product_sku || "",
      description: "",
      price: item.unit_price,
      measuringUnit: "buc",
      currency: "RON",
      vatName: "Normala",
      vatPercentage: 19,
      vatIncluded: true,
      quantity: item.quantity,
      productType: "Marfa", // Marfa = goods (decreases stock), Serviciu = service (no stock)
      management: "VVT", // Gestiune name in Oblio
      saveToDb: false,
    })),
    language: "RO",
    precision: 2,
    currency: "RON",
    useStock: 1, // Enable stock deduction (1 = yes, 0 = no)
    sendEmail: true, // Automatically send invoice to customer email
  };

  // Add shipping as separate line if applicable
  if (order.shipping_cost > 0) {
    invoiceData.products.push({
      name: "Transport",
      code: "TRANSPORT",
      description: "",
      price: order.shipping_cost,
      measuringUnit: "buc",
      currency: "RON",
      vatName: "Normala",
      vatPercentage: 19,
      vatIncluded: true,
      quantity: 1,
      productType: "Serviciu",
      saveToDb: false,
    });
  }

  // Add discount as separate line if applicable
  if (order.discount > 0) {
    invoiceData.products.push({
      name: `Discount ${order.coupon_code ? `(${order.coupon_code})` : ''}`,
      code: "DISCOUNT",
      description: "",
      price: -order.discount,
      measuringUnit: "buc",
      currency: "RON",
      vatName: "Normala",
      vatPercentage: 19,
      vatIncluded: true,
      quantity: 1,
      productType: "Serviciu",
      saveToDb: false,
    });
  }

  logStep("Sending invoice to Oblio", { products: invoiceData.products.length });

  const response = await fetch("https://www.oblio.eu/api/docs/invoice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(invoiceData),
  });

  const responseData = await response.json();

  if (!response.ok) {
    logStep("Oblio API error", { status: response.status, error: responseData });
    throw new Error(`Oblio API error: ${JSON.stringify(responseData)}`);
  }

  logStep("Invoice created successfully", responseData);

  // Update order with invoice details
  const { error: updateError } = await supabaseClient
    .from("orders")
    .update({
      oblio_invoice_number: responseData.data.number,
      oblio_series_name: responseData.data.seriesName,
      oblio_invoice_link: responseData.data.link,
      oblio_invoice_date: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (updateError) {
    logStep("Error updating order with invoice", { error: updateError.message });
  }

  return {
    success: true,
    invoiceNumber: responseData.data.number,
    seriesName: responseData.data.seriesName,
    link: responseData.data.link,
  };
}

async function cancelInvoice(orderId: string, supabaseClient: any, accessToken: string) {
  const cif = Deno.env.get("OBLIO_CIF");

  // Fetch order to get invoice details
  const { data: order, error: orderError } = await supabaseClient
    .from("orders")
    .select("oblio_invoice_number, oblio_series_name")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error(`Order not found: ${orderError?.message}`);
  }

  if (!order.oblio_invoice_number) {
    throw new Error("No invoice found for this order");
  }

  logStep("Cancelling invoice", { 
    invoiceNumber: order.oblio_invoice_number, 
    seriesName: order.oblio_series_name 
  });

  const response = await fetch("https://www.oblio.eu/api/docs/invoice", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      cif: cif,
      seriesName: order.oblio_series_name,
      number: order.oblio_invoice_number,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    logStep("Cancel error", { status: response.status, error: errorData });
    throw new Error(`Failed to cancel invoice: ${JSON.stringify(errorData)}`);
  }

  logStep("Invoice cancelled successfully");

  // Clear invoice details from order
  const { error: updateError } = await supabaseClient
    .from("orders")
    .update({
      oblio_invoice_number: null,
      oblio_series_name: null,
      oblio_invoice_link: null,
      oblio_invoice_date: null,
    })
    .eq("id", orderId);

  if (updateError) {
    logStep("Error clearing invoice from order", { error: updateError.message });
  }

  return { success: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { action, orderId, invoiceNumber, seriesName }: InvoiceRequest = await req.json();

    logStep("Request received", { action, orderId });

    if (!orderId && action !== 'view') {
      throw new Error("orderId is required");
    }

    const accessToken = await getOblioAccessToken();

    let result;

    switch (action) {
      case 'create':
        result = await createInvoice(orderId, supabaseClient, accessToken);
        break;

      case 'cancel':
      case 'delete':
        result = await cancelInvoice(orderId, supabaseClient, accessToken);
        break;

      case 'view':
        // For view, we just return the stored link from the order
        const { data: order, error } = await supabaseClient
          .from("orders")
          .select("oblio_invoice_link, oblio_invoice_number, oblio_series_name")
          .eq("id", orderId)
          .single();

        if (error || !order?.oblio_invoice_link) {
          throw new Error("Invoice not found");
        }

        result = {
          success: true,
          link: order.oblio_invoice_link,
          invoiceNumber: order.oblio_invoice_number,
          seriesName: order.oblio_series_name,
        };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
