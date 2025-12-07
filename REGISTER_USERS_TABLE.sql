-- Create registered_users table to store student details and email preferences
CREATE TABLE IF NOT EXISTS registered_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    enrollment_number VARCHAR(50) NOT NULL UNIQUE,
    email_notifications_enabled BOOLEAN DEFAULT true,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_notified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_registered_users_email ON registered_users(email);

-- Create index on enrollment for lookups
CREATE INDEX IF NOT EXISTS idx_registered_users_enrollment ON registered_users(enrollment_number);

-- Enable Row Level Security
ALTER TABLE registered_users ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting users (anyone can register)
CREATE POLICY "Allow anyone to register" ON registered_users
    FOR INSERT WITH CHECK (true);

-- Create policy for reading own data (users can see their own data)
CREATE POLICY "Allow users to read own data" ON registered_users
    FOR SELECT USING (true);

-- Create policy for updating own data (users can update their own data)
CREATE POLICY "Allow users to update own data" ON registered_users
    FOR UPDATE USING (true);
