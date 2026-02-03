-- =============================================
-- FASE 2B: INDEXES AND FUNCTIONS
-- =============================================

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_created_date ON public.orders (created_at);
CREATE INDEX IF NOT EXISTS idx_hotspots_location ON public.hotspots (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_hotspots_category ON public.hotspots (category);
CREATE INDEX IF NOT EXISTS idx_order_logs_user_date ON public.order_logs (user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON public.daily_summaries (user_id, summary_date DESC);
CREATE INDEX IF NOT EXISTS idx_panic_alerts_user_status ON public.panic_alerts (user_id, status);

-- Function untuk calculate daily summary
CREATE OR REPLACE FUNCTION public.calculate_daily_summary(
  p_user_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS public.daily_summaries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result public.daily_summaries;
  v_orders_by_type JSONB;
BEGIN
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
$$;

-- Function untuk calculate health score
CREATE OR REPLACE FUNCTION public.calculate_health_score(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rating_score INTEGER := 0;
  v_attribute_score INTEGER := 0;
  v_completion_score INTEGER := 0;
  v_consistency_score INTEGER := 0;
  v_profile RECORD;
  v_order_stats RECORD;
BEGIN
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
$$;

-- Trigger function untuk auto-update daily summary
CREATE OR REPLACE FUNCTION public.trigger_update_daily_summary()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.calculate_daily_summary(NEW.user_id, DATE(NEW.created_at));
  
  UPDATE public.profiles
  SET 
    earnings_today = (
      SELECT COALESCE(SUM(net_amount), 0) FROM public.orders
      WHERE user_id = NEW.user_id AND DATE(created_at) = CURRENT_DATE
    ),
    total_orders_today = (
      SELECT COUNT(*) FROM public.orders
      WHERE user_id = NEW.user_id AND DATE(created_at) = CURRENT_DATE
    ),
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_update_daily_summary ON public.orders;
CREATE TRIGGER orders_update_daily_summary
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.trigger_update_daily_summary();

DROP TRIGGER IF EXISTS update_daily_summaries_updated_at ON public.daily_summaries;
CREATE TRIGGER update_daily_summaries_updated_at
BEFORE UPDATE ON public.daily_summaries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function untuk get nearby hotspots
CREATE OR REPLACE FUNCTION public.get_nearby_hotspots(
  p_lat NUMERIC, p_lng NUMERIC, p_radius_km NUMERIC DEFAULT 5
)
RETURNS TABLE (
  id UUID, name TEXT, description TEXT, latitude NUMERIC, longitude NUMERIC,
  category TEXT, peak_hours TEXT[], upvotes INTEGER, downvotes INTEGER,
  verified BOOLEAN, is_safe_zone BOOLEAN, is_preset BOOLEAN, distance_km NUMERIC
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT h.id, h.name, h.description, h.latitude, h.longitude, h.category,
    h.peak_hours, h.upvotes, h.downvotes, h.verified, h.is_safe_zone, h.is_preset,
    ROUND(6371 * acos(cos(radians(p_lat)) * cos(radians(h.latitude)) *
      cos(radians(h.longitude) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(h.latitude)))::NUMERIC, 2) as distance_km
  FROM public.hotspots h
  WHERE h.latitude BETWEEN p_lat - (p_radius_km / 111.0) AND p_lat + (p_radius_km / 111.0)
    AND h.longitude BETWEEN p_lng - (p_radius_km / (111.0 * cos(radians(p_lat)))) 
                        AND p_lng + (p_radius_km / (111.0 * cos(radians(p_lat))))
    AND 6371 * acos(cos(radians(p_lat)) * cos(radians(h.latitude)) *
      cos(radians(h.longitude) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(h.latitude))) <= p_radius_km
  ORDER BY distance_km ASC
$$;

-- Function untuk reset daily stats
CREATE OR REPLACE FUNCTION public.reset_daily_profile_stats()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET earnings_today = 0, total_orders_today = 0, updated_at = NOW();
END;
$$;