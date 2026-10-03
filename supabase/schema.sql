-- Mycelia Database Schema
-- Run in Supabase SQL Editor to bootstrap tables

-- Clusters: custom groupings (Family, College, Company, etc.)
create table clusters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(100) not null check (char_length(trim(name)) > 0),
  color varchar(7) default '#6366f1' check (color ~* '^#[0-9a-f]{6}$'),
  ui_x numeric default 0,
  ui_y numeric default 0,
  created_at timestamptz default now()
);

-- Contacts: people in the network
create table contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(100) not null check (char_length(trim(name)) > 0),
  email varchar(255),
  phone varchar(50),
  notes varchar(2000),
  avatar_url text,
  custom_dates jsonb default '{}'::jsonb,
  cadence_days integer check (cadence_days > 0), -- remind every N days
  last_contacted_at timestamptz,
  ui_x numeric default 0,
  ui_y numeric default 0,
  created_at timestamptz default now()
);

-- Contact-Cluster memberships (many-to-many)
create table contact_clusters (
  contact_id uuid not null references contacts(id) on delete cascade,
  cluster_id uuid not null references clusters(id) on delete cascade,
  source_handle varchar(50),
  target_handle varchar(50),
  primary key (contact_id, cluster_id)
);

-- Edges: typed relationships between two contacts
create table edges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid not null references contacts(id) on delete cascade,
  target_id uuid not null references contacts(id) on delete cascade,
  source_handle varchar(50),
  target_handle varchar(50),
  label varchar(100) not null check (char_length(trim(label)) > 0), -- "married to", "works with"
  created_at timestamptz default now()
);

-- Interactions: logged events/conversations
create table interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  note varchar(2000) not null check (char_length(trim(note)) > 0),
  occurred_at timestamptz default now(),
  created_at timestamptz default now()
);

-- RLS policies (enable per-user isolation)
alter table clusters enable row level security;
alter table contacts enable row level security;
alter table contact_clusters enable row level security;
alter table edges enable row level security;
alter table interactions enable row level security;

create policy "Users see own clusters" on clusters for all using (auth.uid() = user_id);
create policy "Users see own contacts" on contacts for all using (auth.uid() = user_id);
create policy "Users see own contact_clusters" on contact_clusters for all using (
  contact_id in (select id from contacts where user_id = auth.uid())
);
create policy "Users see own edges" on edges for all using (auth.uid() = user_id);
create policy "Users see own interactions" on interactions for all using (auth.uid() = user_id);
