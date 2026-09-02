import {
  pgSchema,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Isolated schema so this app can share Face Rating's Supabase project. */
export const imagetocadSchema = pgSchema("imagetocad");

export const users = imagetocadSchema.table(
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
  },
  (table) => [
    uniqueIndex("itc_email_provider_unique_idx").on(
      table.email,
      table.signin_provider
    ),
  ]
);

export const faceReports = imagetocadSchema.table(
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
    uniqueIndex("itc_face_reports_report_id_idx").on(table.report_id),
  ]
);

export const orders = imagetocadSchema.table("orders", {
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

export const apikeys = imagetocadSchema.table("apikeys", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  api_key: varchar({ length: 255 }).notNull().unique(),
  title: varchar({ length: 100 }),
  user_uuid: varchar({ length: 255 }).notNull(),
  created_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }),
});

export const credits = imagetocadSchema.table("credits", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  trans_no: varchar({ length: 255 }).notNull().unique(),
  created_at: timestamp({ withTimezone: true }),
  user_uuid: varchar({ length: 255 }).notNull(),
  trans_type: varchar({ length: 50 }).notNull(),
  credits: integer().notNull(),
  order_no: varchar({ length: 255 }),
  expired_at: timestamp({ withTimezone: true }),
});

export const posts = imagetocadSchema.table("posts", {
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

export const affiliates = imagetocadSchema.table("affiliates", {
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

export const feedbacks = imagetocadSchema.table("feedbacks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  created_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }),
  user_uuid: varchar({ length: 255 }),
  content: text(),
  rating: integer(),
});

export const generationRecords = imagetocadSchema.table("generation_records", {
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
});

export const anonymousUsageLogs = imagetocadSchema.table("anonymous_usage_logs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  anonymous_uuid: varchar({ length: 255 }).notNull(),
  api_type: varchar({ length: 50 }).notNull(),
  ip_address: varchar({ length: 255 }),
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const convertJobs = imagetocadSchema.table("convert_jobs", {
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
