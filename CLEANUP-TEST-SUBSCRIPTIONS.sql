-- Clean up test subscriptions and keep only real user devices
-- Run this in Supabase SQL Editor

-- Show current subscriptions
SELECT 
    'BEFORE CLEANUP' as status,
    COUNT(*) as total,
    COUNT(CASE WHEN endpoint LIKE '%test-endpoint%' THEN 1 END) as test_count,
    COUNT(CASE WHEN endpoint NOT LIKE '%test-endpoint%' THEN 1 END) as real_count
FROM push_subscriptions;

-- Delete test subscriptions
DELETE FROM push_subscriptions
WHERE endpoint LIKE '%test-endpoint%';

-- Show remaining subscriptions
SELECT 
    'AFTER CLEANUP' as status,
    COUNT(*) as total,
    COUNT(CASE WHEN endpoint LIKE '%test-endpoint%' THEN 1 END) as test_count,
    COUNT(CASE WHEN endpoint NOT LIKE '%test-endpoint%' THEN 1 END) as real_count
FROM push_subscriptions;

-- List all remaining subscriptions (should be only real devices)
SELECT 
    id,
    session_id,
    LEFT(endpoint, 70) || '...' as endpoint_preview,
    created_at,
    updated_at
FROM push_subscriptions
ORDER BY updated_at DESC;
