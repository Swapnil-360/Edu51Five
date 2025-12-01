-- Push Notification Database Setup (Safe Version)
-- Handles existing tables and policies gracefully

-- Create push_subscriptions table (only if not exists)
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    subscription JSONB NOT NULL,
    endpoint TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes (only if not exists)
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_session_id ON push_subscriptions(session_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Enable Row Level Security
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow public insert/update push subscriptions" ON push_subscriptions;
    DROP POLICY IF EXISTS "Allow public read push subscriptions" ON push_subscriptions;
    DROP POLICY IF EXISTS "Allow public delete push subscriptions" ON push_subscriptions;
END $$;

-- Create policies
CREATE POLICY "Allow public insert/update push subscriptions" ON push_subscriptions
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public read push subscriptions" ON push_subscriptions
    FOR SELECT
    USING (true);

CREATE POLICY "Allow public delete push subscriptions" ON push_subscriptions
    FOR DELETE
    USING (true);

-- Create or replace functions
CREATE OR REPLACE FUNCTION cleanup_old_push_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM push_subscriptions
    WHERE updated_at < NOW() - INTERVAL '30 days';
END;
$$;

CREATE OR REPLACE FUNCTION get_active_push_subscriptions()
RETURNS TABLE (
    id UUID,
    session_id TEXT,
    subscription JSONB,
    endpoint TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM cleanup_old_push_subscriptions();
    
    RETURN QUERY
    SELECT 
        p.id,
        p.session_id,
        p.subscription,
        p.endpoint
    FROM push_subscriptions p
    WHERE p.updated_at > NOW() - INTERVAL '30 days'
    ORDER BY p.updated_at DESC;
END;
$$;

-- Create notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notice_id TEXT NOT NULL,
    notice_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    recipients_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_logs_notice_id ON notification_logs(notice_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);

-- Enable RLS for notification_logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for notification_logs
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow public read notification logs" ON notification_logs;
    DROP POLICY IF EXISTS "Allow public insert notification logs" ON notification_logs;
END $$;

CREATE POLICY "Allow public read notification logs" ON notification_logs
    FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert notification logs" ON notification_logs
    FOR INSERT
    WITH CHECK (true);

-- Create or replace log function
CREATE OR REPLACE FUNCTION log_notification_send(
    p_notice_id TEXT,
    p_notice_type TEXT,
    p_title TEXT,
    p_body TEXT,
    p_recipients_count INTEGER,
    p_success_count INTEGER,
    p_failure_count INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO notification_logs (
        notice_id,
        notice_type,
        title,
        body,
        recipients_count,
        success_count,
        failure_count
    ) VALUES (
        p_notice_id,
        p_notice_type,
        p_title,
        p_body,
        p_recipients_count,
        p_success_count,
        p_failure_count
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION cleanup_old_push_subscriptions() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_active_push_subscriptions() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION log_notification_send(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER) TO authenticated, anon;

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION update_push_subscription_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_push_subscriptions_timestamp ON push_subscriptions;
CREATE TRIGGER update_push_subscriptions_timestamp
    BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_push_subscription_timestamp();

-- Enable Realtime (safe way)
DO $$
BEGIN
    -- Try to add tables to realtime publication
    -- This won't fail if they're already added
    ALTER PUBLICATION supabase_realtime ADD TABLE push_subscriptions;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notification_logs;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Add comments
COMMENT ON TABLE push_subscriptions IS 'Stores browser push notification subscriptions for users';
COMMENT ON TABLE notification_logs IS 'Logs all push notifications sent to users';
COMMENT ON FUNCTION get_active_push_subscriptions() IS 'Returns all active push subscriptions (updated in last 30 days)';
COMMENT ON FUNCTION cleanup_old_push_subscriptions() IS 'Removes push subscriptions older than 30 days';
COMMENT ON FUNCTION log_notification_send(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER) IS 'Logs a push notification send event';

-- Success message
SELECT 'Push notification database setup completed successfully!' as status;
