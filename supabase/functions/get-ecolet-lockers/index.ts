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

interface EcoletLocker {
  id: string;
  name: string;
  address: string;
  city: string;
  county: string;
  postal_code: string;
  lat: number;
  lng: number;
  courier: string;
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
    console.error('Ecolet token error:', response.status, errorText);
    throw new Error(`Ecolet authentication failed: ${response.status}`);
  }

  const data: EcoletTokenResponse = await response.json();
  console.log('Ecolet token obtained successfully');
  return data.access_token;
}

async function getMapPoints(token: string, countryCode: string = 'ro'): Promise<EcoletLocker[]> {
  console.log(`Fetching map points for country: ${countryCode}`);

  // According to Ecolet API docs, destination should be "receiver" or "sender"
  const requestBody = {
    destination: 'receiver',  // This is the key - must be 'receiver' or 'sender'
  };

  console.log('Request body:', JSON.stringify(requestBody));

  const response = await fetch(`https://panel.ecolet.ro/api/v1/map-points/${countryCode.toLowerCase()}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': 'ro',
    },
    body: JSON.stringify(requestBody),
  });

  console.log(`Ecolet map-points response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Ecolet map-points error:', response.status, errorText);
    throw new Error(`Failed to fetch map points: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('Ecolet response keys:', Object.keys(data));
  
  // Response format: { mapPoints: { boundingBox: [...], mapPoints: [...] } }
  const mapPointsData = data?.mapPoints?.mapPoints || data?.mapPoints || [];
  console.log(`Found ${Array.isArray(mapPointsData) ? mapPointsData.length : 0} map points`);

  // Map to our format
  const lockers: EcoletLocker[] = (Array.isArray(mapPointsData) ? mapPointsData : []).map((point: any) => ({
    id: String(point.id || ''),
    name: point.name || '',
    address: point.address || '',
    city: point.locality?.name || point.city || '',
    county: point.locality?.county?.name || point.county || '',
    postal_code: point.locality?.postal_code || point.postal_code || '',
    lat: parseFloat(point.lat || 0),
    lng: parseFloat(point.lng || 0),
    courier: point.courier_slug || point.courier || 'ecolet',
  }));

  return lockers;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { countryCode = 'ro' } = await req.json().catch(() => ({}));

    // Get OAuth token
    const token = await getEcoletToken();
    
    // Fetch map points
    const lockers = await getMapPoints(token, countryCode);

    console.log(`Returning ${lockers.length} lockers to frontend`);

    return new Response(
      JSON.stringify({ success: true, lockers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching lockers:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        lockers: [] 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
