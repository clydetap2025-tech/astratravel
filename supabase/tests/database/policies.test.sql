-- Row Level Security and the Astra AI daily limit. Run: supabase test db
-- Everything happens in one transaction that is rolled back, so it leaves no data behind.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public;
select plan(18);

-- Fixtures, created as postgres: a city, a published and an unpublished place, four users.
insert into public.cities (id, name, region, airport, lat, lng)
values ('test-city', '{"ru":"Т","kk":"Т","en":"T","ja":"T"}', '{"ru":"Т","kk":"Т","en":"T","ja":"T"}', 'ZZZ', 50, 50);
insert into public.places (id, city_id, category, zone, minutes, cost_kzt, title, location, address, summary, tip, map_query, source_url, is_published)
select v.id, 'test-city', 'city', 'center', 60, 0, j, j, j, j, j, 'q', 'https://example.org', v.pub
from (values ('test-open', true), ('test-hidden', false)) as v (id, pub),
  (select '{"ru":"Т","kk":"Т","en":"T","ja":"T"}'::jsonb as j) as t;

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000001', 'user1@test.local'),
  ('00000000-0000-4000-8000-000000000002', 'user2@test.local'),
  ('00000000-0000-4000-8000-000000000003', 'editor@test.local'),
  ('00000000-0000-4000-8000-000000000004', 'admin@test.local');
update public.profiles set role = 'editor' where id = '00000000-0000-4000-8000-000000000003';
update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-000000000004';
insert into public.saved_places (user_id, place_id) values
  ('00000000-0000-4000-8000-000000000001', 'test-open'),
  ('00000000-0000-4000-8000-000000000002', 'test-open');
insert into public.ai_conversations (id, user_id) values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002');

-- Act as someone: the API roles with a JWT, as PostgREST does.
create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

-- 1. Anonymous visitors see only the published catalogue.
set local role anon;
select is((select count(*)::int from public.places where city_id = 'test-city'), 1, 'anon sees only published places');
select is((select count(*)::int from public.profiles), 0, 'anon sees no profiles');
select is(public.ai_messages_left(), 0, 'anon has no AI messages');
reset role;

-- 2. A user sees only their own rows and cannot raise their own rights.
select pg_temp.act_as('00000000-0000-4000-8000-000000000001');
select is((select count(*)::int from public.saved_places), 1, 'user sees only their own favourites');
select is((select count(*)::int from public.profiles), 1, 'user sees only their own profile');
select is((select count(*)::int from public.places where city_id = 'test-city'), 1, 'user does not see unpublished places');
select throws_ok($$ update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'user cannot make themselves admin');
select throws_ok($$ update public.profiles set ai_daily_limit = 999 where id = '00000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'user cannot raise their own AI limit');
select is((select count(*)::int from public.ai_conversations), 1, 'user sees only their own conversations');
reset role;

-- 3. An editor edits the catalogue but not roles.
select pg_temp.act_as('00000000-0000-4000-8000-000000000003');
select lives_ok($$ update public.places set minutes = 90 where id = 'test-hidden' $$, 'editor edits a place');
select is((select minutes from public.places where id = 'test-hidden'), 90, 'editor sees and changed the unpublished place');
update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-000000000001';
reset role;
select is((select role from public.profiles where id = '00000000-0000-4000-8000-000000000001'), 'user', 'editor cannot change someone''s role');

-- 4. An admin changes roles and limits.
select pg_temp.act_as('00000000-0000-4000-8000-000000000004');
update public.profiles set ai_daily_limit = 20 where id = '00000000-0000-4000-8000-000000000002';
reset role;
select is((select ai_daily_limit from public.profiles where id = '00000000-0000-4000-8000-000000000002'), 20, 'admin sets a personal AI limit');

-- 5. A blocked user cannot send a message.
update public.profiles set blocked_at = now() where id = '00000000-0000-4000-8000-000000000002';
select pg_temp.act_as('00000000-0000-4000-8000-000000000002');
select throws_ok($$ select * from public.consume_ai_message('10000000-0000-4000-8000-000000000002', 'Привет') $$,
  'P0001', 'account_blocked', 'blocked user cannot send an AI message');
reset role;

-- 6. Messages from yesterday (before 00:00 Almaty) do not count; the 16th message today is refused.
insert into public.ai_messages (conversation_id, user_id, role, content, created_at)
select '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'user', 'old', public.almaty_day_start() - interval '1 hour'
from generate_series(1, 15);
select pg_temp.act_as('00000000-0000-4000-8000-000000000001');
select is((select "left" from public.consume_ai_message('10000000-0000-4000-8000-000000000001', 'Первое сегодня')), 14,
  'the limit starts again at 00:00 Almaty: 14 left after the first message');
reset role;
insert into public.ai_messages (conversation_id, user_id, role, content, created_at)
select '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'user', 'today',
  greatest(public.almaty_day_start(), now() - interval '10 minutes')
from generate_series(1, 14);
select pg_temp.act_as('00000000-0000-4000-8000-000000000001');
select is(public.ai_messages_left(), 0, 'no messages left after 15 today');
select throws_ok($$ select * from public.consume_ai_message('10000000-0000-4000-8000-000000000001', 'Шестнадцатое') $$,
  'P0001', 'ai_daily_limit', 'the 16th message of the day is refused');
-- Refunds are for the server only.
select throws_ok($$ select public.refund_ai_message(1) $$, '42501', null, 'users cannot refund their own messages');
reset role;

select * from finish();
rollback;
