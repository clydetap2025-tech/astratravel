-- AstraTravel roles and administration: user roles (user, editor, admin), blocking, a personal AI limit,
-- app-wide settings and an audit log of changes to the catalogue, settings and privileged profile fields.
--
-- The first admin is set by hand in the SQL editor (see README):
--   update public.profiles set role = 'admin' where id = '<auth user id>';
-- The SQL editor runs as postgres, which the privilege guard below lets through.

alter table public.profiles
  add column role text not null default 'user' check (role in ('user', 'editor', 'admin')),
  add column display_name text check (char_length(display_name) <= 60),
  add column blocked_at timestamptz,
  add column blocked_reason text check (char_length(blocked_reason) <= 300),
  -- Null: the app-wide limit from app_settings.ai_daily_limit applies.
  add column ai_daily_limit integer check (ai_daily_limit between 0 and 1000),
  -- An admin's "reset today's counter": messages before this moment do not count for today.
  add column ai_reset_at timestamptz,
  add column last_seen_at timestamptz;

create index profiles_role_idx on public.profiles (role) where role <> 'user';

-- Role checks for policies and functions. security definer so they can read profiles under RLS;
-- a blocked editor or admin loses their rights at once.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and blocked_at is null
  );
$$;

create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('editor', 'admin') and blocked_at is null
  );
$$;

-- Users may edit their own profile, but never their role, block or AI limit. This trigger runs as the
-- caller (not security definer), so current_user is the API role: anon/authenticated are checked,
-- service_role and postgres (SQL editor, migrations) pass.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated')
     and (new.role is distinct from old.role
       or new.blocked_at is distinct from old.blocked_at
       or new.blocked_reason is distinct from old.blocked_reason
       or new.ai_daily_limit is distinct from old.ai_daily_limit
       or new.ai_reset_at is distinct from old.ai_reset_at)
     and not public.is_admin() then
    raise exception 'profile_privileges' using errcode = '42501',
      message = 'Only an admin can change role, blocking or the AI limit';
  end if;
  return new;
end;
$$;
create trigger profiles_guard before update on public.profiles for each row execute function public.guard_profile_privileges();

create policy "Admins read all profiles" on public.profiles for select to authenticated using (public.is_admin());
create policy "Admins update profiles" on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- App-wide settings, edited in the admin panel. Nothing secret lives here, so everyone may read them.
create table public.app_settings (
  key text primary key check (key ~ '^[a-z0-9_]{2,40}$'),
  value jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null default auth.uid()
);
comment on table public.app_settings is 'App-wide settings: AI limit and model, banner, registration. Read by everyone, written by admins.';
create trigger app_settings_touch before update on public.app_settings for each row execute function public.touch_updated_at();

insert into public.app_settings (key, value) values
  ('ai_daily_limit', '15'),
  ('ai_enabled', 'true'),
  ('ai_model', '"gpt-5.4-nano"'),
  ('registration_open', 'true'),
  ('maintenance_message', 'null'),
  -- "Try without signing up": AI messages per day per IP address.
  ('guest_ai_daily_limit', '3'),
  -- Price of the model in US dollars per million tokens, for the cost card in the admin overview.
  ('ai_price_input_per_1m', '0.05'),
  ('ai_price_output_per_1m', '0.40')
on conflict (key) do nothing;

alter table public.app_settings enable row level security;
create policy "Settings are public" on public.app_settings for select to anon, authenticated using (true);
create policy "Admins write settings" on public.app_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- One setting as jsonb, for SQL functions.
create or replace function public.setting(setting_key text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select value from public.app_settings where key = setting_key;
$$;

-- Audit log: who changed what and when, with the row before and after. Written only by the trigger.
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null check (action in ('insert', 'update', 'delete')),
  table_name text not null,
  record_id text not null,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_time_idx on public.audit_log (created_at desc);
create index audit_log_record_idx on public.audit_log (table_name, record_id, created_at desc);
create index audit_log_actor_idx on public.audit_log (actor_id, created_at desc);

alter table public.audit_log enable row level security;
create policy "Admins read the audit log" on public.audit_log for select to authenticated using (public.is_admin());

create or replace function public.write_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  before_row jsonb;
  after_row jsonb;
  row_key text;
begin
  if tg_op in ('UPDATE', 'DELETE') then before_row := to_jsonb(old); end if;
  if tg_op in ('INSERT', 'UPDATE') then after_row := to_jsonb(new); end if;
  if tg_table_name = 'profiles' then
    -- Only the privileged fields are audited for profiles.
    before_row := jsonb_build_object('role', old.role, 'blocked_at', old.blocked_at, 'blocked_reason', old.blocked_reason,
      'ai_daily_limit', old.ai_daily_limit, 'ai_reset_at', old.ai_reset_at);
    after_row := jsonb_build_object('role', new.role, 'blocked_at', new.blocked_at, 'blocked_reason', new.blocked_reason,
      'ai_daily_limit', new.ai_daily_limit, 'ai_reset_at', new.ai_reset_at);
    if before_row = after_row then return null; end if;
  end if;
  row_key := coalesce(after_row, before_row) ->> (case when tg_table_name = 'app_settings' then 'key' else 'id' end);
  if tg_table_name = 'profiles' then row_key := new.id::text; end if;
  insert into public.audit_log (actor_id, action, table_name, record_id, before, after)
  values ((select auth.uid()), lower(tg_op), tg_table_name, row_key, before_row, after_row);
  return null;
end;
$$;

create trigger places_audit after insert or update or delete on public.places for each row execute function public.write_audit();
create trigger cities_audit after insert or update or delete on public.cities for each row execute function public.write_audit();
create trigger app_settings_audit after insert or update or delete on public.app_settings for each row execute function public.write_audit();
create trigger profiles_audit after update on public.profiles for each row execute function public.write_audit();

-- Closing registration in the admin panel stops sign-ups at the database, whatever the client does.
create or replace function public.guard_registration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce((select value from public.app_settings where key = 'registration_open'), 'true'::jsonb) = 'false'::jsonb then
    raise exception 'registration_closed' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger before_auth_user_created before insert on auth.users for each row execute function public.guard_registration();
