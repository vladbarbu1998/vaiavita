import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EcoletTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
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

async function getEcoletToken(): Promise<string> {
  const clientId = Deno.env.get('ECOLET_CLIENT_ID');
  const clientSecret = Deno.env.get('ECOLET_CLIENT_SECRET');
  const username = Deno.env.get('ECOLET_USERNAME');
  const password = Deno.env.get('ECOLET_PASSWORD');

  console.log('Authenticating with Ecolet API...');

  const response = await fetch('https://panel.ecolet.ro/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: clientId!,
      client_secret: clientSecret!,
      username: username!,
      password: password!,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Ecolet auth error:', errorText);
    throw new Error(`Ecolet authentication failed: ${response.status}`);
  }

  const data: EcoletTokenResponse = await response.json();
  console.log('Ecolet authentication successful');
  return data.access_token;
}

async function getLockers(token: string, countryCode: string = 'RO'): Promise<EcoletLocker[]> {
  console.log(`Fetching lockers for country: ${countryCode}`);

  const response = await fetch(`https://panel.ecolet.ro/api/v1/map-points/${countryCode}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Ecolet lockers error:', errorText);
    throw new Error(`Failed to fetch lockers: ${response.status}`);
  }

  const data = await response.json();
  console.log(`Fetched ${data.length || 0} lockers`);
  
  // Map Ecolet response to our format
  const lockers: EcoletLocker[] = (data || []).map((point: any) => ({
    id: point.id?.toString() || point.point_id?.toString(),
    name: point.name || point.point_name || '',
    address: point.address || '',
    city: point.city || point.locality || '',
    county: point.county || point.region || '',
    postal_code: point.postal_code || point.zip_code || '',
    lat: parseFloat(point.lat || point.latitude || 0),
    lng: parseFloat(point.lng || point.longitude || 0),
    courier: point.courier || point.carrier || 'ecolet',
  }));

  return lockers;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { countryCode = 'RO' } = await req.json().catch(() => ({}));

    const token = await getEcoletToken();
    const lockers = await getLockers(token, countryCode);

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
