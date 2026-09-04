/**
 * Create or reuse Stripe Prices for Video Transcriber minute packs and plans.
 * Usage: node scripts/sync-stripe-prices.mjs .env.development
 */
import fs from "node:fs";
import path from "node:path";
import Stripe from "stripe";

const envPath = path.resolve(process.argv[2] || ".env.development");

function loadEnv(file) {
  const out = {};
  const text = fs.readFileSync(file, "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const SKUS = [
  {
    env: "STRIPE_MINUTES_500_PRICE_ID",
    lookup: "vt_minutes_500",
    name: "500 minutes pack",
    amount: 500,
    credits: 500,
  },
  {
    env: "STRIPE_MINUTES_1000_PRICE_ID",
    lookup: "vt_minutes_1000",
    name: "1,000 minutes pack",
    amount: 1000,
    credits: 1000,
  },
  {
    env: "STRIPE_MINUTES_3000_PRICE_ID",
    lookup: "vt_minutes_3000",
    name: "3,000 minutes pack",
    amount: 2500,
    credits: 3000,
  },
  {
    env: "STRIPE_BASIC_MONTHLY_PRICE_ID",
    lookup: "vt_basic_monthly",
    name: "Basic monthly",
    amount: 900,
    credits: 1200,
    interval: "month",
  },
  {
    env: "STRIPE_BASIC_YEARLY_PRICE_ID",
    lookup: "vt_basic_yearly",
    name: "Basic yearly",
    amount: 7200,
    credits: 14400,
    interval: "year",
  },
  {
    env: "STRIPE_PRO_MONTHLY_PRICE_ID",
    lookup: "vt_pro_monthly",
    name: "Pro monthly",
    amount: 1900,
    credits: 4000,
    interval: "month",
  },
  {
    env: "STRIPE_PRO_YEARLY_PRICE_ID",
    lookup: "vt_pro_yearly",
    name: "Pro yearly",
    amount: 14400,
    credits: 48000,
    interval: "year",
  },
  {
    env: "STRIPE_STUDIO_MONTHLY_PRICE_ID",
    lookup: "vt_studio_monthly",
    name: "Studio monthly",
    amount: 3900,
    credits: 10000,
    interval: "month",
  },
  {
    env: "STRIPE_STUDIO_YEARLY_PRICE_ID",
    lookup: "vt_studio_yearly",
    name: "Studio yearly",
    amount: 28800,
    credits: 120000,
    interval: "year",
  },
];

const env = loadEnv(envPath);
const key = env.STRIPE_PRIVATE_KEY;
if (!key) {
  console.error(`No STRIPE_PRIVATE_KEY in ${envPath}`);
  process.exit(1);
}

const stripe = new Stripe(key);
const result = {};

for (const sku of SKUS) {
  const existing = await stripe.prices.list({
    lookup_keys: [sku.lookup],
    limit: 1,
    expand: ["data.product"],
  });
  if (existing.data[0]) {
    result[sku.env] = existing.data[0].id;
    continue;
  }

  const product = await stripe.products.create({
    name: sku.name,
    metadata: {
      project: "videotranscriber",
      credits: String(sku.credits),
      lookup: sku.lookup,
    },
  });

  const price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: sku.amount,
    lookup_key: sku.lookup,
    metadata: {
      project: "videotranscriber",
      credits: String(sku.credits),
    },
    ...(sku.interval
      ? { recurring: { interval: sku.interval } }
      : {}),
  });
  result[sku.env] = price.id;
}

console.log(JSON.stringify({ envFile: envPath, mode: key.startsWith("sk_live") ? "live" : "test", prices: result }, null, 2));
