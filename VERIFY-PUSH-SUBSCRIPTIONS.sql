-- SQL to verify push_subscriptions table and check for any issues

-- Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'push_subscriptions'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'push_subscriptions';

-- Count total subscriptions
SELECT COUNT(*) as total_subscriptions FROM push_subscriptions;

-- Show all subscriptions with their keys
SELECT 
    id,
    session_id,
    LEFT(endpoint, 60) || '...' as endpoint_preview,
    subscription->'keys'->>'p256dh' IS NOT NULL as has_p256dh,
    subscription->'keys'->>'auth' IS NOT NULL as has_auth,
    LENGTH(subscription->'keys'->>'p256dh') as p256dh_length,
    LENGTH(subscription->'keys'->>'auth') as auth_length,
    created_at,
    updated_at
FROM push_subscriptions
ORDER BY updated_at DESC;

-- Verify all subscriptions have valid encryption keys
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN subscription->'keys'->>'p256dh' IS NOT NULL THEN 1 END) as with_p256dh,
    COUNT(CASE WHEN subscription->'keys'->>'auth' IS NOT NULL THEN 1 END) as with_auth,
    COUNT(CASE WHEN 
        subscription->'keys'->>'p256dh' IS NOT NULL AND 
        subscription->'keys'->>'auth' IS NOT NULL 
    THEN 1 END) as with_both_keys
FROM push_subscriptions;
