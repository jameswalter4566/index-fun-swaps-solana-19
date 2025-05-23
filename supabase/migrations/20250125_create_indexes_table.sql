-- Create indexes table
CREATE TABLE IF NOT EXISTS public.indexes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tokens JSONB NOT NULL DEFAULT '[]',
  creator_wallet VARCHAR(255) NOT NULL,
  total_market_cap NUMERIC(20, 2) DEFAULT 0,
  average_market_cap NUMERIC(20, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index on creator_wallet for faster queries
CREATE INDEX idx_indexes_creator_wallet ON public.indexes(creator_wallet);

-- Enable RLS
ALTER TABLE public.indexes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view indexes" ON public.indexes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own indexes" ON public.indexes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own indexes" ON public.indexes
  FOR UPDATE USING (creator_wallet = auth.jwt() ->> 'sub');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER indexes_updated_at
  BEFORE UPDATE ON public.indexes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();