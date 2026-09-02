/**
 * Create or reuse Stripe Prices for image-to-cad credit packs and plans.
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
    env: "STRIPE_STARTER_PACK_PRICE_ID",
    lookup: "imagetocad_starter_pack",
    name: "Starter · 5 credits",
    amount: 999,
    credits: 5,
  },
  {
    env: "STRIPE_POPULAR_PACK_PRICE_ID",
    lookup: "imagetocad_popular_pack",
    name: "Popular · 20 credits",
    amount: 2499,
    credits: 20,
  },
  {
    env: "STRIPE_PLUS_PACK_PRICE_ID",
    lookup: "imagetocad_plus_pack",
    name: "Plus · 50 credits",
    amount: 4999,
    credits: 50,
  },
  {
    env: "STRIPE_BULK_PACK_PRICE_ID",
    lookup: "imagetocad_bulk_pack",
    name: "Bulk · 100 credits",
    amount: 8999,
    credits: 100,
  },
  {
    env: "STRIPE_HOBBY_MONTHLY_PRICE_ID",
    lookup: "imagetocad_hobby_monthly",
    name: "Hobby monthly",
    amount: 1500,
    credits: 20,
    interval: "month",
  },
  {
    env: "STRIPE_HOBBY_YEARLY_PRICE_ID",
    lookup: "imagetocad_hobby_yearly",
    name: "Hobby yearly",
    amount: 15000,
    credits: 240,
    interval: "year",
  },
  {
    env: "STRIPE_PRO_MONTHLY_PRICE_ID",
    lookup: "imagetocad_pro_monthly",
    name: "Pro monthly",
    amount: 2900,
    credits: 60,
    interval: "month",
  },
  {
    env: "STRIPE_PRO_YEARLY_PRICE_ID",
    lookup: "imagetocad_pro_yearly",
    name: "Pro yearly",
    amount: 29000,
    credits: 720,
    interval: "year",
  },
  {
    env: "STRIPE_STUDIO_MONTHLY_PRICE_ID",
    lookup: "imagetocad_studio_monthly",
    name: "Studio monthly",
    amount: 7900,
    credits: 200,
    interval: "month",
  },
  {
    env: "STRIPE_STUDIO_YEARLY_PRICE_ID",
    lookup: "imagetocad_studio_yearly",
    name: "Studio yearly",
    amount: 79000,
    credits: 2400,
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
      project: "imagetocad",
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
      project: "imagetocad",
      credits: String(sku.credits),
    },
    ...(sku.interval
      ? { recurring: { interval: sku.interval } }
      : {}),
  });
  result[sku.env] = price.id;
}

console.log(JSON.stringify({ envFile: envPath, mode: key.startsWith("sk_live") ? "live" : "test", prices: result }, null, 2));
