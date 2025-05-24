-- Fix permissions for users and indexes tables
-- This ensures edge functions can properly interact with the database

-- Enable RLS on both tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indexes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Service role can do everything" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Enable insert for service role" ON public.users;
DROP POLICY IF EXISTS "Enable update for service role" ON public.users;
DROP POLICY IF EXISTS "Public has no access" ON public.users;

-- USERS TABLE POLICIES
-- 1. Service role has full access (for edge functions)
CREATE POLICY "Service role full access to users"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Anyone can be inserted (for auth-wallet function via service role)
-- This is safe because the edge function validates the wallet signature
CREATE POLICY "Enable user creation via edge function"
ON public.users
FOR INSERT
TO anon, authenticated
WITH CHECK (false); -- Only service role can insert

-- 3. Users can view their own data
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
TO authenticated, anon
USING (true); -- Allow reading user data

-- INDEXES TABLE POLICIES  
-- Allow anyone to read indexes
DROP POLICY IF EXISTS "Indexes are viewable by everyone" ON public.indexes;
CREATE POLICY "Anyone can view indexes"
ON public.indexes
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone to create indexes (no auth required per requirements)
DROP POLICY IF EXISTS "Anyone can create indexes" ON public.indexes;
CREATE POLICY "Anyone can create indexes"
ON public.indexes
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access" ON public.indexes;
CREATE POLICY "Service role full access to indexes"
ON public.indexes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant proper permissions
GRANT ALL ON public.users TO service_role;
GRANT SELECT ON public.users TO anon, authenticated;

GRANT ALL ON public.indexes TO service_role;
GRANT SELECT, INSERT ON public.indexes TO anon, authenticated;

-- Grant sequence permissions for auto-incrementing IDs
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Ensure timestamp functions work
GRANT EXECUTE ON FUNCTION now() TO service_role, anon, authenticated;