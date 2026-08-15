-- Simulations table for managing simulation projects
CREATE TABLE public.simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'physics',
  status TEXT NOT NULL DEFAULT 'draft',
  project_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own simulations" ON public.simulations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulations TO authenticated;
GRANT ALL ON public.simulations TO service_role;

CREATE INDEX idx_simulations_user ON public.simulations(user_id);
CREATE INDEX idx_simulations_status ON public.simulations(status);

CREATE TRIGGER t_simulations_upd
  BEFORE UPDATE ON public.simulations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
