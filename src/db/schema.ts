import {
  pgSchema,
  varchar,
  text,
  boolean,
  integer,
  bigint,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/** Isolated schema — shared Supabase project with Face Rating / other apps. */
export const videotranscriberSchema = pgSchema("videotranscriber");

export const users = videotranscriberSchema.table(
  "users",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: varchar({ length: 255 }).notNull().unique(),
    email: varchar({ length: 255 }).notNull(),
    created_at: timestamp({ withTimezone: true }),
    nickname: varchar({ length: 255 }),
    avatar_url: varchar({ length: 255 }),
    locale: varchar({ length: 50 }),
    signin_type: varchar({ length: 50 }),
    signin_ip: varchar({ length: 255 }),
    signin_provider: varchar({ length: 50 }),
    signin_openid: varchar({ length: 255 }),
    invite_code: varchar({ length: 255 }).notNull().default(""),
    updated_at: timestamp({ withTimezone: true }),
    invited_by: varchar({ length: 255 }).notNull().default(""),
    is_affiliate: boolean().notNull().default(false),
    work_role: varchar({ length: 255 }),
    team_size: varchar({ length: 50 }),
    onboarded_at: timestamp({ withTimezone: true }),
    password_hash: text(),
  },
  (table) => [
    uniqueIndex("vt_email_provider_unique_idx").on(
      table.email,
      table.signin_provider,
    ),
  ],
);

export const orders = videotranscriberSchema.table("orders", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  order_no: varchar({ length: 255 }).notNull().unique(),
  created_at: timestamp({ withTimezone: true }),
  user_uuid: varchar({ length: 255 }).notNull().default(""),
  user_email: varchar({ length: 255 }).notNull().default(""),
  amount: integer().notNull(),
  interval: varchar({ length: 50 }),
  expired_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }).notNull(),
  stripe_session_id: varchar({ length: 255 }),
  credits: integer().notNull(),
  currency: varchar({ length: 50 }),
  sub_id: varchar({ length: 255 }),
  sub_interval_count: integer(),
  sub_cycle_anchor: integer(),
  sub_period_end: integer(),
  sub_period_start: integer(),
  sub_times: integer(),
  product_id: varchar({ length: 255 }),
  product_name: varchar({ length: 255 }),
  valid_months: integer(),
  order_detail: text(),
  paid_at: timestamp({ withTimezone: true }),
  paid_email: varchar({ length: 255 }),
  paid_detail: text(),
});

export const apikeys = videotranscriberSchema.table("apikeys", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  api_key: varchar({ length: 255 }).notNull().unique(),
  title: varchar({ length: 100 }),
  user_uuid: varchar({ length: 255 }).notNull(),
  created_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }),
});

export const credits = videotranscriberSchema.table("credits", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  trans_no: varchar({ length: 255 }).notNull().unique(),
  created_at: timestamp({ withTimezone: true }),
  user_uuid: varchar({ length: 255 }).notNull(),
  trans_type: varchar({ length: 50 }).notNull(),
  credits: integer().notNull(),
  order_no: varchar({ length: 255 }),
  expired_at: timestamp({ withTimezone: true }),
});

export const posts = videotranscriberSchema.table("posts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  uuid: varchar({ length: 255 }).notNull().unique(),
  slug: varchar({ length: 255 }),
  title: varchar({ length: 255 }),
  description: text(),
  content: text(),
  created_at: timestamp({ withTimezone: true }),
  updated_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }),
  cover_url: varchar({ length: 255 }),
  author_name: varchar({ length: 255 }),
  author_avatar_url: varchar({ length: 255 }),
  locale: varchar({ length: 50 }),
});

export const affiliates = videotranscriberSchema.table("affiliates", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user_uuid: varchar({ length: 255 }).notNull(),
  created_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }).notNull().default(""),
  invited_by: varchar({ length: 255 }).notNull(),
  paid_order_no: varchar({ length: 255 }).notNull().default(""),
  paid_amount: integer().notNull().default(0),
  reward_percent: integer().notNull().default(0),
  reward_amount: integer().notNull().default(0),
});

export const feedbacks = videotranscriberSchema.table("feedbacks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  created_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }),
  user_uuid: varchar({ length: 255 }),
  content: text(),
  rating: integer(),
});

export const generationRecords = videotranscriberSchema.table(
  "generation_records",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: varchar({ length: 255 }).notNull().unique(),
    user_uuid: varchar({ length: 255 }).notNull(),
    type: varchar({ length: 50 }).notNull(),
    prompt: text(),
    status: varchar({ length: 20 }).notNull(),
    credits_used: integer().notNull().default(0),
    result_url: text(),
    error_message: text(),
    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp({ withTimezone: true }),
  },
);

export const anonymousUsageLogs = videotranscriberSchema.table(
  "anonymous_usage_logs",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    anonymous_uuid: varchar({ length: 255 }).notNull(),
    api_type: varchar({ length: 50 }).notNull(),
    ip_address: varchar({ length: 255 }),
    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
);

/** One transcription job / My files entry. */
export const workspaces = videotranscriberSchema.table(
  "workspaces",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    workspace_id: varchar({ length: 64 }).notNull().unique(),
    user_uuid: varchar({ length: 255 }).notNull().default(""),
    source_url: text().notNull().default(""),
    playback_url: text().notNull().default(""),
    thumbnail_url: text().notNull().default(""),
    title: varchar({ length: 512 }).notNull().default(""),
    platform: varchar({ length: 64 }).notNull().default(""),
    youtube_id: varchar({ length: 64 }).notNull().default(""),
    media_kind: varchar({ length: 16 }).notNull().default(""),
    duration_seconds: integer(),
    source_language: varchar({ length: 32 }).notNull().default("auto"),
    note_mode: varchar({ length: 64 }).notNull().default("smart_summary"),
    separate_speaker: boolean().notNull().default(false),
    detected_language: varchar({ length: 32 }).notNull().default(""),
    status: varchar({ length: 32 }).notNull().default("ready"),
    /** Ask AI multi-turn history JSON */
    ask_messages_json: text().notNull().default("[]"),
    media_expires_at: timestamp({ withTimezone: true }),
    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp({ withTimezone: true }),
  },
  (table) => [
    index("vt_workspaces_user_uuid_idx").on(table.user_uuid),
    index("vt_workspaces_created_at_idx").on(table.created_at),
  ],
);

/** Files stored on R2 for a workspace. */
export const mediaAssets = videotranscriberSchema.table(
  "media_assets",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    asset_id: varchar({ length: 64 }).notNull().unique(),
    workspace_id: varchar({ length: 64 }).notNull().default(""),
    kind: varchar({ length: 32 }).notNull().default("video"),
    storage_key: text().notNull().default(""),
    public_url: text().notNull().default(""),
    content_type: varchar({ length: 128 }).notNull().default(""),
    bytes: bigint({ mode: "number" }).notNull().default(0),
    filename: varchar({ length: 255 }).notNull().default(""),
    expires_at: timestamp({ withTimezone: true }),
    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("vt_media_assets_workspace_id_idx").on(table.workspace_id),
  ],
);

export const transcripts = videotranscriberSchema.table(
  "transcripts",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    workspace_id: varchar({ length: 64 }).notNull().unique(),
    text: text().notNull().default(""),
    segments_json: text().notNull().default("[]"),
    language: varchar({ length: 32 }).notNull().default(""),
    provider: varchar({ length: 64 }).notNull().default("replicate"),
    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp({ withTimezone: true }),
  },
  (table) => [index("vt_transcripts_workspace_id_idx").on(table.workspace_id)],
);

/** @deprecated leftover from template — keep so existing models compile. */
export const faceReports = videotranscriberSchema.table(
  "face_reports",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    report_id: varchar({ length: 255 }).notNull().unique(),
    user_uuid: varchar({ length: 255 }).notNull().default(""),
    user_email: varchar({ length: 255 }).notNull().default(""),
    score: integer().notNull().default(0),
    out_of_ten: varchar({ length: 16 }).notNull().default(""),
    tier_name: varchar({ length: 64 }).notNull().default(""),
    face_shape: varchar({ length: 64 }).notNull().default(""),
    src: varchar({ length: 64 }).notNull().default(""),
    preview_url: text().notNull().default(""),
    scan_json: text().notNull().default(""),
    unlocked_at: timestamp({ withTimezone: true }),
    created_at: timestamp({ withTimezone: true }),
    updated_at: timestamp({ withTimezone: true }),
    status: varchar({ length: 50 }).notNull().default("active"),
  },
  (table) => [
    uniqueIndex("vt_face_reports_report_id_idx").on(table.report_id),
  ],
);

/** @deprecated leftover from template. */
export const convertJobs = videotranscriberSchema.table("convert_jobs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  uuid: varchar({ length: 255 }).notNull().unique(),
  kie_task_id: varchar({ length: 255 }).notNull().default(""),
  user_uuid: varchar({ length: 255 }).notNull().default(""),
  user_email: varchar({ length: 255 }).notNull().default(""),
  title: varchar({ length: 255 }).notNull().default("Conversion"),
  original_url: text().notNull().default(""),
  lineart_url: text().notNull().default(""),
  geometry_url: text().notNull().default(""),
  status: varchar({ length: 50 }).notNull().default("processing"),
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp({ withTimezone: true }),
});
