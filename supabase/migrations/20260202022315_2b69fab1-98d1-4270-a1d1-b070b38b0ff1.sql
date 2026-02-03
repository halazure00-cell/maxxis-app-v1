-- Create orders table for individual order entries
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_type TEXT NOT NULL DEFAULT 'ride',
  gross_amount NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 0.15,
  commission_amount NUMERIC GENERATED ALWAYS AS (gross_amount * commission_rate) STORED,
  fuel_cost NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC GENERATED ALWAYS AS (gross_amount - (gross_amount * commission_rate) - fuel_cost) STORED,
  pickup_latitude NUMERIC,
  pickup_longitude NUMERIC,
  pickup_name TEXT,
  save_as_hotspot BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own orders"
ON public.orders
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_orders_user_created ON public.orders (user_id, created_at DESC);
CREATE INDEX idx_orders_type ON public.orders (order_type);