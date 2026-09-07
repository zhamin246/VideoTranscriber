/**
 * Create or reuse Stripe Prices for Video Transcriber minute packs and plans.
 * Usage: node scripts/sync-stripe-prices.mjs .env.development
 *
 * Aligned to UniScribe: Basic 1200 / Standard 3000 / Pro 6000;
 * One-time Lite $12.90/300 · Plus $19.90/600 · Max $49.90/3000.
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
    env: "STRIPE_MINUTES_300_PRICE_ID",
    lookup: "vt_minutes_300",
    name: "Lite · 300 minutes",
    amount: 1290,
    credits: 300,
  },
  {
    env: "STRIPE_MINUTES_600_PRICE_ID",
    lookup: "vt_minutes_600",
    name: "Plus · 600 minutes",
    amount: 1990,
    credits: 600,
  },
  {
    env: "STRIPE_MINUTES_3000_PRICE_ID",
    lookup: "vt_minutes_3000_max",
    name: "Max · 3,000 minutes",
    amount: 4990,
    credits: 3000,
  },
  {
    env: "STRIPE_BASIC_MONTHLY_PRICE_ID",
    lookup: "vt_basic_monthly_10",
    name: "Basic monthly",
    amount: 1000,
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
    env: "STRIPE_STANDARD_MONTHLY_PRICE_ID",
    lookup: "vt_standard_monthly",
    name: "Standard monthly",
    amount: 2000,
    credits: 3000,
    interval: "month",
  },
  {
    env: "STRIPE_STANDARD_YEARLY_PRICE_ID",
    lookup: "vt_standard_yearly",
    name: "Standard yearly",
    amount: 14400,
    credits: 36000,
    interval: "year",
  },
  {
    env: "STRIPE_PRO_MONTHLY_PRICE_ID",
    lookup: "vt_pro_monthly_30",
    name: "Pro monthly",
    amount: 3000,
    credits: 6000,
    interval: "month",
  },
  {
    env: "STRIPE_PRO_YEARLY_PRICE_ID",
    lookup: "vt_pro_yearly_216",
    name: "Pro yearly",
    amount: 21600,
    credits: 72000,
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

/** Optionally patch env file: node scripts/sync-stripe-prices.mjs .env.development --write */
if (process.argv.includes("--write")) {
  let text = fs.readFileSync(envPath, "utf8");
  for (const [k, v] of Object.entries(result)) {
    const re = new RegExp(`^(${k}\\s*=\\s*).*$`, "m");
    // Avoid `$` in price ids being treated as replace groups
    if (re.test(text)) {
      text = text.replace(re, (_, prefix) => `${prefix}${v}`);
    } else {
      text = `${text.trimEnd()}\n${k} = ${v}\n`;
    }
  }
  fs.writeFileSync(envPath, text);
  console.log(`Wrote ${Object.keys(result).length} price IDs into ${envPath}`);
}
