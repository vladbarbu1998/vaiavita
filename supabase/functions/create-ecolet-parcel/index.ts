import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EcoletTokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
}

interface OrderData {
  orderId: string;
  orderNumber: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: string;
  shippingAddress: {
    country?: string;
    countryCode?: string;
    address?: string;
    addressLine2?: string;
    city?: string;
    county?: string;
    postalCode?: string;
  } | null;
  lockerId?: string | null;
  lockerName?: string | null;
  lockerAddress?: string | null;
  total: number;
  paymentMethod: string;
  items: Array<{
    productName: string;
    quantity: number;
  }>;
}

// Get OAuth token using password authentication
async function getEcoletToken(): Promise<string> {
  const clientId = Deno.env.get('ECOLET_CLIENT_ID');
  const clientSecret = Deno.env.get('ECOLET_CLIENT_SECRET');
  const username = Deno.env.get('ECOLET_USERNAME');
  const password = Deno.env.get('ECOLET_PASSWORD');

  if (!clientId || !clientSecret || !username || !password) {
    throw new Error('Ecolet credentials not configured');
  }

  console.log('Requesting Ecolet access token...');

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
    console.error('Ecolet auth error:', response.status, errorText);
    throw new Error(`Ecolet authentication failed: ${response.status}`);
  }

  const tokenData: EcoletTokenResponse = await response.json();
  console.log('Ecolet token obtained successfully');
  return tokenData.access_token;
}

// Search for locality ID by name
async function getLocalityId(token: string, localityName: string, county?: string): Promise<number | null> {
  try {
    const searchQuery = encodeURIComponent(localityName);
    const response = await fetch(`https://panel.ecolet.ro/api/v1/locations/RO/localities/${searchQuery}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept-Language': 'ro',
      },
    });

    if (!response.ok) {
      console.error('Locality search failed:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('Locality search results for', localityName, ':', JSON.stringify(data, null, 2));

    if (data.data && data.data.length > 0) {
      // Try to find exact match with county if provided
      if (county) {
        const normalizedCounty = county.toLowerCase().replace(/ș/g, 's').replace(/ț/g, 't').replace(/ă/g, 'a').replace(/â/g, 'a').replace(/î/g, 'i');
        const match = data.data.find((loc: any) => {
          const locCounty = (loc.county?.name || '').toLowerCase().replace(/ș/g, 's').replace(/ț/g, 't').replace(/ă/g, 'a').replace(/â/g, 'a').replace(/î/g, 'i');
          return locCounty.includes(normalizedCounty) || normalizedCounty.includes(locCounty);
        });
        if (match) {
          console.log('Found locality match with county:', match.id, match.name);
          return match.id;
        }
      }
      // Return first result
      console.log('Using first locality result:', data.data[0].id, data.data[0].name);
      return data.data[0].id;
    }

    return null;
  } catch (error) {
    console.error('Error searching locality:', error);
    return null;
  }
}

// Get sender address from address book or settings
async function getSenderAddress(token: string): Promise<any> {
  console.log('Fetching sender address from Ecolet...');
  
  const response = await fetch('https://panel.ecolet.ro/api/v1/address-book', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept-Language': 'ro',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Ecolet address book error:', response.status, errorText);
    throw new Error(`Failed to get sender address: ${response.status}`);
  }

  const data = await response.json();
  console.log('Address book data:', JSON.stringify(data, null, 2));
  
  // Return the first address or a default one
  if (data.data && data.data.length > 0) {
    return data.data[0];
  }
  
  // Default sender info for VAIAVITA
  return {
    name: 'VAIAVITA S.R.L.',
    country: 'ro',
    county: 'Brasov',
    locality: 'Brasov',
    locality_id: 1578, // Brasov locality ID
    postal_code: '500001',
    street_name: 'N/A',
    street_number: 'N/A',
    contact_person: 'VAIAVITA',
    email: 'office@vaiavita.com',
    phone: '0742661831',
  };
}

// Clean phone number to only contain digits (5-15 digits required)
function cleanPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  // Ensure it's between 5 and 15 digits
  if (digits.length < 5) {
    return '0700000000'; // Default fallback
  }
  if (digits.length > 15) {
    return digits.substring(0, 15);
  }
  return digits;
}

// Clean block field (max 10 characters)
function cleanBlock(block: string | null | undefined): string {
  if (!block) return '';
  // Truncate to 10 characters max
  return block.substring(0, 10);
}

// Create parcel order in Ecolet
async function createEcoletParcel(token: string, orderData: OrderData, senderAddress: any): Promise<any> {
  console.log('Creating Ecolet parcel for order:', orderData.orderNumber);

  // Build content description from order items
  const contentDescription = orderData.items
    .map(item => `${item.quantity}x ${item.productName}`)
    .join(', ')
    .substring(0, 100); // Limit to 100 chars

  // Determine COD amount (0 for card payment, total for cash on delivery)
  const codAmount = orderData.paymentMethod === 'cash_on_delivery' ? orderData.total : 0;

  // Check if this is a locker delivery
  const isLockerDelivery = orderData.deliveryMethod === 'locker' && orderData.lockerId;

  // Map country code to lowercase for Ecolet API
  const receiverCountry = orderData.shippingAddress?.countryCode?.toLowerCase() || 'ro';

  // Get locality IDs
  const senderLocalityId = senderAddress.locality_id || await getLocalityId(token, senderAddress.locality || 'Brasov', senderAddress.county);
  const receiverLocalityId = await getLocalityId(token, orderData.shippingAddress?.city || '', orderData.shippingAddress?.county);

  console.log('Sender locality ID:', senderLocalityId);
  console.log('Receiver locality ID:', receiverLocalityId);

  let parcelData: any = {
    sender: {
      name: senderAddress.name || 'VAIAVITA S.R.L.',
      country: senderAddress.country || 'ro',
      county: senderAddress.county || 'Brasov',
      locality: senderAddress.locality || 'Brasov',
      locality_id: senderLocalityId,
      postal_code: senderAddress.postal_code || '500001',
      street_name: senderAddress.street_name || 'N/A',
      street_number: senderAddress.street_number || 'N/A',
      block: cleanBlock(senderAddress.block),
      entrance: senderAddress.entrance || '',
      floor: senderAddress.floor || '',
      flat: senderAddress.flat || '',
      contact_person: senderAddress.contact_person || 'VAIAVITA',
      email: senderAddress.email || 'office@vaiavita.com',
      phone: cleanPhoneNumber(senderAddress.phone || '0742661831'),
    },
    parcel: {
      type: 'package',
      amount: 1,
      weight: 1, // Default weight in kg
      dimensions: {
        length: 20, // Default dimensions in cm
        width: 15,
        height: 10,
      },
      shape: 'box', // Required field: box, envelope, tube
      content: contentDescription || 'Produse cosmetice',
      observations: `Comanda ${orderData.orderNumber}`,
    },
    additional_services: {
      cod: {
        status: codAmount > 0 ? 'active' : 'inactive',
        amount: codAmount > 0 ? codAmount : undefined,
      },
    },
    courier: {
      service: 'standard', // Required: standard, express, economy
      pickup: {
        type: 'no_pickup', // Valid values: scheduled, no_pickup
      },
    },
  };

  if (isLockerDelivery) {
    // Locker delivery - set the locker point ID
    console.log('Creating locker delivery for locker ID:', orderData.lockerId);
    parcelData.receiver = {
      name: `${orderData.customerFirstName} ${orderData.customerLastName}`,
      country: 'ro',
      contact_person: `${orderData.customerFirstName} ${orderData.customerLastName}`,
      email: orderData.customerEmail,
      phone: cleanPhoneNumber(orderData.customerPhone),
      map_point_id: parseInt(orderData.lockerId || '0', 10), // This is the key for locker delivery
    };
  } else {
    // Standard shipping/postal delivery
    parcelData.receiver = {
      name: `${orderData.customerFirstName} ${orderData.customerLastName}`,
      country: receiverCountry,
      county: orderData.shippingAddress?.county || '',
      locality: orderData.shippingAddress?.city || '',
      locality_id: receiverLocalityId,
      postal_code: orderData.shippingAddress?.postalCode || '',
      street_name: orderData.shippingAddress?.address || 'N/A',
      street_number: 'N/A',
      block: cleanBlock(orderData.shippingAddress?.addressLine2),
      entrance: '',
      floor: '',
      flat: '',
      contact_person: `${orderData.customerFirstName} ${orderData.customerLastName}`,
      email: orderData.customerEmail,
      phone: cleanPhoneNumber(orderData.customerPhone),
    };
  }

  console.log('Parcel data:', JSON.stringify(parcelData, null, 2));

  // First, validate the parcel and get available services
  const reloadResponse = await fetch('https://panel.ecolet.ro/api/v1/add-parcel/reload-form', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept-Language': 'ro',
    },
    body: JSON.stringify(parcelData),
  });

  if (!reloadResponse.ok) {
    const errorText = await reloadResponse.text();
    console.error('Ecolet reload-form error:', reloadResponse.status, errorText);
    // Continue anyway, we'll try to save the order
  } else {
    const reloadData = await reloadResponse.json();
    console.log('Available services:', JSON.stringify(reloadData, null, 2));
    
    // Update courier service based on available options if needed
    if (reloadData.couriers && reloadData.couriers.length > 0) {
      const firstCourier = reloadData.couriers[0];
      if (firstCourier.services && firstCourier.services.length > 0) {
        parcelData.courier.service = firstCourier.services[0].slug || 'standard';
        console.log('Using courier service:', parcelData.courier.service);
      }
    }
  }

  // Save the parcel in "orders to send" tab (for manual sending later)
  const saveResponse = await fetch('https://panel.ecolet.ro/api/v1/add-parcel/save-order-to-send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept-Language': 'ro',
    },
    body: JSON.stringify(parcelData),
  });

  if (!saveResponse.ok) {
    const errorText = await saveResponse.text();
    console.error('Ecolet save-order error:', saveResponse.status, errorText);
    throw new Error(`Failed to create Ecolet parcel: ${saveResponse.status} - ${errorText}`);
  }

  const saveData = await saveResponse.json();
  console.log('Ecolet parcel created:', JSON.stringify(saveData, null, 2));
  
  return saveData;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, orderNumber, customerFirstName, customerLastName, customerEmail, 
            customerPhone, deliveryMethod, shippingAddress, total, paymentMethod, items } = await req.json();

    console.log('=== Ecolet Integration Started ===');
    console.log('Order ID:', orderId);
    console.log('Order Number:', orderNumber);
    console.log('Delivery Method:', deliveryMethod);

    // Only process shipping and postal orders (not pickup or locker for now)
    if (deliveryMethod !== 'shipping' && deliveryMethod !== 'postal') {
      console.log('Skipping Ecolet integration - delivery method is not shipping/postal');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Order does not require Ecolet integration',
          skipped: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Ecolet access token
    const token = await getEcoletToken();
    
    // Get sender address
    const senderAddress = await getSenderAddress(token);
    
    // Create parcel in Ecolet
    const orderData: OrderData = {
      orderId,
      orderNumber,
      customerFirstName,
      customerLastName,
      customerEmail,
      customerPhone,
      deliveryMethod,
      shippingAddress,
      total,
      paymentMethod,
      items,
    };
    
    const ecoletResult = await createEcoletParcel(token, orderData, senderAddress);

    console.log('=== Ecolet Integration Completed ===');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Parcel created in Ecolet',
        ecoletOrderId: ecoletResult.order_to_send_id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Ecolet integration error:', error);
    
    // Return success anyway to not block the checkout
    // The order is already created, Ecolet sync can be retried later
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Ecolet sync failed but order was created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
