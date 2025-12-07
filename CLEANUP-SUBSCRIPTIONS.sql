-- 🧹 CLEANUP SCRIPT - Run in Supabase SQL Editor
-- This deletes ALL push subscriptions and forces fresh registration

DELETE FROM push_subscriptions;

-- Verify it's empty
SELECT COUNT(*) as subscription_count FROM push_subscriptions;
