-- 3D Assets table for 3D model management
CREATE TABLE public.assets_3d (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'glb',
  file_size BIGINT NOT NULL DEFAULT 0,
  format_type TEXT,
  metadata JSONB,
  project_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.assets_3d ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own assets_3d" ON public.assets_3d
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets_3d TO authenticated;
GRANT ALL ON public.assets_3d TO service_role;

CREATE INDEX idx_assets_3d_user ON public.assets_3d(user_id);
CREATE INDEX idx_assets_3d_format ON public.assets_3d(format_type);

CREATE TRIGGER t_assets_3d_upd
  BEFORE UPDATE ON public.assets_3d
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Storage policies for 3d-assets bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('3d-assets', '3d-assets', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "own 3d read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = '3d-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "own 3d insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = '3d-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "own 3d update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = '3d-assets' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = '3d-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "own 3d delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = '3d-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
