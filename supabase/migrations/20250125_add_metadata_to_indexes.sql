-- Add metadata column to indexes table
ALTER TABLE public.indexes 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add comment to describe the column
COMMENT ON COLUMN public.indexes.metadata IS 'Additional metadata for the index (phone number, agent type, etc.)';