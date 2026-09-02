import Stripe from "stripe";

export class StripeClient {
  private client: Stripe;
  private config: {
    privateKey: string;
  };

  constructor({ privateKey }: { privateKey?: string }) {
    if (!privateKey) {
      privateKey = process.env.STRIPE_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error("STRIPE_PRIVATE_KEY is not set");
      }
    }

    const key = privateKey.trim().replace(/^["']|["']$/g, "");
    // Server Checkout / API must use sk_… secret keys, never pk_… publishable keys
    if (key.startsWith("pk_")) {
      throw new Error(
        "STRIPE_PRIVATE_KEY is a publishable key (pk_…). Swap it with STRIPE_PUBLIC_KEY — server needs sk_… from https://dashboard.stripe.com/apikeys"
      );
    }
    if (!key.startsWith("sk_")) {
      throw new Error(
        "STRIPE_PRIVATE_KEY must start with sk_test_ or sk_live_"
      );
    }

    this.config = {
      privateKey: key,
    };

    this.client = new Stripe(key);
  }

  stripe() {
    return this.client;
  }

  privateKey() {
    return this.config.privateKey;
  }
}

export function newStripeClient({
  privateKey,
}: {
  privateKey?: string;
} = {}): StripeClient {
  return new StripeClient({
    privateKey,
  });
}
