ALTER TABLE imagetocad.users
  ADD COLUMN IF NOT EXISTS work_role varchar(255),
  ADD COLUMN IF NOT EXISTS team_size varchar(50),
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;
