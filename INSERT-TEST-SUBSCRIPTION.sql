-- Test script to insert a sample push subscription for testing
-- This allows us to verify the push notification function works

INSERT INTO push_subscriptions (
    session_id, 
    subscription, 
    endpoint,
    updated_at
) VALUES (
    'test-session-' || gen_random_uuid()::text,
    jsonb_build_object(
        'endpoint', 'https://fcm.googleapis.com/fcm/send/test-endpoint-' || substr(gen_random_uuid()::text, 1, 8),
        'expirationTime', null,
        'keys', jsonb_build_object(
            'p256dh', 'BCVxsr7qy8WImMJV3wC_CvL3MWs59WVxCj2Qs8wMa5Rl1aQKEYvXBKLlrBqAvYqsj2OWE6YEzVIL_dGOaLMU2Ko',
            'auth', 'OPnuIJ2EfZ7cgvg3hgXDZA'
        )
    ),
    'https://fcm.googleapis.com/fcm/send/test-endpoint-' || substr(gen_random_uuid()::text, 1, 8),
    NOW()
);

-- Verify the subscription was inserted
SELECT 
    id,
    session_id,
    LEFT(endpoint, 60) || '...' as endpoint_preview,
    created_at,
    updated_at
FROM push_subscriptions
ORDER BY updated_at DESC
LIMIT 5;
