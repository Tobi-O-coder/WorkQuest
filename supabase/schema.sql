-- WorkQuest database schema
-- Run this in the Supabase SQL Editor (Database → SQL Editor → New query)

-- Extensions
create extension if not exists "uuid-ossp";

-- ─── COMPANIES ────────────────────────────────────────────────────────────────
create table public.companies (
  id          uuid primary key references auth.users on delete cascade,
  name        text not null,
  logo_url    text,
  website     text,
  industry    text,
  size        text,  -- "1-10", "11-50", "51-200", "201-500", "500+"
  description text,
  created_at  timestamptz not null default now()
);

alter table public.companies enable row level security;

create policy "Anyone can read company profiles"
  on public.companies for select
  using (true);

create policy "Companies can insert own profile"
  on public.companies for insert
  with check (auth.uid() = id);

create policy "Companies can update own profile"
  on public.companies for update
  using (auth.uid() = id);

-- ─── SEEKER PROFILES ──────────────────────────────────────────────────────────
create table public.seeker_profiles (
  id               uuid primary key references auth.users on delete cascade,
  full_name        text,
  title            text,
  location         text,
  remote_pref      text check (remote_pref in ('remote', 'hybrid', 'on-site', 'any')),
  experience_years int,
  skills           text[] default '{}',
  bio              text,
  resume_url       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.seeker_profiles enable row level security;

create policy "Seekers can read own profile"
  on public.seeker_profiles for select
  using (auth.uid() = id);

create policy "Seekers can insert own profile"
  on public.seeker_profiles for insert
  with check (auth.uid() = id);

create policy "Seekers can update own profile"
  on public.seeker_profiles for update
  using (auth.uid() = id);

-- ─── JOBS ─────────────────────────────────────────────────────────────────────
create table public.jobs (
  id               uuid primary key default uuid_generate_v4(),
  company_id       uuid not null references public.companies on delete cascade,
  title            text not null,
  description      text,
  location         text,
  remote           text check (remote in ('remote', 'hybrid', 'on-site')),
  type             text check (type in ('Full-time', 'Part-time', 'Contract', 'Internship')),
  experience       text check (experience in ('Entry', 'Mid', 'Senior', 'Lead')),
  industry         text,
  salary_min       int,
  salary_max       int,
  salary_text      text,
  skills           text[] default '{}',
  is_active        boolean not null default true,
  last_verified_at timestamptz not null default now(),
  expires_at       timestamptz not null default (now() + interval '7 days'),
  views            int not null default 0,
  posted_at        timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

alter table public.jobs enable row level security;

-- Trigger: keep expires_at = last_verified_at + 7 days
create or replace function update_job_expires_at()
returns trigger as $$
begin
  new.expires_at := new.last_verified_at + interval '7 days';
  return new;
end;
$$ language plpgsql;

create trigger jobs_sync_expires_at
  before insert or update of last_verified_at on public.jobs
  for each row execute function update_job_expires_at();

-- RPC: increment view counter safely
create or replace function increment_job_views(job_id uuid)
returns void as $$
  update public.jobs set views = views + 1 where id = job_id;
$$ language sql security definer;

create policy "Anyone can read active jobs"
  on public.jobs for select
  using (is_active = true);

create policy "Companies can read own jobs"
  on public.jobs for select
  using (auth.uid() = company_id);

create policy "Companies can post jobs"
  on public.jobs for insert
  with check (auth.uid() = company_id);

create policy "Companies can update own jobs"
  on public.jobs for update
  using (auth.uid() = company_id);

create policy "Companies can delete own jobs"
  on public.jobs for delete
  using (auth.uid() = company_id);

create index jobs_company_id_idx on public.jobs (company_id);
create index jobs_is_active_idx  on public.jobs (is_active);
create index jobs_expires_at_idx on public.jobs (expires_at);

-- ─── VERIFICATIONS ────────────────────────────────────────────────────────────
create table public.verifications (
  id          uuid primary key default uuid_generate_v4(),
  job_id      uuid not null references public.jobs on delete cascade,
  verified_by uuid not null references auth.users on delete cascade,
  verified_at timestamptz not null default now(),
  notes       text
);

alter table public.verifications enable row level security;

create policy "Companies can log verifications for own jobs"
  on public.verifications for insert
  with check (
    auth.uid() = verified_by and
    exists (select 1 from public.jobs where id = job_id and company_id = auth.uid())
  );

create policy "Companies can read own verifications"
  on public.verifications for select
  using (auth.uid() = verified_by);

create index verifications_job_id_idx on public.verifications (job_id);

-- ─── APPLICATIONS ─────────────────────────────────────────────────────────────
create table public.applications (
  id         uuid primary key default uuid_generate_v4(),
  job_id     uuid not null references public.jobs on delete cascade,
  seeker_id  uuid not null references auth.users on delete cascade,
  cover_note text,
  status     text not null default 'pending'
             check (status in ('pending', 'reviewed', 'shortlisted', 'rejected')),
  applied_at timestamptz not null default now(),
  unique (job_id, seeker_id)
);

alter table public.applications enable row level security;

create policy "Seekers can apply to jobs"
  on public.applications for insert
  with check (auth.uid() = seeker_id);

create policy "Seekers can read own applications"
  on public.applications for select
  using (auth.uid() = seeker_id);

create policy "Companies can read applications for own jobs"
  on public.applications for select
  using (
    exists (select 1 from public.jobs where id = job_id and company_id = auth.uid())
  );

create policy "Companies can update application status"
  on public.applications for update
  using (
    exists (select 1 from public.jobs where id = job_id and company_id = auth.uid())
  );

create index applications_job_id_idx   on public.applications (job_id);
create index applications_seeker_id_idx on public.applications (seeker_id);

-- ─── SAVED JOBS ───────────────────────────────────────────────────────────────
create table public.saved_jobs (
  id        uuid primary key default uuid_generate_v4(),
  job_id    uuid not null references public.jobs on delete cascade,
  seeker_id uuid not null references auth.users on delete cascade,
  saved_at  timestamptz not null default now(),
  unique (job_id, seeker_id)
);

alter table public.saved_jobs enable row level security;

create policy "Seekers can manage own saved jobs"
  on public.saved_jobs for all
  using (auth.uid() = seeker_id)
  with check (auth.uid() = seeker_id);

create index saved_jobs_seeker_id_idx on public.saved_jobs (seeker_id);
