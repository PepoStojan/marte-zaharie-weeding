-- Reduces Men's side from 28 to 26 tables by removing tables 57 and 58
DELETE FROM public.tables WHERE table_number IN (57, 58) AND table_type = 'Men';
