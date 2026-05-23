-- Run this in your Supabase SQL editor

-- Profiles table (auto-created from auth)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  plan text default 'free',
  created_at timestamptz default now()
);

-- Resumes table
create table if not exists resumes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  content jsonb not null,
  created_at timestamptz default now()
);

-- Cover letters table
create table if not exists cover_letters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  resume_id uuid references resumes on delete set null,
  job_title text not null,
  company text not null,
  content text not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table resumes enable row level security;
alter table cover_letters enable row level security;

-- RLS Policies: users can only access their own data
create policy "Users own their profiles" on profiles
  for all using (auth.uid() = id);

create policy "Users own their resumes" on resumes
  for all using (auth.uid() = user_id);

create policy "Users own their cover letters" on cover_letters
  for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
