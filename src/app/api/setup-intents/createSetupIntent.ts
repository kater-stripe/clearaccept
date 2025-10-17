'use server';

import Stripe from 'stripe';
import { plain } from '@/utils/plain';
import type { DemoConfig } from '@/types/demoConfig';

type CreateSetupIntentParams = {
  stripeSecretKey?: string;
  customerId: string;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
};

export const createSetupIntent = async ({
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  customerId,
  chargeType,
  accountId,
}: CreateSetupIntentParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create setup intent because a secret key was not provided nor found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const setupIntent = await stripe.setupIntents.create(
    {
      customer: customerId,
      usage: 'off_session',
      ...(chargeType === 'destination-on-behalf-of'
        ? {
            on_behalf_of: accountId,
          }
        : {}),
    },
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  if (setupIntent.client_secret === null) {
    throw new Error('SetupIntent client secret is null');
  }

  return plain(setupIntent);
};
