-- IoT Devices table for device registry
CREATE TABLE public.iot_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'generic',
  device_id TEXT,
  connection_type TEXT,
  connection_config TEXT,
  status TEXT NOT NULL DEFAULT 'offline',
  last_seen TIMESTAMPTZ,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.iot_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own iot_devices" ON public.iot_devices
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.iot_devices TO authenticated;
GRANT ALL ON public.iot_devices TO service_role;

CREATE INDEX idx_iot_devices_user ON public.iot_devices(user_id);
CREATE INDEX idx_iot_devices_status ON public.iot_devices(status);

CREATE TRIGGER t_iot_devices_upd
  BEFORE UPDATE ON public.iot_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
