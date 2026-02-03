import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PanicAlertRequest {
  latitude: number;
  longitude: number;
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  }

  try {
    // Get authorization header
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

    // Get user from JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log(`Processing send-panic-alert for user: ${user.id}`);

    // Parse request body
    let body: PanicAlertRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate required fields
    if (typeof body.latitude !== 'number' || typeof body.longitude !== 'number') {
      return new Response(
        JSON.stringify({ error: 'latitude and longitude are required and must be numbers' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate coordinate ranges
    if (body.latitude < -90 || body.latitude > 90) {
      return new Response(
        JSON.stringify({ error: 'latitude must be between -90 and 90' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (body.longitude < -180 || body.longitude > 180) {
      return new Response(
        JSON.stringify({ error: 'longitude must be between -180 and 180' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Sanitize message (max 500 chars)
    const message = body.message ? String(body.message).slice(0, 500).trim() : null;

    // Rate limiting is handled by database trigger (check_panic_alert_rate_limit)
    // Insert the panic alert
    const { data: alertData, error: alertError } = await supabase
      .from('panic_alerts')
      .insert({
        user_id: user.id,
        latitude: body.latitude,
        longitude: body.longitude,
        message: message,
        status: 'active'
      })
      .select()
      .single();

    if (alertError) {
      console.error('Error creating panic alert:', alertError);
      
      // Check if it's a rate limit error
      if (alertError.message?.includes('Rate limit exceeded')) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded: maximum 5 panic alerts per hour',
            code: 'RATE_LIMIT_EXCEEDED'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      
      return new Response(
        JSON.stringify({ error: alertError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Panic alert created:', alertData.id);

    // Get emergency contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('emergency_contacts')
      .select('id, name, phone, relationship, priority')
      .eq('user_id', user.id)
      .order('priority', { ascending: true })
      .limit(3);

    if (contactsError) {
      console.error('Error fetching emergency contacts:', contactsError);
    }

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('user_id', user.id)
      .single();

    // Generate Google Maps link
    const mapsLink = `https://maps.google.com/maps?q=${body.latitude},${body.longitude}`;

    // Prepare notification data
    const notificationData = {
      alert_id: alertData.id,
      user_name: profile?.full_name || 'Driver',
      user_phone: profile?.phone || null,
      location: {
        latitude: body.latitude,
        longitude: body.longitude,
        maps_link: mapsLink
      },
      message: message,
      contacts_notified: contacts?.length || 0,
      contacts: contacts?.map(c => ({
        name: c.name,
        phone: c.phone,
        relationship: c.relationship
      })) || []
    };

    console.log('Notification data prepared:', {
      alert_id: alertData.id,
      contacts_count: notificationData.contacts_notified
    });

    // In production, you would send SMS/WhatsApp notifications here
    // For now, we just return the data that would be sent

    const result = {
      success: true,
      alert: {
        id: alertData.id,
        status: alertData.status,
        created_at: alertData.created_at
      },
      location: {
        latitude: body.latitude,
        longitude: body.longitude,
        maps_link: mapsLink
      },
      notifications: {
        contacts_found: contacts?.length || 0,
        message_template: `🚨 DARURAT! ${profile?.full_name || 'Driver'} membutuhkan bantuan!\n📍 Lokasi: ${mapsLink}\n${message ? `💬 Pesan: ${message}` : ''}`
      }
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });
  } catch (error: unknown) {
    console.error('Unexpected error in send-panic-alert:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
