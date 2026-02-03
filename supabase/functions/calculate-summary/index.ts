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

    console.log(`Processing calculate-summary for user: ${user.id}`);

    // Parse request body
    let targetDate = new Date().toISOString().split('T')[0]; // Default: today
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.date) {
          // Validate date format (YYYY-MM-DD)
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(body.date)) {
            return new Response(
              JSON.stringify({ error: 'Invalid date format. Use YYYY-MM-DD' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
          }
          targetDate = body.date;
        }
      } catch {
        // If body parsing fails, use default date
        console.log('No body provided, using today as target date');
      }
    }

    console.log(`Calculating summary for date: ${targetDate}`);

    // Call the database function to calculate summary
    const { data: summaryData, error: summaryError } = await supabase.rpc(
      'calculate_daily_summary',
      { p_user_id: user.id, p_date: targetDate }
    );

    if (summaryError) {
      console.error('Error calculating summary:', summaryError);
      return new Response(
        JSON.stringify({ error: summaryError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Get health score
    const { data: healthScore, error: healthError } = await supabase.rpc(
      'calculate_health_score',
      { p_user_id: user.id }
    );

    if (healthError) {
      console.error('Error calculating health score:', healthError);
    }

    // Update the daily summary with health score
    if (summaryData && healthScore !== null) {
      const { error: updateError } = await supabase
        .from('daily_summaries')
        .update({ health_score: healthScore })
        .eq('user_id', user.id)
        .eq('summary_date', targetDate);

      if (updateError) {
        console.error('Error updating health score:', updateError);
      }
    }

    // Get order details for the day
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_type, gross_amount, net_amount, fuel_cost, commission_amount, created_at')
      .eq('user_id', user.id)
      .gte('created_at', `${targetDate}T00:00:00`)
      .lt('created_at', `${targetDate}T23:59:59`)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
    }

    const result = {
      success: true,
      date: targetDate,
      summary: summaryData,
      health_score: healthScore || 0,
      orders_count: orders?.length || 0,
      orders: orders || [],
      calculated_at: new Date().toISOString()
    };

    console.log('Summary calculated successfully:', { date: targetDate, orders_count: result.orders_count });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: unknown) {
    console.error('Unexpected error in calculate-summary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
