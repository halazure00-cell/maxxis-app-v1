-- =============================================
-- FIX SECURITY DEFINER VIEW ISSUE
-- Drop view dengan security definer dan ganti dengan RLS-based approach
-- =============================================

-- 1. Drop the security definer view
DROP VIEW IF EXISTS public.hotspots_public;

-- 2. Buat function INVOKER (bukan DEFINER) untuk mendapatkan hotspots dengan anonymized data
-- Ini lebih aman karena mengikuti RLS policies dari user yang memanggil
CREATE OR REPLACE FUNCTION public.get_hotspots_anonymized()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  category TEXT,
  peak_hours TEXT[],
  upvotes INTEGER,
  downvotes INTEGER,
  verified BOOLEAN,
  is_safe_zone BOOLEAN,
  is_preset BOOLEAN,
  created_at TIMESTAMPTZ,
  is_owner BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    h.id,
    h.name,
    h.description,
    h.latitude,
    h.longitude,
    h.category,
    h.peak_hours,
    h.upvotes,
    h.downvotes,
    h.verified,
    h.is_safe_zone,
    h.is_preset,
    h.created_at,
    (h.submitted_by = auth.uid()) as is_owner
  FROM public.hotspots h
$$;