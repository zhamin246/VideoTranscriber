-- Video Transcriber schema (shared Supabase project, isolated from public / imagetocad)
CREATE SCHEMA IF NOT EXISTS videotranscriber;

CREATE TABLE IF NOT EXISTS videotranscriber.users (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
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
  invite_code varchar(255) DEFAULT '' NOT NULL,
  updated_at timestamptz,
  invited_by varchar(255) DEFAULT '' NOT NULL,
  is_affiliate boolean DEFAULT false NOT NULL,
  work_role varchar(255),
  team_size varchar(50),
  onboarded_at timestamptz,
  password_hash text
);
CREATE UNIQUE INDEX IF NOT EXISTS vt_email_provider_unique_idx
  ON videotranscriber.users (email, signin_provider);

-- Existing installs: add password column if missing
ALTER TABLE videotranscriber.users
  ADD COLUMN IF NOT EXISTS password_hash text;

CREATE TABLE IF NOT EXISTS videotranscriber.orders (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_no varchar(255) NOT NULL UNIQUE,
  created_at timestamptz,
  user_uuid varchar(255) DEFAULT '' NOT NULL,
  user_email varchar(255) DEFAULT '' NOT NULL,
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

CREATE TABLE IF NOT EXISTS videotranscriber.apikeys (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  api_key varchar(255) NOT NULL UNIQUE,
  title varchar(100),
  user_uuid varchar(255) NOT NULL,
  created_at timestamptz,
  status varchar(50)
);

CREATE TABLE IF NOT EXISTS videotranscriber.credits (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  trans_no varchar(255) NOT NULL UNIQUE,
  created_at timestamptz,
  user_uuid varchar(255) NOT NULL,
  trans_type varchar(50) NOT NULL,
  credits integer NOT NULL,
  order_no varchar(255),
  expired_at timestamptz
);

CREATE TABLE IF NOT EXISTS videotranscriber.posts (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
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

CREATE TABLE IF NOT EXISTS videotranscriber.affiliates (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_uuid varchar(255) NOT NULL,
  created_at timestamptz,
  status varchar(50) DEFAULT '' NOT NULL,
  invited_by varchar(255) NOT NULL,
  paid_order_no varchar(255) DEFAULT '' NOT NULL,
  paid_amount integer DEFAULT 0 NOT NULL,
  reward_percent integer DEFAULT 0 NOT NULL,
  reward_amount integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS videotranscriber.feedbacks (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz,
  status varchar(50),
  user_uuid varchar(255),
  content text,
  rating integer
);

CREATE TABLE IF NOT EXISTS videotranscriber.generation_records (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  uuid varchar(255) NOT NULL UNIQUE,
  user_uuid varchar(255) NOT NULL,
  type varchar(50) NOT NULL,
  prompt text,
  status varchar(20) NOT NULL,
  credits_used integer DEFAULT 0 NOT NULL,
  result_url text,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS videotranscriber.anonymous_usage_logs (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  anonymous_uuid varchar(255) NOT NULL,
  api_type varchar(50) NOT NULL,
  ip_address varchar(255),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS videotranscriber.workspaces (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  workspace_id varchar(64) NOT NULL UNIQUE,
  user_uuid varchar(255) DEFAULT '' NOT NULL,
  source_url text DEFAULT '' NOT NULL,
  playback_url text DEFAULT '' NOT NULL,
  thumbnail_url text DEFAULT '' NOT NULL,
  title varchar(512) DEFAULT '' NOT NULL,
  platform varchar(64) DEFAULT '' NOT NULL,
  youtube_id varchar(64) DEFAULT '' NOT NULL,
  media_kind varchar(16) DEFAULT '' NOT NULL,
  duration_seconds integer,
  source_language varchar(32) DEFAULT 'auto' NOT NULL,
  note_mode varchar(64) DEFAULT 'smart_summary' NOT NULL,
  separate_speaker boolean DEFAULT false NOT NULL,
  detected_language varchar(32) DEFAULT '' NOT NULL,
  status varchar(32) DEFAULT 'ready' NOT NULL,
  ask_messages_json text DEFAULT '[]' NOT NULL,
  media_expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz
);
CREATE INDEX IF NOT EXISTS vt_workspaces_user_uuid_idx ON videotranscriber.workspaces (user_uuid);
CREATE INDEX IF NOT EXISTS vt_workspaces_created_at_idx ON videotranscriber.workspaces (created_at);

-- Existing installs: Ask AI history column
ALTER TABLE videotranscriber.workspaces
  ADD COLUMN IF NOT EXISTS ask_messages_json text DEFAULT '[]' NOT NULL;

CREATE TABLE IF NOT EXISTS videotranscriber.media_assets (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  asset_id varchar(64) NOT NULL UNIQUE,
  workspace_id varchar(64) DEFAULT '' NOT NULL,
  kind varchar(32) DEFAULT 'video' NOT NULL,
  storage_key text DEFAULT '' NOT NULL,
  public_url text DEFAULT '' NOT NULL,
  content_type varchar(128) DEFAULT '' NOT NULL,
  bytes bigint DEFAULT 0 NOT NULL,
  filename varchar(255) DEFAULT '' NOT NULL,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS vt_media_assets_workspace_id_idx ON videotranscriber.media_assets (workspace_id);

CREATE TABLE IF NOT EXISTS videotranscriber.transcripts (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  workspace_id varchar(64) NOT NULL UNIQUE,
  text text DEFAULT '' NOT NULL,
  segments_json text DEFAULT '[]' NOT NULL,
  language varchar(32) DEFAULT '' NOT NULL,
  provider varchar(64) DEFAULT 'replicate' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz
);
CREATE INDEX IF NOT EXISTS vt_transcripts_workspace_id_idx ON videotranscriber.transcripts (workspace_id);

-- Template leftovers (kept for code compatibility)
CREATE TABLE IF NOT EXISTS videotranscriber.face_reports (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  report_id varchar(255) NOT NULL UNIQUE,
  user_uuid varchar(255) DEFAULT '' NOT NULL,
  user_email varchar(255) DEFAULT '' NOT NULL,
  score integer DEFAULT 0 NOT NULL,
  out_of_ten varchar(16) DEFAULT '' NOT NULL,
  tier_name varchar(64) DEFAULT '' NOT NULL,
  face_shape varchar(64) DEFAULT '' NOT NULL,
  src varchar(64) DEFAULT '' NOT NULL,
  preview_url text DEFAULT '' NOT NULL,
  scan_json text DEFAULT '' NOT NULL,
  unlocked_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  status varchar(50) DEFAULT 'active' NOT NULL
);

CREATE TABLE IF NOT EXISTS videotranscriber.convert_jobs (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  uuid varchar(255) NOT NULL UNIQUE,
  kie_task_id varchar(255) DEFAULT '' NOT NULL,
  user_uuid varchar(255) DEFAULT '' NOT NULL,
  user_email varchar(255) DEFAULT '' NOT NULL,
  title varchar(255) DEFAULT 'Conversion' NOT NULL,
  original_url text DEFAULT '' NOT NULL,
  lineart_url text DEFAULT '' NOT NULL,
  geometry_url text DEFAULT '' NOT NULL,
  status varchar(50) DEFAULT 'processing' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz
);

GRANT USAGE ON SCHEMA videotranscriber TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA videotranscriber TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA videotranscriber TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA videotranscriber
  GRANT ALL ON TABLES TO postgres, service_role;
