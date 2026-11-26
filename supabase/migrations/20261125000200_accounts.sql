-- AstraTravel accounts: a profile per Supabase Auth user, favourites and saved itineraries.
-- Guests keep favourites in their browser; these tables are for signed-in visitors.
-- Every row belongs to one user and Row Level Security limits each user to their own rows.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique check (username ~ '^[[:alnum:]_-]{3,24}$'),
  language text not null default 'ru' check (language in ('ru', 'kk', 'en', 'ja')),
  origin text references public.countries (code) on delete set null,
  visitor text check (visitor in ('guest', 'local')),
  city_id text references public.cities (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- Create the profile when someone signs up; language and username may come from the sign-up metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  wanted_language text := new.raw_user_meta_data ->> 'language';
  wanted_username text := new.raw_user_meta_data ->> 'username';
begin
  insert into public.profiles (id, username, language)
  values (
    new.id,
    case when wanted_username ~ '^[[:alnum:]_-]{3,24}$' then wanted_username end,
    case when wanted_language in ('ru', 'kk', 'en', 'ja') then wanted_language else 'ru' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.saved_places (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  place_id text not null references public.places (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

create table public.saved_flights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  flight_key text not null check (length(flight_key) <= 80),
  -- The demo search the flight came from: {from, to, date, passengers}.
  search jsonb not null check (search ?& array['from', 'to', 'date', 'passengers']),
  created_at timestamptz not null default now(),
  unique (user_id, flight_key)
);
create index saved_flights_user_idx on public.saved_flights (user_id);

create type public.plan_mode as enum ('demo', 'ai');

create table public.trip_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  mode public.plan_mode not null default 'demo',
  days smallint not null check (days between 1 and 3),
  budget public.budget_level not null,
  interests public.place_category[] not null default '{}',
  language text not null check (language in ('ru', 'kk', 'en', 'ja')),
  origin text references public.countries (code) on delete set null,
  city_id text not null references public.cities (id) on delete restrict,
  cost_kzt integer not null check (cost_kzt >= 0),
  overview text check (length(overview) <= 360),
  -- The model that wrote the notes, for plans in 'ai' mode.
  model text,
  created_at timestamptz not null default now()
);
create index trip_plans_user_idx on public.trip_plans (user_id, created_at desc);

create table public.trip_plan_days (
  plan_id uuid not null references public.trip_plans (id) on delete cascade,
  day_index smallint not null check (day_index between 0 and 2),
  place_ids text[] not null check (cardinality(place_ids) between 1 and 3),
  cost_kzt integer not null check (cost_kzt >= 0),
  minutes integer not null check (minutes > 0),
  note text check (length(note) <= 260),
  primary key (plan_id, day_index)
);

alter table public.profiles enable row level security;
alter table public.saved_places enable row level security;
alter table public.saved_flights enable row level security;
alter table public.trip_plans enable row level security;
alter table public.trip_plan_days enable row level security;

create policy "Users read their profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Users update their profile" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Users manage their saved places" on public.saved_places for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their saved flights" on public.saved_flights for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their plans" on public.trip_plans for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage the days of their plans" on public.trip_plan_days for all to authenticated
  using (exists (select 1 from public.trip_plans p where p.id = plan_id and p.user_id = (select auth.uid())))
  with check (exists (select 1 from public.trip_plans p where p.id = plan_id and p.user_id = (select auth.uid())));
