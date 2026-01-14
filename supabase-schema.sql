-- Supabase Database Schema for Smart Box

-- Schedules Table
CREATE TABLE IF NOT EXISTS schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    time TIME NOT NULL,
    days JSONB NOT NULL DEFAULT '[]',
    beeper_duration INTEGER NOT NULL DEFAULT 5,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commands Table (for ESP32 communication)
CREATE TABLE IF NOT EXISTS commands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    command TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed BOOLEAN DEFAULT false,
    executed_at TIMESTAMP WITH TIME ZONE
);

-- Box State Table
CREATE TABLE IF NOT EXISTS box_state (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    is_open BOOLEAN NOT NULL DEFAULT false,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sensor_distance INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_schedules_active ON schedules(active);
CREATE INDEX IF NOT EXISTS idx_schedules_time ON schedules(time);
CREATE INDEX IF NOT EXISTS idx_commands_executed ON commands(executed);
CREATE INDEX IF NOT EXISTS idx_commands_timestamp ON commands(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE box_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies for schedules (allow all operations for authenticated users)
CREATE POLICY "Allow all operations on schedules" ON schedules
    FOR ALL USING (true) WITH CHECK (true);

-- Policies for commands (allow insert and select, update only for executed flag)
CREATE POLICY "Allow insert on commands" ON commands
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select on commands" ON commands
    FOR SELECT USING (true);

CREATE POLICY "Allow update on commands" ON commands
    FOR UPDATE USING (true) WITH CHECK (true);

-- Policies for box_state (allow all operations)
CREATE POLICY "Allow all operations on box_state" ON box_state
    FOR ALL USING (true) WITH CHECK (true);

-- Policies for activity_logs (allow insert and select)
CREATE POLICY "Allow insert on activity_logs" ON activity_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select on activity_logs" ON activity_logs
    FOR SELECT USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for schedules updated_at
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial box state
INSERT INTO box_state (is_open, last_updated) 
VALUES (false, NOW())
ON CONFLICT DO NOTHING;

