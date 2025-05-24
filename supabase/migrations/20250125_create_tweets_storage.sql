-- Create table for storing KOL tweets
CREATE TABLE IF NOT EXISTS kol_tweets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tweet_id TEXT UNIQUE NOT NULL,
  author_id TEXT NOT NULL,
  author_username TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_verified BOOLEAN DEFAULT false,
  author_profile_image_url TEXT,
  tweet_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metrics JSONB DEFAULT '{}',
  agent_ids TEXT[] DEFAULT '{}',
  CONSTRAINT unique_tweet_id UNIQUE (tweet_id)
);

-- Create indexes for performance
CREATE INDEX idx_kol_tweets_author_username ON kol_tweets(author_username);
CREATE INDEX idx_kol_tweets_created_at ON kol_tweets(created_at DESC);
CREATE INDEX idx_kol_tweets_agent_ids ON kol_tweets USING GIN(agent_ids);
CREATE INDEX idx_kol_tweets_fetched_at ON kol_tweets(fetched_at DESC);

-- Enable RLS
ALTER TABLE kol_tweets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view tweets" ON kol_tweets
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "Service role can insert tweets" ON kol_tweets
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update tweets" ON kol_tweets
  FOR UPDATE TO service_role
  USING (true);

-- Create function to add agent_id to existing tweet
CREATE OR REPLACE FUNCTION add_agent_to_tweet(p_tweet_id TEXT, p_agent_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE kol_tweets
  SET agent_ids = array_append(
    COALESCE(agent_ids, '{}'), 
    p_agent_id
  )
  WHERE tweet_id = p_tweet_id
  AND NOT (p_agent_id = ANY(COALESCE(agent_ids, '{}')));
END;
$$ LANGUAGE plpgsql;

-- Create view for easy querying with agent context
CREATE VIEW agent_tweets AS
SELECT 
  kt.*,
  ai.agent_id
FROM kol_tweets kt
CROSS JOIN UNNEST(kt.agent_ids) AS ai(agent_id);