-- =============================================
-- FASE 2A: CREATE TABLES
-- =============================================

-- 1. Buat tabel daily_summaries untuk ringkasan harian otomatis
CREATE TABLE IF NOT EXISTS public.daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  summary_date DATE NOT NULL,
  total_orders INTEGER DEFAULT 0,
  total_gross NUMERIC(12,2) DEFAULT 0,
  total_net NUMERIC(12,2) DEFAULT 0,
  total_fuel_cost NUMERIC(12,2) DEFAULT 0,
  total_commission NUMERIC(12,2) DEFAULT 0,
  orders_by_type JSONB DEFAULT '{}',
  health_score INTEGER DEFAULT 0,
  active_hours NUMERIC(4,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, summary_date)
);

-- 2. Enable RLS untuk daily_summaries
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies untuk daily_summaries
CREATE POLICY "Users can view their own daily summaries"
ON public.daily_summaries FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily summaries"
ON public.daily_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily summaries"
ON public.daily_summaries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily summaries"
ON public.daily_summaries FOR DELETE USING (auth.uid() = user_id);

-- 4. Buat tabel achievements untuk gamifikasi
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  criteria_met JSONB DEFAULT '{}',
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

-- 5. Enable RLS untuk achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies untuk achievements
CREATE POLICY "Users can view their own achievements"
ON public.achievements FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements"
ON public.achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Buat tabel app_settings untuk pengaturan user
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  notification_enabled BOOLEAN DEFAULT true,
  notification_sound BOOLEAN DEFAULT true,
  notification_vibrate BOOLEAN DEFAULT true,
  theme TEXT DEFAULT 'system',
  language TEXT DEFAULT 'id',
  auto_save_hotspot BOOLEAN DEFAULT false,
  default_fuel_cost NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Enable RLS untuk app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies untuk app_settings
CREATE POLICY "Users can view their own settings"
ON public.app_settings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.app_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.app_settings FOR UPDATE USING (auth.uid() = user_id);