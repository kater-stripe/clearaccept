import type { Stripe } from 'stripe';

export type DemoMerchant = {
  account: Stripe.Account | Stripe.V2.Core.Account | null;
  email: string | null;
};
