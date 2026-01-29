import type { Stripe } from 'stripe';

export type DemoMerchant = {
  account: Stripe.V2.Core.Account | null;
  email: string | null;
};
