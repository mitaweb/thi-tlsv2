-- ================================================
-- TLSV2 - Database Schema
-- Run this in Supabase Dashboard > SQL Editor
-- ================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ================================================
-- PROFILES (extends auth.users)
-- ================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  role text not null default 'examiner' check (role in ('admin', 'examiner')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'examiner')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ================================================
-- EXAMS
-- ================================================
create table if not exists public.exams (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  name text not null,
  description text,
  duration_minutes integer not null default 90,
  total_score integer not null default 100,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'archived')),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.exams enable row level security;

create policy "Authenticated users can view exams"
  on public.exams for select
  using (auth.role() = 'authenticated');

create policy "Admins can insert exams"
  on public.exams for insert
  with check (auth.uid() = created_by);

create policy "Admins can update exams"
  on public.exams for update
  using (auth.uid() = created_by);

create policy "Admins can delete exams"
  on public.exams for delete
  using (auth.uid() = created_by);

-- ================================================
-- QUESTIONS
-- ================================================
create table if not exists public.questions (
  id uuid default uuid_generate_v4() primary key,
  exam_id uuid references public.exams(id) on delete cascade not null,
  order_index integer not null default 0,
  type text not null default 'single_choice'
    check (type in ('single_choice', 'multiple_choice', 'text', 'file_upload')),
  content text not null,
  media_url text,
  score integer not null default 1,
  explanation text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.questions enable row level security;

create policy "Authenticated users can view questions"
  on public.questions for select
  using (auth.role() = 'authenticated');

create policy "Admins can manage questions"
  on public.questions for all
  using (auth.uid() = (select created_by from public.exams where id = exam_id));

-- ================================================
-- ANSWER OPTIONS (for choice questions)
-- ================================================
create table if not exists public.answer_options (
  id uuid default uuid_generate_v4() primary key,
  question_id uuid references public.questions(id) on delete cascade not null,
  option_key text not null,
  content text not null,
  is_correct boolean not null default false,
  order_index integer not null default 0,
  created_at timestamptz default now()
);

alter table public.answer_options enable row level security;

create policy "Authenticated users can view answer options"
  on public.answer_options for select
  using (auth.role() = 'authenticated');

create policy "Admins can manage answer options"
  on public.answer_options for all
  using (
    auth.uid() = (
      select created_by from public.exams
      where id = (select exam_id from public.questions where id = question_id)
    )
  );

-- ================================================
-- SESSIONS (exam-taking sessions)
-- ================================================
create table if not exists public.sessions (
  id uuid default uuid_generate_v4() primary key,
  exam_id uuid references public.exams(id) on delete cascade not null,
  code text not null,
  candidate_name text,
  started_at timestamptz default now(),
  ended_at timestamptz,
  status text not null default 'waiting'
    check (status in ('waiting', 'active', 'completed', 'expired')),
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

alter table public.sessions enable row level security;

create policy "Admins can manage sessions"
  on public.sessions for all
  using (auth.role() = 'authenticated');

-- ================================================
-- ANSWERS (candidate answers)
-- ================================================
create table if not exists public.answers (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete cascade not null,
  answer_value text,
  file_url text,
  is_correct boolean,
  score_obtained integer default 0,
  graded_at timestamptz,
  graded_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(session_id, question_id)
);

alter table public.answers enable row level security;

create policy "Admins can manage answers"
  on public.answers for all
  using (auth.role() = 'authenticated');

-- ================================================
-- SCORE HISTORIES
-- ================================================
create table if not exists public.score_histories (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  scored_by uuid references public.profiles(id),
  total_score integer not null,
  max_score integer not null,
  created_at timestamptz default now()
);

alter table public.score_histories enable row level security;

create policy "Admins can manage score histories"
  on public.score_histories for all
  using (auth.role() = 'authenticated');

-- ================================================
-- UPLOADS (file storage metadata)
-- ================================================
create table if not exists public.uploads (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete cascade not null,
  file_name text not null,
  file_size integer,
  mime_type text,
  storage_path text not null,
  created_at timestamptz default now()
);

alter table public.uploads enable row level security;

create policy "Admins can manage uploads"
  on public.uploads for all
  using (auth.role() = 'authenticated');

-- ================================================
-- REALTIME: Enable realtime for relevant tables
-- ================================================
alter publication supabase_realtime add table public.answers;
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.questions;
