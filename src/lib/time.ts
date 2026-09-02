export function getIsoTimestr(): string {
  return new Date().toISOString();
}

export const getTimestamp = () => {
  let time = Date.parse(new Date().toUTCString());

  return time / 1000;
};

export const getMillisecond = () => {
  let time = new Date().getTime();

  return time;
};

export const MONTHLY_CREDIT_EXPIRY_DAYS = 30;
export const YEARLY_GRANTS_PER_CYCLE = 12;

/** Add calendar months without the extra Stripe grace day. */
export function addMonths(from: Date, months: number): Date {
  const d = new Date(from.getTime());
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0);
  return d;
}

export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

/** Fixed-day expiry, e.g. monthly subscription lots = 30 days. */
export function creditExpiresAtDays(days: number, from: Date = new Date()): string {
  return addDays(from, days).toISOString();
}

/** Calendar-month expiry: packs, yearly grants, and new-user credits. */
export function creditExpiresAt(months: number, from: Date = new Date()): string {
  return addMonths(from, months).toISOString();
}

/** Monthly lots expire in 30 days; yearly grants and packs expire in 12 months. */
export function subscriptionCreditExpiresAt(
  interval: "month" | "year" | "one-time",
  from: Date = new Date()
): string {
  if (interval === "month") {
    return creditExpiresAtDays(MONTHLY_CREDIT_EXPIRY_DAYS, from);
  }
  return creditExpiresAt(12, from);
}

export const getOneYearLaterTimestr = () => creditExpiresAt(12);
