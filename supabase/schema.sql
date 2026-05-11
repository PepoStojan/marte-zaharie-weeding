-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tables
CREATE TABLE IF NOT EXISTS public.tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_number INT4 NOT NULL UNIQUE,
  table_type VARCHAR(20) NOT NULL CHECK (table_type IN ('Main', 'Women', 'Men')),
  capacity_limit INT4 NOT NULL DEFAULT 12
);

-- Guests
CREATE TABLE IF NOT EXISTS public.guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT '',
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Capacity enforcement trigger
CREATE OR REPLACE FUNCTION check_table_capacity()
RETURNS TRIGGER AS $$
DECLARE
  current_count INT;
  cap INT;
BEGIN
  IF NEW.table_id IS NOT NULL THEN
    SELECT COUNT(*) INTO current_count
    FROM public.guests
    WHERE table_id = NEW.table_id AND id != NEW.id;

    SELECT capacity_limit INTO cap
    FROM public.tables
    WHERE id = NEW.table_id;

    IF current_count >= cap THEN
      RAISE EXCEPTION 'Table is at full capacity (% / %)', current_count, cap;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_table_capacity ON public.guests;
CREATE TRIGGER enforce_table_capacity
  BEFORE INSERT OR UPDATE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION check_table_capacity();

-- Two-user cap trigger
CREATE OR REPLACE FUNCTION limit_user_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM auth.users) >= 2 THEN
    RAISE EXCEPTION 'Maximum of 2 users allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_user_limit ON auth.users;
CREATE TRIGGER enforce_user_limit
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION limit_user_count();

-- RLS
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read tables"
  ON public.tables FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read guests"
  ON public.guests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert guests"
  ON public.guests FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update guests"
  ON public.guests FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete guests"
  ON public.guests FOR DELETE TO authenticated USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.guests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;

-- Seed 59 tables
INSERT INTO public.tables (table_number, table_type, capacity_limit) VALUES
  (0, 'Main', 12),
  (1, 'Women', 12), (2, 'Women', 12), (3, 'Women', 12), (4, 'Women', 12), (5, 'Women', 12),
  (6, 'Women', 12), (7, 'Women', 12), (8, 'Women', 12), (9, 'Women', 12), (10, 'Women', 12),
  (11, 'Women', 12), (12, 'Women', 12), (13, 'Women', 12), (14, 'Women', 12), (15, 'Women', 12),
  (16, 'Women', 12), (17, 'Women', 12), (18, 'Women', 12), (19, 'Women', 12), (20, 'Women', 12),
  (21, 'Women', 12), (22, 'Women', 12), (23, 'Women', 12), (24, 'Women', 12), (25, 'Women', 12),
  (26, 'Women', 12), (27, 'Women', 12), (28, 'Women', 12), (29, 'Women', 12), (30, 'Women', 12),
  (31, 'Men', 12), (32, 'Men', 12), (33, 'Men', 12), (34, 'Men', 12), (35, 'Men', 12),
  (36, 'Men', 12), (37, 'Men', 12), (38, 'Men', 12), (39, 'Men', 12), (40, 'Men', 12),
  (41, 'Men', 12), (42, 'Men', 12), (43, 'Men', 12), (44, 'Men', 12), (45, 'Men', 12),
  (46, 'Men', 12), (47, 'Men', 12), (48, 'Men', 12), (49, 'Men', 12), (50, 'Men', 12),
  (51, 'Men', 12), (52, 'Men', 12), (53, 'Men', 12), (54, 'Men', 12), (55, 'Men', 12),
  (56, 'Men', 12), (57, 'Men', 12), (58, 'Men', 12)
ON CONFLICT (table_number) DO NOTHING;
