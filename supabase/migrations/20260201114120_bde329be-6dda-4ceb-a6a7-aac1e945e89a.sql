-- Create profiles table for driver information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  join_date DATE DEFAULT CURRENT_DATE,
  attribute_status TEXT DEFAULT 'active' CHECK (attribute_status IN ('active', 'expired', 'warning')),
  attribute_expiry_date DATE,
  current_rating NUMERIC(3,2) DEFAULT 0.00,
  total_orders_today INTEGER DEFAULT 0,
  earnings_today NUMERIC(12,2) DEFAULT 0.00,
  commission_rate NUMERIC(3,2) DEFAULT 0.15,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Create emergency_contacts table
CREATE TABLE public.emergency_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 3),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contacts" 
ON public.emergency_contacts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts" 
ON public.emergency_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" 
ON public.emergency_contacts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" 
ON public.emergency_contacts FOR DELETE USING (auth.uid() = user_id);

-- Create order_logs table for PTO/PBO tracking
CREATE TABLE public.order_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  orders_completed INTEGER DEFAULT 0,
  orders_auto_rejected INTEGER DEFAULT 0,
  orders_cancelled INTEGER DEFAULT 0,
  gross_earnings NUMERIC(12,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.order_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order logs" 
ON public.order_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own order logs" 
ON public.order_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own order logs" 
ON public.order_logs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own order logs" 
ON public.order_logs FOR DELETE USING (auth.uid() = user_id);

-- Create hotspots table for crowdsourced locations
CREATE TABLE public.hotspots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('campus', 'mall', 'school', 'foodcourt', 'office', 'station', 'general')),
  peak_hours TEXT[],
  is_preset BOOLEAN DEFAULT false,
  is_safe_zone BOOLEAN DEFAULT true,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  submitted_by UUID REFERENCES auth.users(id),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hotspots ENABLE ROW LEVEL SECURITY;

-- Everyone can view hotspots
CREATE POLICY "Anyone can view hotspots" 
ON public.hotspots FOR SELECT USING (true);

-- Authenticated users can submit hotspots
CREATE POLICY "Authenticated users can submit hotspots" 
ON public.hotspots FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create panic_alerts table
CREATE TABLE public.panic_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'false_alarm')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.panic_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view their own alerts
CREATE POLICY "Users can view their own alerts" 
ON public.panic_alerts FOR SELECT USING (auth.uid() = user_id);

-- Users can create alerts
CREATE POLICY "Users can create alerts" 
ON public.panic_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own alerts
CREATE POLICY "Users can update their own alerts" 
ON public.panic_alerts FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for panic_alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.panic_alerts;