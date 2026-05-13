-- Add category column to exams table
alter table public.exams
add column if not exists category text not null default 'sinh_vien'
check (category in ('sinh_vien', 'thpt'));
