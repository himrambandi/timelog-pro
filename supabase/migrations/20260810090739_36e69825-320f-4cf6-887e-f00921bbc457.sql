CREATE TABLE public.employees (
  id text PRIMARY KEY,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX employees_name_lower_key ON public.employees (lower(name));

CREATE TABLE public.sites (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

GRANT ALL ON public.sites TO service_role;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX sites_name_lower_key ON public.sites (lower(name));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER employees_set_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER sites_set_updated_at
BEFORE UPDATE ON public.sites
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.employees (id, name, active) VALUES
  ('EMP001', 'Raghu', true),
  ('EMP002', 'Vinayak', true),
  ('EMP003', 'Ashi', true),
  ('EMP004', 'Kevin', true);

INSERT INTO public.sites (id, name) VALUES
  ('SITE001', 'BOSTICK'),
  ('SITE002', 'Ballenger'),
  ('SITE003', 'Horizon'),
  ('SITE004', 'Presbyterian Church');