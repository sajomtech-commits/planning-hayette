-- ============================================================
-- Planning Hayette - Schéma Supabase
-- ============================================================
-- Exécuter ce script dans l'éditeur SQL de Supabase (SQL Editor)
-- pour créer la table nécessaire au fonctionnement de l'application.
-- ============================================================

-- 1. Création de la table planning_hayette
create table if not exists planning_hayette (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  status text not null,
  start_time time null,
  end_time time null,
  note text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Contrainte sur les statuts autorisés
alter table planning_hayette
  add constraint planning_hayette_status_check
  check (status in ('travaille', 'repos', 'conge', 'formation', 'autre'));

-- 3. Index sur la date pour les recherches rapides
create index if not exists planning_hayette_date_idx
  on planning_hayette (date);

-- 4. Trigger pour mettre à jour updated_at automatiquement
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_planning_hayette_updated_at on planning_hayette;

create trigger trigger_planning_hayette_updated_at
  before update on planning_hayette
  for each row
  execute function update_updated_at_column();

-- 5. Exemples d'insertion (à décommenter pour tester)
/*
insert into planning_hayette (date, status, start_time, end_time, note)
values
  ('2026-06-01', 'travaille', '07:20', '20:00', 'Journée longue'),
  ('2026-06-02', 'repos', null, null, ''),
  ('2026-06-16', 'formation', '09:00', '17:00', 'Formation annuelle'),
  ('2026-07-11', 'conge', null, null, 'Congés été');
*/
