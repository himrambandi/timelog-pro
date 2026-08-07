CREATE TABLE public.time_entries (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  entry_date DATE NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  work_description TEXT NOT NULL,
  note TEXT,
  billable BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX time_entries_employee_date_idx ON public.time_entries (employee_id, entry_date DESC);

GRANT ALL ON public.time_entries TO service_role;

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;