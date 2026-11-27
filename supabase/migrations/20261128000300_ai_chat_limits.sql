-- Astra AI chat: conversations, messages and a daily limit per user (15 by default), counted in the
-- database so the browser cannot get around it. A day starts at 00:00 in Almaty (Asia/Almaty).
--
-- The server (/api/chat) calls consume_ai_message with the user's JWT before it asks OpenAI;
-- if OpenAI fails it gives the message back with refund_ai_message (service role only).
-- "Try without signing up" uses a separate per-IP counter (consume_guest_ai_message, service role only).

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text check (char_length(title) <= 120),
  city_id text references public.cities (id) on delete set null,
  place_id text references public.places (id) on delete set null,
  -- The user chose "show to support": admins may then read the text of this conversation.
  shared_with_support boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ai_conversations_user_idx on public.ai_conversations (user_id, updated_at desc);
create trigger ai_conversations_touch before update on public.ai_conversations for each row execute function public.touch_updated_at();

create table public.ai_messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 2000),
  tokens integer check (tokens >= 0),
  -- 'refunded': OpenAI failed, the message does not count towards the limit.
  status text not null default 'ok' check (status in ('ok', 'refunded')),
  created_at timestamptz not null default now()
);
create index ai_messages_conversation_idx on public.ai_messages (conversation_id, id);
create index ai_messages_user_day_idx on public.ai_messages (user_id, created_at desc) where role = 'user';

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

create policy "Users read their conversations" on public.ai_conversations for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users start conversations" on public.ai_conversations for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users rename or share their conversations" on public.ai_conversations for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete their conversations" on public.ai_conversations for delete to authenticated
  using ((select auth.uid()) = user_id);
create policy "Admins read conversations shared with support" on public.ai_conversations for select to authenticated
  using (shared_with_support and public.is_admin());

-- Messages are written only by the functions below; users read their own.
create policy "Users read their messages" on public.ai_messages for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Admins read messages shared with support" on public.ai_messages for select to authenticated
  using (public.is_admin() and exists (
    select 1 from public.ai_conversations c where c.id = conversation_id and c.shared_with_support));

-- Start of today in Almaty, as a timestamp.
create or replace function public.almaty_day_start(at_time timestamptz default now())
returns timestamptz
language sql
immutable
set search_path = ''
as $$
  select date_trunc('day', at_time at time zone 'Asia/Almaty') at time zone 'Asia/Almaty';
$$;

-- Messages a user has used today (after an admin's reset, if any).
create or replace function public.ai_messages_used(for_user uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.ai_messages m
  where m.user_id = for_user and m.role = 'user' and m.status = 'ok'
    and m.created_at >= greatest(public.almaty_day_start(),
      coalesce((select p.ai_reset_at from public.profiles p where p.id = for_user), '-infinity'::timestamptz));
$$;
revoke execute on function public.ai_messages_used(uuid) from public, anon, authenticated;

-- The daily limit that applies to a user: their own, else the app-wide one, else 15.
create or replace function public.ai_daily_limit_for(for_user uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.ai_daily_limit from public.profiles p where p.id = for_user),
    (select (s.value #>> '{}')::integer from public.app_settings s where s.key = 'ai_daily_limit'),
    15);
$$;
revoke execute on function public.ai_daily_limit_for(uuid) from public, anon, authenticated;

-- How many messages the current user has left today.
create or replace function public.ai_messages_left()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case when (select auth.uid()) is null then 0
    else greatest(0, public.ai_daily_limit_for((select auth.uid())) - public.ai_messages_used((select auth.uid()))) end;
$$;

-- Everything the chat shows above the input: left, limit, when it resets, whether AI is on and the user is blocked.
create or replace function public.ai_limit_status()
returns table (messages_left integer, daily_limit integer, resets_at timestamptz, ai_enabled boolean, blocked boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.ai_messages_left(),
    public.ai_daily_limit_for((select auth.uid())),
    public.almaty_day_start() + interval '1 day',
    coalesce((select s.value from public.app_settings s where s.key = 'ai_enabled'), 'true'::jsonb) <> 'false'::jsonb,
    coalesce((select p.blocked_at is not null from public.profiles p where p.id = (select auth.uid())), false);
$$;

-- Takes one message from today's allowance and stores it, in one transaction. The profile row is locked
-- (for update), so two tabs sending at once cannot both take the last message.
create or replace function public.consume_ai_message(conversation uuid, content text)
returns table ("left" integer, message_id bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  profile public.profiles;
  allowed integer;
  used integer;
  new_id bigint;
begin
  if uid is null then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  select * into profile from public.profiles where id = uid for update;
  if not found then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  if profile.blocked_at is not null then
    raise exception 'account_blocked' using errcode = 'P0001';
  end if;
  if coalesce((select s.value from public.app_settings s where s.key = 'ai_enabled'), 'true'::jsonb) = 'false'::jsonb then
    raise exception 'ai_disabled' using errcode = 'P0001';
  end if;
  if content is null or char_length(btrim(content)) = 0 or char_length(content) > 2000 then
    raise exception 'invalid_input' using errcode = '22023';
  end if;
  if not exists (select 1 from public.ai_conversations c where c.id = conversation and c.user_id = uid) then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  -- Rate limit: at most 6 messages a minute, whatever the daily allowance.
  if (select count(*) from public.ai_messages m
      where m.user_id = uid and m.role = 'user' and m.created_at > now() - interval '1 minute') >= 6 then
    raise exception 'too_many' using errcode = 'P0001';
  end if;
  allowed := public.ai_daily_limit_for(uid);
  used := public.ai_messages_used(uid);
  if used >= allowed then
    raise exception 'ai_daily_limit' using errcode = 'P0001',
      hint = to_char(public.almaty_day_start() + interval '1 day', 'YYYY-MM-DD"T"HH24:MI:SSOF');
  end if;
  insert into public.ai_messages (conversation_id, user_id, role, content)
  values (conversation, uid, 'user', content)
  returning id into new_id;
  update public.ai_conversations set updated_at = now() where id = conversation;
  update public.profiles set last_seen_at = now() where id = uid;
  return query select allowed - used - 1, new_id;
end;
$$;
revoke execute on function public.consume_ai_message(uuid, text) from public, anon;
grant execute on function public.consume_ai_message(uuid, text) to authenticated;

-- Stores the assistant's reply in the user's conversation (called by the server with the user's JWT).
create or replace function public.save_ai_reply(conversation uuid, content text, tokens integer default null)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id bigint;
begin
  if not exists (select 1 from public.ai_conversations c where c.id = conversation and c.user_id = (select auth.uid())) then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  insert into public.ai_messages (conversation_id, user_id, role, content, tokens)
  values (conversation, (select auth.uid()), 'assistant', left(content, 2000), tokens)
  returning id into new_id;
  return new_id;
end;
$$;
revoke execute on function public.save_ai_reply(uuid, text, integer) from public, anon;
grant execute on function public.save_ai_reply(uuid, text, integer) to authenticated;

-- OpenAI failed: the message no longer counts. Only the server (service role) may do this,
-- otherwise anyone could refund their own messages and never hit the limit.
create or replace function public.refund_ai_message(message bigint)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.ai_messages set status = 'refunded' where id = message and role = 'user';
$$;
revoke execute on function public.refund_ai_message(bigint) from public, anon, authenticated;
grant execute on function public.refund_ai_message(bigint) to service_role;

-- "Try without signing up": a few messages a day per IP address. The IP is hashed by the server.
create table public.ai_guest_usage (
  ip_hash text not null check (ip_hash ~ '^[a-f0-9]{64}$'),
  day date not null,
  used integer not null default 0 check (used >= 0),
  primary key (ip_hash, day)
);
alter table public.ai_guest_usage enable row level security;
-- No policies: only the service role (which bypasses RLS) touches this table.

create or replace function public.consume_guest_ai_message(ip_hash text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  today date := (now() at time zone 'Asia/Almaty')::date;
  allowed integer := coalesce((select (s.value #>> '{}')::integer from public.app_settings s where s.key = 'guest_ai_daily_limit'), 3);
  now_used integer;
begin
  if coalesce((select s.value from public.app_settings s where s.key = 'ai_enabled'), 'true'::jsonb) = 'false'::jsonb then
    raise exception 'ai_disabled' using errcode = 'P0001';
  end if;
  insert into public.ai_guest_usage as g (ip_hash, day, used) values (consume_guest_ai_message.ip_hash, today, 1)
  on conflict (ip_hash, day) do update set used = g.used + 1
  returning used into now_used;
  if now_used > allowed then
    raise exception 'ai_daily_limit' using errcode = 'P0001',
      hint = to_char(public.almaty_day_start() + interval '1 day', 'YYYY-MM-DD"T"HH24:MI:SSOF');
  end if;
  delete from public.ai_guest_usage where day < today - 2;
  return allowed - now_used;
end;
$$;
revoke execute on function public.consume_guest_ai_message(text) from public, anon, authenticated;
grant execute on function public.consume_guest_ai_message(text) to service_role;

create or replace function public.refund_guest_ai_message(ip_hash text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.ai_guest_usage g set used = greatest(0, g.used - 1)
  where g.ip_hash = refund_guest_ai_message.ip_hash and g.day = (now() at time zone 'Asia/Almaty')::date;
$$;
revoke execute on function public.refund_guest_ai_message(text) from public, anon, authenticated;
grant execute on function public.refund_guest_ai_message(text) to service_role;

-- ai_requests (20261125000300) keeps one row per OpenAI call, now for chat too: kind and the error code.
alter table public.ai_requests
  add column kind text not null default 'plan' check (kind in ('plan', 'chat', 'guest_chat')),
  add column error_code text check (char_length(error_code) <= 60),
  alter column user_id drop not null;
create index ai_requests_time_idx on public.ai_requests (created_at desc);
