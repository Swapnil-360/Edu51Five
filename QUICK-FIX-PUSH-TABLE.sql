-- QUICK FIX: Create push_subscriptions table and disable RLS
-- Run this FIRST in your Supabase SQL Editor

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    subscription JSONB NOT NULL,
    endpoint TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_session_id ON push_subscriptions(session_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_updated_at ON push_subscriptions(updated_at DESC);

-- Disable RLS (Row Level Security) for easier testing
-- You can enable it later with proper policies
ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;

-- Verify table exists and is ready
SELECT 
    tablename, 
    schemaname,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'push_subscriptions';

-- Show current subscription count
SELECT COUNT(*) as total_subscriptions FROM push_subscriptions;

-- Show all subscriptions (if any)
SELECT 
    id,
    session_id,
    LEFT(endpoint, 60) || '...' as endpoint_preview,
    created_at,
    updated_at
FROM push_subscriptions
ORDER BY updated_at DESC;
