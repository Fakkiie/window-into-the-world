create extension if not exists pgcrypto;

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'active' check (status in ('active', 'unsubscribed')),
  created_at timestamptz not null default now(),
  last_prompt_sent_at timestamptz,
  country_guess text
);

create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  prompt_text text not null,
  sent_at timestamptz
);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.subscribers(id) on delete cascade,
  prompt_id uuid references public.prompts(id) on delete set null,
  from_email text not null,
  subject text,
  body_text text not null,
  received_at timestamptz not null default now()
);

create index if not exists responses_subscriber_id_idx on public.responses(subscriber_id);
create index if not exists responses_received_at_idx on public.responses(received_at desc);
create index if not exists subscribers_status_idx on public.subscribers(status);

alter table public.subscribers enable row level security;
alter table public.prompts enable row level security;
alter table public.responses enable row level security;

-- Service role bypasses RLS; keep no public policies for Phase 1.
