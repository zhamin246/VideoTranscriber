-- Image to CAD schema on the shared Face Rating Supabase project.
-- Face Rating keeps public.*; this app only uses imagetocad.*.
-- Run in Supabase Dashboard → SQL Editor (once).

CREATE SCHEMA IF NOT EXISTS imagetocad;

CREATE TABLE IF NOT EXISTS imagetocad.users (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  uuid varchar(255) NOT NULL UNIQUE,
  email varchar(255) NOT NULL,
  created_at timestamptz,
  nickname varchar(255),
  avatar_url varchar(255),
  locale varchar(50),
  signin_type varchar(50),
  signin_ip varchar(255),
  signin_provider varchar(50),
  signin_openid varchar(255),
  invite_code varchar(255) NOT NULL DEFAULT '',
  updated_at timestamptz,
  invited_by varchar(255) NOT NULL DEFAULT '',
  is_affiliate boolean NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX IF NOT EXISTS itc_email_provider_unique_idx
  ON imagetocad.users (email, signin_provider);

CREATE TABLE IF NOT EXISTS imagetocad.face_reports (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  report_id varchar(255) NOT NULL UNIQUE,
  user_uuid varchar(255) NOT NULL DEFAULT '',
  user_email varchar(255) NOT NULL DEFAULT '',
  score integer NOT NULL DEFAULT 0,
  out_of_ten varchar(16) NOT NULL DEFAULT '',
  tier_name varchar(64) NOT NULL DEFAULT '',
  face_shape varchar(64) NOT NULL DEFAULT '',
  src varchar(64) NOT NULL DEFAULT '',
  preview_url text NOT NULL DEFAULT '',
  scan_json text NOT NULL DEFAULT '',
  unlocked_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  status varchar(50) NOT NULL DEFAULT 'active'
);
CREATE UNIQUE INDEX IF NOT EXISTS itc_face_reports_report_id_idx
  ON imagetocad.face_reports (report_id);

CREATE TABLE IF NOT EXISTS imagetocad.orders (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_no varchar(255) NOT NULL UNIQUE,
  created_at timestamptz,
  user_uuid varchar(255) NOT NULL DEFAULT '',
  user_email varchar(255) NOT NULL DEFAULT '',
  amount integer NOT NULL,
  interval varchar(50),
  expired_at timestamptz,
  status varchar(50) NOT NULL,
  stripe_session_id varchar(255),
  credits integer NOT NULL,
  currency varchar(50),
  sub_id varchar(255),
  sub_interval_count integer,
  sub_cycle_anchor integer,
  sub_period_end integer,
  sub_period_start integer,
  sub_times integer,
  product_id varchar(255),
  product_name varchar(255),
  valid_months integer,
  order_detail text,
  paid_at timestamptz,
  paid_email varchar(255),
  paid_detail text
);

CREATE TABLE IF NOT EXISTS imagetocad.apikeys (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  api_key varchar(255) NOT NULL UNIQUE,
  title varchar(100),
  user_uuid varchar(255) NOT NULL,
  created_at timestamptz,
  status varchar(50)
);

CREATE TABLE IF NOT EXISTS imagetocad.credits (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  trans_no varchar(255) NOT NULL UNIQUE,
  created_at timestamptz,
  user_uuid varchar(255) NOT NULL,
  trans_type varchar(50) NOT NULL,
  credits integer NOT NULL,
  order_no varchar(255),
  expired_at timestamptz
);

CREATE TABLE IF NOT EXISTS imagetocad.posts (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  uuid varchar(255) NOT NULL UNIQUE,
  slug varchar(255),
  title varchar(255),
  description text,
  content text,
  created_at timestamptz,
  updated_at timestamptz,
  status varchar(50),
  cover_url varchar(255),
  author_name varchar(255),
  author_avatar_url varchar(255),
  locale varchar(50)
);

CREATE TABLE IF NOT EXISTS imagetocad.affiliates (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_uuid varchar(255) NOT NULL,
  created_at timestamptz,
  status varchar(50) NOT NULL DEFAULT '',
  invited_by varchar(255) NOT NULL,
  paid_order_no varchar(255) NOT NULL DEFAULT '',
  paid_amount integer NOT NULL DEFAULT 0,
  reward_percent integer NOT NULL DEFAULT 0,
  reward_amount integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS imagetocad.feedbacks (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz,
  status varchar(50),
  user_uuid varchar(255),
  content text,
  rating integer
);

CREATE TABLE IF NOT EXISTS imagetocad.generation_records (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  uuid varchar(255) NOT NULL UNIQUE,
  user_uuid varchar(255) NOT NULL,
  type varchar(50) NOT NULL,
  prompt text,
  status varchar(20) NOT NULL,
  credits_used integer NOT NULL DEFAULT 0,
  result_url text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS imagetocad.anonymous_usage_logs (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  anonymous_uuid varchar(255) NOT NULL,
  api_type varchar(50) NOT NULL,
  ip_address varchar(255),
  created_at timestamptz NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS imagetocad.__drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);
