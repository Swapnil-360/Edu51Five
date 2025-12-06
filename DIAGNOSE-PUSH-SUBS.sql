-- Quick Diagnostic: Check Push Subscriptions Table
-- Run this in your Supabase SQL Editor to diagnose the issue

-- 1. Check if push_subscriptions table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'push_subscriptions'
) AS table_exists;

-- 2. If table exists, count how many subscriptions we have
SELECT COUNT(*) as total_subscriptions FROM push_subscriptions;

-- 3. Show all active subscriptions (last 30 days)
SELECT 
    id,
    session_id,
    endpoint,
    created_at,
    updated_at,
    AGE(NOW(), updated_at) as age
FROM push_subscriptions
WHERE updated_at > NOW() - INTERVAL '30 days'
ORDER BY updated_at DESC;

-- 4. Show subscription details (without sensitive keys)
SELECT 
    id,
    session_id,
    LEFT(endpoint, 50) || '...' as endpoint_preview,
    jsonb_pretty(subscription) as subscription_structure,
    created_at,
    updated_at
FROM push_subscriptions
ORDER BY updated_at DESC
LIMIT 5;
