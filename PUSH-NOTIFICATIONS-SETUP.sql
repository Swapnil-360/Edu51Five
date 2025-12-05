-- Push Notification Database Setup
-- Creates table for storing push notification subscriptions

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    subscription JSONB NOT NULL,
    endpoint TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on session_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_session_id ON push_subscriptions(session_id);

-- Create index on endpoint
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Create index on updated_at for cleanup and active queries
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_updated_at ON push_subscriptions(updated_at DESC);

-- Create composite index for active subscription queries
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(updated_at DESC, id);

-- Enable Row Level Security
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public insert/update push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Allow public read push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Allow public delete push subscriptions" ON push_subscriptions;

-- Create policy to allow anyone to insert/update their own subscription
CREATE POLICY "Allow public insert/update push subscriptions" ON push_subscriptions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create policy to allow anyone to read subscriptions (needed for admin to send notifications)
CREATE POLICY "Allow public read push subscriptions" ON push_subscriptions
    FOR SELECT
    USING (true);

-- Create policy to allow anyone to delete their own subscription
CREATE POLICY "Allow public delete push subscriptions" ON push_subscriptions
    FOR DELETE
    USING (true);

-- Create function to clean up old subscriptions (older than 30 days)
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

-- Create function to get all active push subscriptions
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
    -- Clean up old subscriptions first
    PERFORM cleanup_old_push_subscriptions();
    
    -- Return active subscriptions
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

-- Create notification_logs table to track sent notifications
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

-- Create index on notice_id
CREATE INDEX IF NOT EXISTS idx_notification_logs_notice_id ON notification_logs(notice_id);

-- Create index on sent_at
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);

-- Enable Row Level Security for notification_logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read notification logs" ON notification_logs;
DROP POLICY IF EXISTS "Allow public insert notification logs" ON notification_logs;

-- Create policy to allow anyone to read notification logs
CREATE POLICY "Allow public read notification logs" ON notification_logs
    FOR SELECT
    USING (true);

-- Create policy to allow insert for logging
CREATE POLICY "Allow public insert notification logs" ON notification_logs
    FOR INSERT
    WITH CHECK (true);

-- Create function to log notification send
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

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION cleanup_old_push_subscriptions() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_active_push_subscriptions() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION log_notification_send(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER) TO authenticated, anon;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_push_subscription_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_push_subscriptions_timestamp ON push_subscriptions;

CREATE TRIGGER update_push_subscriptions_timestamp
    BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_push_subscription_timestamp();

-- Enable Realtime for push_subscriptions table (optional, for admin monitoring)
-- Note: These may fail if already added, which is fine
DO $$
BEGIN
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

-- Comments for documentation
COMMENT ON TABLE push_subscriptions IS 'Stores browser push notification subscriptions for users';
COMMENT ON TABLE notification_logs IS 'Logs all push notifications sent to users';
COMMENT ON FUNCTION get_active_push_subscriptions() IS 'Returns all active push subscriptions (updated in last 30 days)';
COMMENT ON FUNCTION cleanup_old_push_subscriptions() IS 'Removes push subscriptions older than 30 days';
COMMENT ON FUNCTION log_notification_send(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER) IS 'Logs a push notification send event';
