-- Strength Box Bristol — Schema
-- Run in Supabase SQL Editor or via Supabase CLI

-- Profiles (extends auth.users with role)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Members
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  email text unique not null,
  full_name text not null,
  phone text,
  date_of_birth date,
  emergency_contact_name text,
  emergency_contact_phone text,
  membership_tier text default 'standard' check (membership_tier in ('standard', 'pt_client', 'class_only')),
  membership_status text default 'active' check (membership_status in ('active', 'notice_period', 'cancelled', 'frozen', 'pending')),
  membership_start date,
  notice_given_date date,
  stripe_customer_id text,
  monthly_rate numeric default 50.00,
  notes text,
  avatar_url text
);

-- Check-ins
create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  checked_in_at timestamptz default now(),
  checked_out_at timestamptz,
  type text default 'gym' check (type in ('gym', 'class', 'pt_session', 'guest'))
);

create index if not exists check_ins_member_id on public.check_ins(member_id);
create index if not exists check_ins_checked_in_at on public.check_ins(checked_in_at);

-- Programmes (before pt_sessions and programme_days)
create table if not exists public.programmes (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  goal text check (goal in ('strength', 'hypertrophy', 'fat_loss', 'general_fitness', 'rehabilitation', 'sport_specific')),
  duration_weeks int,
  notes text,
  active boolean default true
);

-- Programme days
create table if not exists public.programme_days (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete cascade,
  day_number int not null,
  name text
);

-- Programme exercises
create table if not exists public.programme_exercises (
  id uuid primary key default gen_random_uuid(),
  programme_day_id uuid not null references public.programme_days(id) on delete cascade,
  exercise_name text not null,
  order_index int,
  sets int,
  reps text,
  rpe_target numeric,
  rest_seconds int,
  tempo text,
  notes text,
  equipment text,
  superset_group text
);

-- Classes
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  instructor text default 'JK',
  day_of_week int check (day_of_week >= 0 and day_of_week <= 6),
  start_time time,
  duration_minutes int default 45,
  max_capacity int default 12,
  recurring boolean default true
);

-- Class bookings
create table if not exists public.class_bookings (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  date date not null,
  status text default 'booked' check (status in ('booked', 'attended', 'no_show', 'cancelled')),
  booked_at timestamptz default now(),
  unique(class_id, member_id, date)
);

-- PT sessions
create table if not exists public.pt_sessions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  scheduled_at timestamptz,
  duration_minutes int default 60,
  status text default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes text,
  programme_id uuid references public.programmes(id) on delete set null
);

-- Workout logs
create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  logged_at timestamptz default now(),
  programme_day_id uuid references public.programme_days(id) on delete set null,
  duration_minutes int,
  overall_rpe numeric,
  energy_level numeric,
  sleep_quality numeric,
  notes text
);

-- Exercise logs
create table if not exists public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid not null references public.workout_logs(id) on delete cascade,
  exercise_name text not null,
  set_number int,
  weight_kg numeric,
  reps int,
  rpe numeric,
  notes text,
  personal_record boolean default false
);

-- Payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  amount numeric not null,
  currency text default 'gbp',
  status text default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  stripe_payment_id text,
  payment_date date,
  description text
);

-- Guest passes
create table if not exists public.guest_passes (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  guest_name text,
  used_at timestamptz default now(),
  type text default 'monthly_free' check (type in ('monthly_free', 'friend_friday')),
  month_year text
);

-- Body metrics
create table if not exists public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  recorded_at timestamptz default now(),
  weight_kg numeric,
  body_fat_percentage numeric,
  notes text,
  photo_url text
);

-- Equipment library (reference data)
create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  details text
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.check_ins enable row level security;
alter table public.programmes enable row level security;
alter table public.programme_days enable row level security;
alter table public.programme_exercises enable row level security;
alter table public.classes enable row level security;
alter table public.class_bookings enable row level security;
alter table public.pt_sessions enable row level security;
alter table public.workout_logs enable row level security;
alter table public.exercise_logs enable row level security;
alter table public.payments enable row level security;
alter table public.guest_passes enable row level security;
alter table public.body_metrics enable row level security;
alter table public.equipment enable row level security;

-- Profiles: user can read/update own; admin can all
create policy "Profiles select own" on public.profiles for select using (auth.uid() = id);
create policy "Profiles update own" on public.profiles for update using (auth.uid() = id);
create policy "Profiles insert own" on public.profiles for insert with check (auth.uid() = id);
create policy "Profiles admin all" on public.profiles for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Members: admin all; member only own (via user_id)
create policy "Members admin all" on public.members for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Members select own" on public.members for select using (user_id = auth.uid());

-- All other tables: admin full; member only own data (member_id = own member id)
create policy "Check_ins admin" on public.check_ins for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Check_ins own" on public.check_ins for select using (
  member_id in (select id from public.members where user_id = auth.uid())
);

create policy "Programmes admin" on public.programmes for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Programmes own" on public.programmes for select using (
  member_id in (select id from public.members where user_id = auth.uid())
);

create policy "Programme_days admin" on public.programme_days for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Programme_days own" on public.programme_days for select using (
  programme_id in (select id from public.programmes where member_id in (select id from public.members where user_id = auth.uid()))
);

create policy "Programme_exercises admin" on public.programme_exercises for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Programme_exercises own" on public.programme_exercises for select using (
  programme_day_id in (select id from public.programme_days where programme_id in (select id from public.programmes where member_id in (select id from public.members where user_id = auth.uid())))
);

create policy "Classes admin" on public.classes for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Classes select all" on public.classes for select using (true);

create policy "Class_bookings admin" on public.class_bookings for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Class_bookings own" on public.class_bookings for all using (
  member_id in (select id from public.members where user_id = auth.uid())
);

create policy "Pt_sessions admin" on public.pt_sessions for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Pt_sessions own" on public.pt_sessions for select using (
  member_id in (select id from public.members where user_id = auth.uid())
);

create policy "Workout_logs admin" on public.workout_logs for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Workout_logs own" on public.workout_logs for all using (
  member_id in (select id from public.members where user_id = auth.uid())
);

create policy "Exercise_logs admin" on public.exercise_logs for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Exercise_logs own" on public.exercise_logs for all using (
  workout_log_id in (select id from public.workout_logs where member_id in (select id from public.members where user_id = auth.uid()))
);

create policy "Payments admin" on public.payments for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Payments own" on public.payments for select using (
  member_id in (select id from public.members where user_id = auth.uid())
);

create policy "Guest_passes admin" on public.guest_passes for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Guest_passes own" on public.guest_passes for select using (
  member_id in (select id from public.members where user_id = auth.uid())
);

create policy "Body_metrics admin" on public.body_metrics for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Body_metrics own" on public.body_metrics for all using (
  member_id in (select id from public.members where user_id = auth.uid())
);

create policy "Equipment select all" on public.equipment for select using (true);
create policy "Equipment admin" on public.equipment for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Trigger: create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'member');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
