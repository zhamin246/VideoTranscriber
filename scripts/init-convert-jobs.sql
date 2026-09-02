CREATE TABLE IF NOT EXISTS imagetocad.convert_jobs (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  uuid varchar(255) NOT NULL UNIQUE,
  kie_task_id varchar(255) NOT NULL DEFAULT '',
  user_uuid varchar(255) NOT NULL DEFAULT '',
  user_email varchar(255) NOT NULL DEFAULT '',
  title varchar(255) NOT NULL DEFAULT 'Conversion',
  original_url text NOT NULL DEFAULT '',
  lineart_url text NOT NULL DEFAULT '',
  geometry_url text NOT NULL DEFAULT '',
  status varchar(50) NOT NULL DEFAULT 'processing',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);
CREATE INDEX IF NOT EXISTS itc_convert_jobs_user_email_idx
  ON imagetocad.convert_jobs (user_email, created_at DESC);
