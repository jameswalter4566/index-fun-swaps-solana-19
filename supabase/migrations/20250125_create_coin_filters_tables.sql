-- Create table for storing agent coin filter parameters
CREATE TABLE IF NOT EXISTS coin_filter_parameters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  filters JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint to ensure one filter set per agent
CREATE UNIQUE INDEX idx_coin_filter_agent ON coin_filter_parameters(agent_id);

-- Create table for storing coin recommendations
CREATE TABLE IF NOT EXISTS coin_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  token_address TEXT NOT NULL,
  token_data JSONB NOT NULL,
  recommendation_reason TEXT,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_coin_recommendations_agent ON coin_recommendations(agent_id);
CREATE INDEX idx_coin_recommendations_created ON coin_recommendations(created_at DESC);

-- Enable RLS
ALTER TABLE coin_filter_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_recommendations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for coin_filter_parameters
CREATE POLICY "Users can view all filter parameters" ON coin_filter_parameters
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "Users can insert their own filter parameters" ON coin_filter_parameters
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own filter parameters" ON coin_filter_parameters
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Create RLS policies for coin_recommendations
CREATE POLICY "Users can view all recommendations" ON coin_recommendations
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "Service role can insert recommendations" ON coin_recommendations
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_coin_filter_parameters_updated_at
  BEFORE UPDATE ON coin_filter_parameters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();