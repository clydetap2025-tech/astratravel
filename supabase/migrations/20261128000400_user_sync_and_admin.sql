-- What a signed-in visitor keeps in their account besides favourites: their own route (in order),
-- places they have been to and the rest of their settings. Plus the read-only functions behind the
-- admin panel (overview numbers, the user list with e-mail, a user card, the audit log with names),
-- and deleting one's own account.

alter table public.profiles
  add column district text check (char_length(district) <= 40),
  add column interests public.place_category[] not null default '{}';

create table public.user_route (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  place_id text not null references public.places (id) on delete cascade,
  position smallint not null check (position between 0 and 199),
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);
create index user_route_order_idx on public.user_route (user_id, position);

create table public.visited_places (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  place_id text not null references public.places (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

alter table public.user_route enable row level security;
alter table public.visited_places enable row level security;
create policy "Users manage their route" on public.user_route for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their visited places" on public.visited_places for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Replaces the whole route in one call, so the order is saved atomically.
create or replace function public.set_my_route(place_ids text[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'unauthorized' using errcode = '42501'; end if;
  if cardinality(place_ids) > 200 then raise exception 'invalid_input' using errcode = '22023'; end if;
  delete from public.user_route where user_id = (select auth.uid());
  insert into public.user_route (user_id, place_id, position)
  select (select auth.uid()), id, (ord - 1)::smallint
  from unnest(place_ids) with ordinality as t (id, ord)
  where exists (select 1 from public.places p where p.id = t.id)
  on conflict do nothing;
end;
$$;
revoke execute on function public.set_my_route(text[]) from public, anon;
grant execute on function public.set_my_route(text[]) to authenticated;

-- Deletes the caller's account and, through on delete cascade, everything that belongs to it.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'unauthorized' using errcode = '42501'; end if;
  delete from auth.users where id = (select auth.uid());
end;
$$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- Guard for the admin functions below.
create or replace function public.require_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
end;
$$;

-- Numbers for the admin overview, in one call.
create or replace function public.admin_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  today timestamptz := public.almaty_day_start();
  price_in numeric := coalesce((select (value #>> '{}')::numeric from public.app_settings where key = 'ai_price_input_per_1m'), 0);
  price_out numeric := coalesce((select (value #>> '{}')::numeric from public.app_settings where key = 'ai_price_output_per_1m'), 0);
  result jsonb;
begin
  perform public.require_admin();
  select jsonb_build_object(
    'users_total', (select count(*) from public.profiles),
    'users_new_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'ai_today', (select count(*) from public.ai_messages where role = 'user' and status = 'ok' and created_at >= today),
    'ai_week', (select count(*) from public.ai_messages where role = 'user' and status = 'ok' and created_at >= today - interval '6 days'),
    'limit_hit_today', (select count(*) from public.profiles p
      where public.ai_messages_used(p.id) >= public.ai_daily_limit_for(p.id)
        and exists (select 1 from public.ai_messages m where m.user_id = p.id and m.created_at >= today)),
    'cost_today_usd', (select round(coalesce(sum(coalesce(input_tokens, 0)) * price_in / 1e6 + sum(coalesce(output_tokens, 0)) * price_out / 1e6, 0), 4)
      from public.ai_requests where created_at >= today),
    'openai_errors_today', (select count(*) from public.ai_requests where status = 'error' and created_at >= today),
    'openai_errors_7d', (select count(*) from public.ai_requests where status = 'error' and created_at >= today - interval '6 days'),
    'messages_by_day', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'count', (
        select count(*) from public.ai_messages m where m.role = 'user' and m.status = 'ok'
          and m.created_at >= d and m.created_at < d + interval '1 day')) order by d), '[]'::jsonb)
      from generate_series(today - interval '13 days', today, interval '1 day') as d),
    'top_cities', (select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
      select p.city_id as id, count(*) as count from (
        select place_id from public.saved_places union all select place_id from public.user_route) s
      join public.places p on p.id = s.place_id group by p.city_id order by count(*) desc limit 6) t),
    'top_places', (select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
      select s.place_id as id, count(*) as count from (
        select place_id from public.saved_places union all select place_id from public.user_route) s
      group by s.place_id order by count(*) desc limit 8) t)
  ) into result;
  return result;
end;
$$;

-- The user table of the admin panel: search, filters, sorting and pages in the database.
create or replace function public.admin_users(
  search text default '', role_filter text default '', blocked_only boolean default false,
  limit_hit_only boolean default false, sort text default 'created_desc', page integer default 0, page_size integer default 25)
returns table (
  id uuid, email text, display_name text, role text, blocked_at timestamptz, blocked_reason text,
  ai_daily_limit integer, used_today integer, limit_today integer, origin text, city_id text,
  created_at timestamptz, last_seen_at timestamptz, total bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  perform public.require_admin();
  return query
  with base as (
    select p.id, u.email::text as email, p.display_name, p.role, p.blocked_at, p.blocked_reason, p.ai_daily_limit,
      public.ai_messages_used(p.id) as used_today, public.ai_daily_limit_for(p.id) as limit_today,
      p.origin, p.city_id, p.created_at, p.last_seen_at
    from public.profiles p join auth.users u on u.id = p.id
    where (coalesce(search, '') = '' or u.email ilike '%' || search || '%' or p.display_name ilike '%' || search || '%')
      and (coalesce(role_filter, '') = '' or p.role = role_filter)
      and (not blocked_only or p.blocked_at is not null)
  ), filtered as (
    select * from base r where not limit_hit_only or r.used_today >= r.limit_today
  )
  select f.*, count(*) over () as total from filtered f
  order by
    case when sort = 'email_asc' then f.email end asc,
    case when sort = 'seen_desc' then f.last_seen_at end desc nulls last,
    case when sort = 'used_desc' then f.used_today end desc,
    case when sort = 'created_asc' then f.created_at end asc,
    f.created_at desc
  limit least(greatest(page_size, 1), 100) offset greatest(page, 0) * least(greatest(page_size, 1), 100);
end;
$$;

-- One user's card: account dates, messages per day for 14 days and the audit history of their profile.
create or replace function public.admin_user_detail(user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  today timestamptz := public.almaty_day_start();
  result jsonb;
begin
  perform public.require_admin();
  select jsonb_build_object(
    'email', u.email, 'created_at', u.created_at, 'last_sign_in_at', u.last_sign_in_at, 'confirmed_at', u.email_confirmed_at,
    'profile', to_jsonb(p) - 'username',
    'used_today', public.ai_messages_used(p.id), 'limit_today', public.ai_daily_limit_for(p.id),
    'messages_by_day', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'count', (
        select count(*) from public.ai_messages m where m.user_id = p.id and m.role = 'user' and m.status = 'ok'
          and m.created_at >= d and m.created_at < d + interval '1 day')) order by d), '[]'::jsonb)
      from generate_series(today - interval '13 days', today, interval '1 day') as d),
    'history', (select coalesce(jsonb_agg(jsonb_build_object('at', a.created_at, 'actor', au.email, 'before', a.before, 'after', a.after) order by a.created_at desc), '[]'::jsonb)
      from public.audit_log a left join auth.users au on au.id = a.actor_id
      where a.table_name = 'profiles' and a.record_id = p.id::text)
  ) into result
  from public.profiles p join auth.users u on u.id = p.id
  where p.id = admin_user_detail.user_id;
  return result;
end;
$$;

-- The audit log with the actor's e-mail, filtered by who, which table and since when.
create or replace function public.admin_audit_log(
  actor text default '', table_filter text default '', since timestamptz default null, page integer default 0, page_size integer default 50)
returns table (id bigint, created_at timestamptz, actor_email text, action text, table_name text, record_id text, before jsonb, after jsonb, total bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  perform public.require_admin();
  return query
  select a.id, a.created_at, u.email::text, a.action, a.table_name, a.record_id, a.before, a.after, count(*) over ()
  from public.audit_log a left join auth.users u on u.id = a.actor_id
  where (coalesce(actor, '') = '' or u.email ilike '%' || actor || '%')
    and (coalesce(table_filter, '') = '' or a.table_name = table_filter)
    and (since is null or a.created_at >= since)
  order by a.created_at desc
  limit least(greatest(page_size, 1), 200) offset greatest(page, 0) * least(greatest(page_size, 1), 200);
end;
$$;

-- Editors need the last change of a place to undo it; they may read the audit rows of the catalogue.
create policy "Editors read catalogue history" on public.audit_log for select to authenticated
  using (public.is_editor() and table_name in ('places', 'cities'));

revoke execute on function public.require_admin() from public, anon;
revoke execute on function public.admin_overview() from public, anon;
revoke execute on function public.admin_users(text, text, boolean, boolean, text, integer, integer) from public, anon;
revoke execute on function public.admin_user_detail(uuid) from public, anon;
revoke execute on function public.admin_audit_log(text, text, timestamptz, integer, integer) from public, anon;
grant execute on function public.admin_overview() to authenticated;
grant execute on function public.admin_users(text, text, boolean, boolean, text, integer, integer) to authenticated;
grant execute on function public.admin_user_detail(uuid) to authenticated;
grant execute on function public.admin_audit_log(text, text, timestamptz, integer, integer) to authenticated;
