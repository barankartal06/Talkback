create table song (
  song_id    uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null,
  artist     text,
  song_key   smallint check (song_key between 0 and 11),
  mode       text check (mode in ('major','minor')),
  tempo      smallint,
  created_at timestamptz not null default now()
);

alter table song enable row level security;

create policy "own songs readable" on song
  for select to authenticated
  using (auth.uid() = user_id);

create policy "own songs insertable" on song
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "own songs updatable" on song
  for update to authenticated 
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own songs deletable" on song
  for delete to authenticated 
  using (auth.uid() = user_id);

grant select, insert, update, delete on song to authenticated