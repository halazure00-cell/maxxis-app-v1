-- Fix calculate_daily_summary function to verify user ownership
-- This prevents users from calculating summaries for other users

CREATE OR REPLACE FUNCTION public.calculate_daily_summary(p_user_id uuid, p_date date DEFAULT CURRENT_DATE)
 RETURNS daily_summaries
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result public.daily_summaries;
  v_orders_by_type JSONB;
BEGIN
  -- Verify caller owns this data
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot calculate summary for other users';
  END IF;

  SELECT COALESCE(jsonb_object_agg(order_type, cnt), '{}')
  INTO v_orders_by_type
  FROM (
    SELECT order_type, COUNT(*) as cnt
    FROM public.orders
    WHERE user_id = p_user_id AND DATE(created_at) = p_date
    GROUP BY order_type
  ) t;

  INSERT INTO public.daily_summaries (
    user_id, summary_date, total_orders, total_gross, total_net,
    total_fuel_cost, total_commission, orders_by_type, updated_at
  )
  SELECT 
    p_user_id, p_date, COALESCE(COUNT(*), 0), COALESCE(SUM(gross_amount), 0),
    COALESCE(SUM(net_amount), 0), COALESCE(SUM(fuel_cost), 0),
    COALESCE(SUM(commission_amount), 0), v_orders_by_type, NOW()
  FROM public.orders
  WHERE user_id = p_user_id AND DATE(created_at) = p_date
  ON CONFLICT (user_id, summary_date)
  DO UPDATE SET
    total_orders = EXCLUDED.total_orders,
    total_gross = EXCLUDED.total_gross,
    total_net = EXCLUDED.total_net,
    total_fuel_cost = EXCLUDED.total_fuel_cost,
    total_commission = EXCLUDED.total_commission,
    orders_by_type = EXCLUDED.orders_by_type,
    updated_at = NOW()
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$function$;