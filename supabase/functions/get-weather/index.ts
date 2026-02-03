import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Create Supabase client with user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log(`Processing get-weather for user: ${user.id}`);

    const url = new URL(req.url);
    const latParam = url.searchParams.get('lat') || '-6.9175'; // Default: Bandung
    const lonParam = url.searchParams.get('lon') || '107.6191';

    // Validate and parse coordinates
    const lat = parseFloat(latParam);
    const lon = parseFloat(lonParam);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return new Response(
        JSON.stringify({ error: 'Invalid latitude. Must be between -90 and 90' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (isNaN(lon) || lon < -180 || lon > 180) {
      return new Response(
        JSON.stringify({ error: 'Invalid longitude. Must be between -180 and 180' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Fetching weather for coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);

    // Using Open-Meteo API (free, no API key required) with validated coordinates
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,precipitation&timezone=Asia/Jakarta`;
    
    const response = await fetch(weatherUrl);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Interpret weather code
    const weatherCode = data.current?.weather_code || 0;
    let condition = 'clear';
    let description = 'Cerah';
    let isGoodForDriving = true;

    // WMO Weather interpretation codes
    if (weatherCode >= 0 && weatherCode <= 3) {
      condition = 'clear';
      description = weatherCode === 0 ? 'Cerah' : 'Berawan sebagian';
      isGoodForDriving = true;
    } else if (weatherCode >= 45 && weatherCode <= 48) {
      condition = 'fog';
      description = 'Berkabut';
      isGoodForDriving = false;
    } else if (weatherCode >= 51 && weatherCode <= 57) {
      condition = 'drizzle';
      description = 'Gerimis';
      isGoodForDriving = true;
    } else if (weatherCode >= 61 && weatherCode <= 67) {
      condition = 'rain';
      description = 'Hujan';
      isGoodForDriving = false;
    } else if (weatherCode >= 71 && weatherCode <= 77) {
      condition = 'snow';
      description = 'Salju';
      isGoodForDriving = false;
    } else if (weatherCode >= 80 && weatherCode <= 82) {
      condition = 'showers';
      description = 'Hujan lebat';
      isGoodForDriving = false;
    } else if (weatherCode >= 95) {
      condition = 'thunderstorm';
      description = 'Badai petir';
      isGoodForDriving = false;
    }

    const result = {
      temperature: data.current?.temperature_2m || 0,
      temperatureUnit: data.current_units?.temperature_2m || '°C',
      windSpeed: data.current?.wind_speed_10m || 0,
      precipitation: data.current?.precipitation || 0,
      weatherCode,
      condition,
      description,
      isGoodForDriving,
      timestamp: new Date().toISOString(),
    };

    console.log('Weather data processed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: unknown) {
    console.error('Error fetching weather:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch weather';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
