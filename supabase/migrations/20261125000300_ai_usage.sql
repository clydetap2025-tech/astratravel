-- AstraTravel AI usage: one row per OpenAI request made for a signed-in user.
-- The server (an Edge Function or the Node server with the service role key) writes rows;
-- users can read their own, which lets the app show how many AI plans are left this hour.

create table public.ai_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid references public.trip_plans (id) on delete set null,
  model text not null,
  status text not null check (status in ('ok', 'error', 'skipped')),
  input_tokens integer check (input_tokens >= 0),
  output_tokens integer check (output_tokens >= 0),
  created_at timestamptz not null default now()
);
create index ai_requests_user_time_idx on public.ai_requests (user_id, created_at desc);

alter table public.ai_requests enable row level security;
create policy "Users read their AI requests" on public.ai_requests for select to authenticated using ((select auth.uid()) = user_id);

-- AI requests the current user has left in a rolling window (8 per hour by default, like the server's limit).
create or replace function public.ai_requests_left(window_minutes integer default 60, hourly_limit integer default 8)
returns integer
language sql
stable
set search_path = ''
as $$
  select greatest(0, hourly_limit - count(*)::integer)
  from public.ai_requests
  where user_id = (select auth.uid())
    and status = 'ok'
    and created_at > now() - make_interval(mins => window_minutes);
$$;
