-- =============================================
-- FASE 1: SECURITY FIXES
-- Perbaikan RLS policies dan keamanan sistem
-- =============================================

-- 1. Tambah UPDATE policy untuk hotspots (owner only)
CREATE POLICY "Users can update own hotspots"
ON public.hotspots
FOR UPDATE
USING (auth.uid() = submitted_by)
WITH CHECK (auth.uid() = submitted_by);

-- 2. Tambah DELETE policy untuk hotspots (owner only)
CREATE POLICY "Users can delete own hotspots"
ON public.hotspots
FOR DELETE
USING (auth.uid() = submitted_by);

-- 3. Tambah DELETE policy untuk panic_alerts (owner only)
CREATE POLICY "Users can delete their own alerts"
ON public.panic_alerts
FOR DELETE
USING (auth.uid() = user_id);

-- 4. Buat view untuk anonymize submitted_by di hotspots public
CREATE OR REPLACE VIEW public.hotspots_public AS
SELECT 
  id,
  name,
  description,
  latitude,
  longitude,
  category,
  peak_hours,
  upvotes,
  downvotes,
  verified,
  is_safe_zone,
  is_preset,
  created_at,
  CASE 
    WHEN submitted_by = auth.uid() THEN submitted_by
    ELSE NULL
  END as submitted_by,
  CASE 
    WHEN submitted_by = auth.uid() THEN true
    ELSE false
  END as is_owner
FROM public.hotspots;

-- 5. Buat security definer function untuk check hotspot ownership
CREATE OR REPLACE FUNCTION public.is_hotspot_owner(hotspot_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hotspots
    WHERE id = hotspot_id AND submitted_by = auth.uid()
  )
$$;

-- 6. Buat function untuk rate limiting panic alerts (max 5/jam)
CREATE OR REPLACE FUNCTION public.check_panic_alert_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alert_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO alert_count
  FROM public.panic_alerts
  WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '1 hour';
  
  IF alert_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded: maximum 5 panic alerts per hour';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 7. Tambah trigger untuk rate limiting panic alerts
CREATE TRIGGER panic_alert_rate_limit_trigger
BEFORE INSERT ON public.panic_alerts
FOR EACH ROW
EXECUTE FUNCTION public.check_panic_alert_rate_limit();

-- 8. Tambah constraint validasi untuk orders
ALTER TABLE public.orders
ADD CONSTRAINT orders_gross_amount_check CHECK (gross_amount >= 0 AND gross_amount <= 10000000);

ALTER TABLE public.orders
ADD CONSTRAINT orders_fuel_cost_check CHECK (fuel_cost >= 0);

ALTER TABLE public.orders
ADD CONSTRAINT orders_commission_rate_check CHECK (commission_rate >= 0 AND commission_rate <= 1);

-- 9. Tambah constraint validasi untuk profiles
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_rating_check CHECK (current_rating >= 0 AND current_rating <= 1);

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_commission_rate_check CHECK (commission_rate >= 0 AND commission_rate <= 1);