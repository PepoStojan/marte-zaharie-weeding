-- Allow same table_number across different types (Men 1-26, Women 1-30)
ALTER TABLE public.tables DROP CONSTRAINT tables_table_number_key;
ALTER TABLE public.tables ADD CONSTRAINT tables_table_number_type_unique UNIQUE (table_number, table_type);

-- Renumber Men tables: 31→1, 32→2, ... 56→26
-- Use temp negative offset to avoid mid-update collisions
UPDATE public.tables SET table_number = -(table_number - 30) WHERE table_type = 'Men';
UPDATE public.tables SET table_number = -table_number WHERE table_type = 'Men';
