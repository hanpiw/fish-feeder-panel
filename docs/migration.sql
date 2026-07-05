-- =========================================================================
-- Smart Fish Feeder IoT - Database Setup Migration Script
-- =========================================================================

-- 1. Create devices table
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_name TEXT NOT NULL,
    online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    wifi_strength INTEGER,
    firmware_version TEXT
);

-- 2. Create feed_queue table (for manual feeding commands)
CREATE TABLE IF NOT EXISTS public.feed_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    command TEXT NOT NULL,
    duration INTEGER NOT NULL,
    source TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create schedules table (for daily automated feeding)
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    feed_time TIME WITHOUT TIME ZONE NOT NULL,
    duration INTEGER NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Create feed_logs table (execution history)
CREATE TABLE IF NOT EXISTS public.feed_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    duration INTEGER NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    status TEXT NOT NULL
);

-- =========================================================================
-- Security Configurations (Row Level Security - RLS)
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all for devices" ON public.devices;
DROP POLICY IF EXISTS "Allow all for feed_queue" ON public.feed_queue;
DROP POLICY IF EXISTS "Allow all for schedules" ON public.schedules;
DROP POLICY IF EXISTS "Allow all for feed_logs" ON public.feed_logs;

-- Create policies allowing full access for authenticated users (web app) and anon role (ESP32)
CREATE POLICY "Allow all for devices" ON public.devices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for feed_queue" ON public.feed_queue FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for schedules" ON public.schedules FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for feed_logs" ON public.feed_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- =========================================================================
-- Heartbeat Automatic Trigger (last_seen auto-update)
-- =========================================================================

-- Create function to update last_seen
CREATE OR REPLACE FUNCTION public.update_last_seen_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_seen = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_devices_last_seen ON public.devices;

-- Create trigger on UPDATE devices
CREATE TRIGGER update_devices_last_seen
    BEFORE UPDATE ON public.devices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_last_seen_column();

-- =========================================================================
-- Realtime Subscriptions
-- =========================================================================
BEGIN;
  DO $$ 
  BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;
      ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_queue;
      ALTER PUBLICATION supabase_realtime ADD TABLE public.schedules;
      ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_logs;
    END IF;
  EXCEPTION WHEN others THEN
    -- Ignore errors if tables are already publication members
  END $$;
COMMIT;
