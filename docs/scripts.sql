-- 1) Tipos
create type app_role as enum ('paciente','cuidador');
create type unit as enum ('mg','ml','tableta','cápsula','gotas','puff');
create type dose_status as enum ('scheduled','notified','done','skipped','late');

-- 2) Perfil con rol
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role app_role not null,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "yo leo mi perfil"
on public.profiles
for select using (auth.uid() = user_id);

create policy "yo edito mi perfil"
on public.profiles
for update using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 3) Vínculo cuidador ←→ paciente
create table public.caregiver_links (
  patient_user_id uuid references auth.users(id) on delete cascade,
  caregiver_user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (patient_user_id, caregiver_user_id)
);

alter table public.caregiver_links enable row level security;

create policy "paciente gestiona links"
on public.caregiver_links
for all
using (auth.uid() = patient_user_id)
with check (auth.uid() = patient_user_id);

create policy "paciente o cuidador ven links"
on public.caregiver_links
for select
using (
  auth.uid() = patient_user_id
  or auth.uid() = caregiver_user_id
);

-- 4) Medicamentos
create table public.medications (
  id uuid primary key default gen_random_uuid(),
  patient_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  dose numeric(10,2),
  unit unit,
  notes text,
  image_url text,           -- URL pública o firmada desde Storage
  created_at timestamptz default now()
);

alter table public.medications enable row level security;

-- Paciente: CRUD total sobre sus medicamentos
create policy "paciente CRUD meds"
on public.medications
for all
using (auth.uid() = patient_user_id)
with check (auth.uid() = patient_user_id);

-- Cuidador: solo lectura si está vinculado
create policy "cuidador lee meds"
on public.medications
for select
using (
  exists (
    select 1
    from public.caregiver_links cl
    where cl.patient_user_id = medications.patient_user_id
      and cl.caregiver_user_id = auth.uid()
  )
);

-- 5) Schedules (horas fijas por día)
create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  patient_user_id uuid not null references auth.users(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete cascade,
  tz text default 'America/Mexico_City',
  fixed_times time[] not null,         -- ej: {"08:00","20:00"}
  tolerance_minutes int default 30,
  created_at timestamptz default now()
);

alter table public.schedules enable row level security;

create policy "paciente CRUD schedules"
on public.schedules
for all
using (auth.uid() = patient_user_id)
with check (auth.uid() = patient_user_id);

create policy "cuidador lee schedules"
on public.schedules
for select
using (
  exists (
    select 1
    from public.caregiver_links cl
    where cl.patient_user_id = schedules.patient_user_id
      and cl.caregiver_user_id = auth.uid()
  )
);

-- 6) Doses (tomas generadas)
create table public.doses (
  id uuid primary key default gen_random_uuid(),
  patient_user_id uuid not null references auth.users(id) on delete cascade,
  schedule_id uuid not null references public.schedules(id) on delete cascade,
  planned_at timestamptz not null,
  status dose_status default 'scheduled',
  created_at timestamptz default now()
);

alter table public.doses enable row level security;

create policy "paciente lee/actualiza dosis"
on public.doses
for select using (auth.uid() = patient_user_id);

create policy "paciente actualiza dosis"
on public.doses
for update using (auth.uid() = patient_user_id)
with check (auth.uid() = patient_user_id);

create policy "cuidador lee dosis"
on public.doses
for select
using (
  exists (
    select 1
    from public.caregiver_links cl
    where cl.patient_user_id = doses.patient_user_id
      and cl.caregiver_user_id = auth.uid()
  )
);