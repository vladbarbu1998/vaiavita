import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

interface EcoletService {
  slug: string;
  name: string;
  courier_slug: string;
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

// Get available services from Ecolet
async function getEcoletServices(token: string): Promise<EcoletService[]> {
  console.log('Fetching available Ecolet services...');
  
  const response = await fetch('https://panel.ecolet.ro/api/v1/services', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept-Language': 'ro',
    },
  });

  if (!response.ok) {
    console.error('Failed to fetch services:', response.status);
    return [];
  }

  const data = await response.json();
  console.log('Available services:', JSON.stringify(data, null, 2));
  
  return data.services || [];
}

// Search for locality ID by name
async function getLocalityId(token: string, localityName: string, county?: string): Promise<number | null> {
  if (!localityName || localityName.trim().length < 2) {
    console.log('Locality name too short, skipping search');
    return null;
  }

  try {
    const searchQuery = encodeURIComponent(localityName.trim());
    console.log('Searching for locality:', localityName, 'county:', county);
    
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
    console.log('Locality search results:', JSON.stringify(data, null, 2));

    // API returns { localities: [...] }
    const localities = data.localities || [];
    
    if (localities && localities.length > 0) {
      // Try to find exact match with county if provided
      if (county) {
        const normalizedCounty = normalizeRomanianText(county);
        const match = localities.find((loc: any) => {
          const locCounty = normalizeRomanianText(loc.county?.name || '');
          return locCounty.includes(normalizedCounty) || normalizedCounty.includes(locCounty);
        });
        if (match) {
          console.log('Found locality match with county:', match.id, match.name);
          return match.id;
        }
      }
      // Return first result
      console.log('Using first locality result:', localities[0].id, localities[0].name);
      return localities[0].id;
    }

    console.log('No locality found for:', localityName);
    return null;
  } catch (error) {
    console.error('Error searching locality:', error);
    return null;
  }
}

// Normalize Romanian text for comparison
function normalizeRomanianText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ș/g, 's')
    .replace(/ț/g, 't')
    .replace(/ă/g, 'a')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .trim();
}

// Get sender address from address book
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
  console.log('Address book entries:', data.data?.length || 0);
  
  // Return the first address
  if (data.data && data.data.length > 0) {
    const sender = data.data[0];
    console.log('Using sender:', sender.name, 'locality_id:', sender.locality_id);
    return sender;
  }
  
  // Default sender info for VAIAVITA
  return {
    name: 'VAIAVITA S.R.L.',
    country: 'ro',
    county: 'Brasov',
    locality: 'Brasov',
    locality_id: 1578,
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
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 5) return '0700000000';
  if (digits.length > 15) return digits.substring(0, 15);
  return digits;
}

// Clean block field (max 10 characters)
function cleanBlock(block: string | null | undefined): string {
  if (!block || block === '-') return '';
  return block.substring(0, 10);
}

// Select appropriate service based on delivery method
function selectService(services: EcoletService[], deliveryMethod: string): string | null {
  if (!services || services.length === 0) {
    console.log('No services available');
    return null;
  }

  console.log('Selecting service for delivery method:', deliveryMethod);
  console.log('Available services:', services.map(s => s.slug).join(', '));

  // Priority order for courier services (for standard shipping)
  const courierPriority = ['fan_courier_standard', 'dpd_standard', 'gls_standard', 'cargus_standard'];
  
  // For locker delivery, prefer locker-specific services
  const lockerPriority = ['fan_courier_locker', 'sameday_locker', 'dpd_locker'];

  let priorityList = deliveryMethod === 'locker' ? lockerPriority : courierPriority;

  // Try to find a service from priority list
  for (const slug of priorityList) {
    const service = services.find(s => s.slug === slug);
    if (service) {
      console.log('Selected service:', service.slug);
      return service.slug;
    }
  }

  // Fallback to first available service
  const firstService = services[0];
  console.log('Fallback to first service:', firstService.slug);
  return firstService.slug;
}

// Create parcel order in Ecolet
async function createEcoletParcel(token: string, orderData: OrderData, senderAddress: any, services: EcoletService[]): Promise<any> {
  console.log('=== Creating Ecolet Parcel ===');
  console.log('Order:', orderData.orderNumber);
  console.log('Delivery Method:', orderData.deliveryMethod);
  console.log('Payment Method:', orderData.paymentMethod);

  // Build content description from order items
  const contentDescription = orderData.items
    .map(item => `${item.quantity}x ${item.productName}`)
    .join(', ')
    .substring(0, 100);

  // Determine COD - must be boolean for status
  const hasCod = orderData.paymentMethod === 'cash_on_delivery';
  const codAmount = hasCod ? Math.round(orderData.total * 100) / 100 : 0;

  console.log('COD:', hasCod, 'Amount:', codAmount);

  // Check if this is a locker delivery
  const isLockerDelivery = orderData.deliveryMethod === 'locker' && orderData.lockerId;

  // Get receiver locality ID
  let receiverLocalityId: number | null = null;
  if (!isLockerDelivery && orderData.shippingAddress?.city) {
    receiverLocalityId = await getLocalityId(
      token, 
      orderData.shippingAddress.city, 
      orderData.shippingAddress.county
    );
  }

  // Select courier service
  const courierService = selectService(services, orderData.deliveryMethod);
  if (!courierService) {
    throw new Error('No courier service available');
  }

  // Build parcel data according to Ecolet API schema
  const parcelData: any = {
    sender: {
      name: senderAddress.name || 'VAIAVITA S.R.L.',
      country: senderAddress.country || 'ro',
      county: senderAddress.county || 'Brasov',
      locality: senderAddress.locality || 'Brasov',
      locality_id: senderAddress.locality_id,
      postal_code: senderAddress.postal_code || '500001',
      street_name: senderAddress.street_name || 'N/A',
      street_number: senderAddress.street_number || '1',
      block: cleanBlock(senderAddress.block),
      entrance: senderAddress.entrance || '',
      floor: senderAddress.floor || '',
      flat: senderAddress.flat || '',
      contact_person: senderAddress.contact_person || 'VAIAVITA',
      email: senderAddress.email || 'office@vaiavita.com',
      phone: cleanPhoneNumber(senderAddress.phone || '0742661831'),
    },
    parcel: {
      type: 'package', // enum: package, envelope, pallet
      amount: 1,
      weight: 1,
      dimensions: {
        length: 20,
        width: 15,
        height: 10,
      },
      shape: 'standard', // enum: standard, nonstandard
      content: contentDescription || 'Produse cosmetice',
      observations: `Comanda ${orderData.orderNumber}`,
    },
    additional_services: {
      cod: {
        status: hasCod, // MUST be boolean true/false
        ...(hasCod && { amount: codAmount }),
      },
    },
    courier: {
      service: courierService, // e.g., "fan_courier_standard"
    },
  };

  // Add receiver data
  if (isLockerDelivery) {
    console.log('Setting up locker delivery for locker ID:', orderData.lockerId);
    parcelData.receiver = {
      name: `${orderData.customerFirstName} ${orderData.customerLastName}`.substring(0, 60),
      country: 'ro',
      contact_person: `${orderData.customerFirstName} ${orderData.customerLastName}`.substring(0, 60),
      email: orderData.customerEmail,
      phone: cleanPhoneNumber(orderData.customerPhone),
      has_map_point: true,
      map_point_id: parseInt(orderData.lockerId || '0', 10),
    };
  } else {
    // Standard shipping/postal delivery
    const receiverCountry = orderData.shippingAddress?.countryCode?.toLowerCase() || 'ro';
    
    parcelData.receiver = {
      name: `${orderData.customerFirstName} ${orderData.customerLastName}`.substring(0, 60),
      country: receiverCountry,
      county: orderData.shippingAddress?.county || '',
      locality: orderData.shippingAddress?.city || '',
      locality_id: receiverLocalityId,
      postal_code: orderData.shippingAddress?.postalCode || '',
      street_name: (orderData.shippingAddress?.address || 'N/A').substring(0, 50),
      street_number: '1',
      block: cleanBlock(orderData.shippingAddress?.addressLine2),
      entrance: '',
      floor: '',
      flat: '',
      contact_person: `${orderData.customerFirstName} ${orderData.customerLastName}`.substring(0, 60),
      email: orderData.customerEmail,
      phone: cleanPhoneNumber(orderData.customerPhone),
    };
  }

  console.log('Final parcel data:', JSON.stringify(parcelData, null, 2));

  // First, validate the parcel with reload-form
  console.log('Validating parcel with reload-form...');
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

  const reloadText = await reloadResponse.text();
  console.log('Reload-form response status:', reloadResponse.status);
  
  if (!reloadResponse.ok) {
    console.error('Reload-form validation error:', reloadText);
    // Try to parse and log specific errors
    try {
      const errorData = JSON.parse(reloadText);
      console.error('Validation errors:', JSON.stringify(errorData.errors, null, 2));
    } catch (e) {
      // Not JSON, just log as is
    }
  } else {
    console.log('Reload-form validation passed');
    try {
      const reloadData = JSON.parse(reloadText);
      console.log('Available statuses:', Object.keys(reloadData.form?.statuses || {}));
    } catch (e) {
      // Not JSON
    }
  }

  // Save the parcel in "orders to send" tab
  console.log('Saving parcel to orders-to-send...');
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

  const saveText = await saveResponse.text();
  console.log('Save-order-to-send response status:', saveResponse.status);

  if (!saveResponse.ok) {
    console.error('Save-order error:', saveText);
    throw new Error(`Failed to create Ecolet parcel: ${saveResponse.status} - ${saveText}`);
  }

  let saveData;
  try {
    saveData = JSON.parse(saveText);
  } catch (e) {
    saveData = { raw: saveText };
  }
  
  console.log('=== Ecolet Parcel Created Successfully ===');
  console.log('Response:', JSON.stringify(saveData, null, 2));
  
  return saveData;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { 
      orderId, orderNumber, customerFirstName, customerLastName, customerEmail, 
      customerPhone, deliveryMethod, shippingAddress, lockerId, lockerName,
      lockerAddress, total, paymentMethod, items 
    } = requestData;

    console.log('========================================');
    console.log('=== ECOLET INTEGRATION STARTED ===');
    console.log('========================================');
    console.log('Order ID:', orderId);
    console.log('Order Number:', orderNumber);
    console.log('Delivery Method:', deliveryMethod);
    console.log('Payment Method:', paymentMethod);
    console.log('Total:', total);
    console.log('Shipping Address:', JSON.stringify(shippingAddress, null, 2));

    // Only process shipping and postal orders (not pickup)
    if (deliveryMethod === 'pickup') {
      console.log('Skipping Ecolet - pickup order');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Pickup orders do not require Ecolet integration',
          skipped: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Ecolet access token
    const token = await getEcoletToken();
    
    // Get available services
    const services = await getEcoletServices(token);
    
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
      lockerId,
      lockerName,
      lockerAddress,
      total,
      paymentMethod,
      items,
    };
    
    const ecoletResult = await createEcoletParcel(token, orderData, senderAddress, services);

    console.log('========================================');
    console.log('=== ECOLET INTEGRATION COMPLETED ===');
    console.log('========================================');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Parcel created in Ecolet',
        ecoletOrderId: ecoletResult.order_to_send_id || ecoletResult.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('========================================');
    console.error('=== ECOLET INTEGRATION ERROR ===');
    console.error('========================================');
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Ecolet sync failed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
