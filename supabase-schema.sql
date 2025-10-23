-- Supabase Schema for Healthcare Care Plan Application
-- Run this in your Supabase SQL editor

-- 1. providers table
create table providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  npi text not null unique check (char_length(npi) = 10),
  created_at timestamptz default now()
);

-- 2. patients table
create table patients (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  mrn text not null unique check (char_length(mrn) = 6),
  provider_id uuid references providers(id) on delete set null,
  date_of_birth date,
  sex text check (sex in ('Male', 'Female', 'Other')),
  weight_kg numeric(5,2),
  allergies text,
  created_at timestamptz default now()
);

-- 3. orders table
create table orders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  medication_name text not null,
  primary_diagnosis text not null,  -- ICD-10 code
  additional_diagnoses text[],      -- list of ICD-10s
  medication_history text[],        -- list of previous meds
  created_at timestamptz default now()
);

-- 4. care_plans table
create table care_plans (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  plan_text text not null,
  generated_by text default 'LLM',
  generated_at timestamptz default now(),
  version int default 1,
  is_final boolean default false
);

-- 5. audit_logs table
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,          -- e.g. 'create_patient', 'generate_plan'
  entity_id uuid,                    -- patient/order/care_plan id
  entity_type text,                  -- 'patient', 'order', 'care_plan'
  description text,
  created_at timestamptz default now()
);

-- Indexes for performance
create index idx_patients_mrn on patients(mrn);
create index idx_providers_npi on providers(npi);
create index idx_orders_patient_medication on orders(patient_id, medication_name, primary_diagnosis);
create index idx_care_plans_order_id on care_plans(order_id);
create index idx_audit_logs_entity on audit_logs(entity_type, entity_id);

-- Disable RLS for now (no authentication)
alter table providers disable row level security;
alter table patients disable row level security;
alter table orders disable row level security;
alter table care_plans disable row level security;
alter table audit_logs disable row level security;
