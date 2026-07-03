create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  queue text not null check (queue in ('offline', 'online')),
  rating integer not null default 1000,
  wins integer not null default 0,
  losses integer not null default 0,
  games integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (player_id, queue)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  queue text not null check (queue in ('offline', 'online')),
  motion text not null,
  winner_player_id uuid references public.players(id),
  aff_player_id uuid references public.players(id),
  neg_player_id uuid references public.players(id),
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists ratings_queue_rating_idx
on public.ratings (queue, rating desc);

create index if not exists matches_queue_created_at_idx
on public.matches (queue, created_at desc);
