-- Fix calculate_health_score function to verify user ownership
-- This prevents users from calculating health scores for other users

CREATE OR REPLACE FUNCTION public.calculate_health_score(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rating_score INTEGER := 0;
  v_attribute_score INTEGER := 0;
  v_completion_score INTEGER := 0;
  v_consistency_score INTEGER := 0;
  v_profile RECORD;
  v_order_stats RECORD;
BEGIN
  -- Verify caller owns this data
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot calculate health score for other users';
  END IF;

  SELECT current_rating, attribute_status, attribute_expiry_date
  INTO v_profile FROM public.profiles WHERE user_id = p_user_id;

  IF NOT FOUND THEN RETURN 0; END IF;

  v_rating_score := FLOOR(COALESCE(v_profile.current_rating, 0) * 30);

  IF v_profile.attribute_status = 'active' THEN
    IF v_profile.attribute_expiry_date IS NOT NULL AND 
       v_profile.attribute_expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN
      v_attribute_score := 15;
    ELSE
      v_attribute_score := 20;
    END IF;
  ELSIF v_profile.attribute_status = 'warning' THEN
    v_attribute_score := 10;
  END IF;

  SELECT 
    COALESCE(SUM(orders_completed), 0) as completed,
    COALESCE(SUM(orders_cancelled), 0) as cancelled,
    COALESCE(SUM(orders_auto_rejected), 0) as rejected,
    COUNT(DISTINCT log_date) as active_days
  INTO v_order_stats
  FROM public.order_logs
  WHERE user_id = p_user_id AND log_date >= CURRENT_DATE - INTERVAL '30 days';

  IF (v_order_stats.completed + v_order_stats.cancelled + v_order_stats.rejected) > 0 THEN
    v_completion_score := FLOOR(
      (v_order_stats.completed::NUMERIC / 
       (v_order_stats.completed + v_order_stats.cancelled + v_order_stats.rejected)::NUMERIC) * 30
    );
  ELSE
    v_completion_score := 15;
  END IF;

  v_consistency_score := LEAST(FLOOR(v_order_stats.active_days::NUMERIC / 30 * 20), 20);

  RETURN LEAST(v_rating_score + v_attribute_score + v_completion_score + v_consistency_score, 100);
END;
$function$;