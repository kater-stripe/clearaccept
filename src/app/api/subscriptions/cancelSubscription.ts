'use server';

import Stripe from 'stripe';
import type { DemoConfig } from '@/types/demoConfig';

type CancelSubscriptionParams = {
  subscriptionId: string;
  stripeSecretKey?: string;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
};

export const cancelSubscription = async ({
  subscriptionId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  chargeType,
  accountId,
}: CancelSubscriptionParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to cancel subscriptions because a secret key was not provided nor found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  await stripe.subscriptions.cancel(
    subscriptionId,
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );
};
