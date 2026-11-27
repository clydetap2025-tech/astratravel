-- AstraTravel catalogue editing: editors and admins write places, cities and country matches;
-- everyone else reads only published places. Photo credits, review date, coordinates and a 2GIS link
-- live on the place. Photos uploaded in the admin panel go to the public bucket place-photos.
--
-- places already has is_published (from 20261125000100_catalog.sql); it is the "published" flag.

alter table public.places
  add column checked_at date,
  add column photo_url text check (photo_url is null or photo_url ~ '^(https://|/)'),
  add column photo_author text check (char_length(photo_author) <= 200),
  add column photo_license text check (char_length(photo_license) <= 80),
  add column photo_page text check (photo_page is null or photo_page ~ '^https://'),
  add column photo_kind text check (photo_kind in ('place', 'city', 'dish')),
  add column lat numeric(9, 6) check (lat between -90 and 90),
  add column lng numeric(9, 6) check (lng between -180 and 180),
  add column twogis_url text check (twogis_url is null or twogis_url ~ '^https://');

-- A photo needs its author and licence (Creative Commons asks for credit).
alter table public.places add constraint places_photo_credit check (
  photo_url is null or (photo_author is not null and photo_license is not null)
);

create index places_checked_idx on public.places (checked_at);

-- Editors see unpublished places too, and write the catalogue; deleting is for admins.
create policy "Editors read all places" on public.places for select to authenticated using (public.is_editor());
create policy "Editors add places" on public.places for insert to authenticated with check (public.is_editor());
create policy "Editors edit places" on public.places for update to authenticated using (public.is_editor()) with check (public.is_editor());
create policy "Admins delete places" on public.places for delete to authenticated using (public.is_admin());

create policy "Editors add cities" on public.cities for insert to authenticated with check (public.is_editor());
create policy "Editors edit cities" on public.cities for update to authenticated using (public.is_editor()) with check (public.is_editor());
create policy "Admins delete cities" on public.cities for delete to authenticated using (public.is_admin());

create policy "Editors manage place matches" on public.place_matches for all to authenticated
  using (public.is_editor()) with check (public.is_editor());

-- Photos: public to read, 5 MB at most, WebP, JPEG or PNG; only editors and admins upload or remove.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('place-photos', 'place-photos', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Place photos are public" on storage.objects for select to anon, authenticated
  using (bucket_id = 'place-photos');
create policy "Editors upload place photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'place-photos' and public.is_editor());
create policy "Editors replace place photos" on storage.objects for update to authenticated
  using (bucket_id = 'place-photos' and public.is_editor()) with check (bucket_id = 'place-photos' and public.is_editor());
create policy "Editors remove place photos" on storage.objects for delete to authenticated
  using (bucket_id = 'place-photos' and public.is_editor());
