'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { plain } from '@/utils/plain';
import Stripe from 'stripe';

type ProcessSetupIntentParams = {
  readerId: string;
  setupIntentId: string;
  stripeSecretKey?: string;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
};

export const processSetupIntent = async ({
  readerId,
  setupIntentId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  chargeType,
  accountId,
}: ProcessSetupIntentParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to process setup intent because a secret key was not provided nor found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const reader = await stripe.terminal.readers.processSetupIntent(
    readerId,
    {
      setup_intent: setupIntentId,
      allow_redisplay: 'always',
    },
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  return plain(reader);
};
