-- AstraTravel catalog: cities of Kazakhstan, places, countries of origin and country picks.
-- Everyone (anon included) can read it; only the service role writes, so there are no write policies.

create type public.place_category as enum ('nature', 'food', 'culture', 'city');
create type public.place_zone as enum ('center', 'outskirts', 'hill', 'mountains', 'daytrip');
create type public.budget_level as enum ('light', 'standard', 'flexible');

-- A localized text: one string per interface language.
create domain public.localized as jsonb
  check (jsonb_typeof(value) = 'object' and value ?& array['ru', 'kk', 'en', 'ja']);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.countries (
  code text primary key check (code ~ '^([A-Z]{2}|OTHER)$'),
  sort_order smallint not null default 0
);
comment on table public.countries is 'Countries a visitor can say they are travelling from. Names come from Intl.DisplayNames on the client.';

create table public.budgets (
  level public.budget_level primary key,
  daily_kzt integer not null check (daily_kzt > 0)
);
comment on table public.budgets is 'Daily budget per person for the itinerary planner, in tenge.';

create table public.cities (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  name public.localized not null,
  region public.localized not null,
  -- IATA code of the airport the flight search uses for this city.
  airport text not null unique check (airport ~ '^[A-Z]{3}$'),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  sort_order smallint not null default 0
);
comment on table public.cities is 'Cities of Kazakhstan covered by the guide.';

create table public.places (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  city_id text not null references public.cities (id) on delete restrict,
  category public.place_category not null,
  zone public.place_zone not null,
  minutes integer not null check (minutes between 15 and 720),
  -- Null when the ticket price is unknown; 0 for free public places.
  cost_kzt integer check (cost_kzt >= 0),
  title public.localized not null,
  location public.localized not null,
  address public.localized not null,
  summary public.localized not null,
  tip public.localized not null,
  map_query text not null,
  source_url text not null check (source_url ~ '^https://'),
  has_photo boolean not null default true,
  -- Position on the schematic City Lens map (0–1200 × 0–720); null for places outside the city.
  map_x smallint check (map_x between 0 and 1200),
  map_y smallint check (map_y between 0 and 720),
  sort_order smallint not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.places is 'Places in the Almaty guide. Costs are estimates for planning.';
create index places_category_idx on public.places (category) where is_published;
create index places_city_idx on public.places (city_id) where is_published;
create trigger places_touch before update on public.places for each row execute function public.touch_updated_at();

-- Which places to suggest to visitors from which country ("a taste of home").
create table public.place_matches (
  place_id text not null references public.places (id) on delete cascade,
  country_code text not null references public.countries (code) on delete cascade,
  primary key (place_id, country_code)
);
create index place_matches_country_idx on public.place_matches (country_code);

-- One pin per country on the welcome globe, on its capital or largest city.
create table public.country_points (
  country_code text primary key references public.countries (code) on delete cascade,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  sort_order smallint not null default 0
);

alter table public.countries enable row level security;
alter table public.budgets enable row level security;
alter table public.places enable row level security;
alter table public.place_matches enable row level security;
alter table public.country_points enable row level security;
alter table public.cities enable row level security;

create policy "Catalog countries are public" on public.countries for select to anon, authenticated using (true);
create policy "Budgets are public" on public.budgets for select to anon, authenticated using (true);
create policy "Published places are public" on public.places for select to anon, authenticated using (is_published);
create policy "Place matches are public" on public.place_matches for select to anon, authenticated using (true);
create policy "Country points are public" on public.country_points for select to anon, authenticated using (true);
create policy "Cities are public" on public.cities for select to anon, authenticated using (true);

-- Places for one country, home cuisine first: the same order as picksFor() in data/catalog.js.
create or replace function public.picks_for(origin text)
returns setof public.places
language sql
stable
set search_path = ''
as $$
  select p.*
  from public.places p
  join public.place_matches m on m.place_id = p.id
  where m.country_code = origin and p.is_published
  order by (p.category = 'food') desc, p.sort_order;
$$;
