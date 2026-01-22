'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type GetSetupIntentByIdParams = {
  stripePublishableKey?: string;
  id: string;
  clientSecret: string;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
};

export const getSetupIntentById = async ({
  stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY,
  id,
  clientSecret,
  chargeType,
  accountId,
}: GetSetupIntentByIdParams) => {
  if (!stripePublishableKey) {
    throw new Error(
      'Unable to get setup intent because a publishable key was not provided nor found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripePublishableKey);

  const setupIntent = await stripe.setupIntents.retrieve(
    id,
    {
      client_secret: clientSecret,
    },
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  return plain(setupIntent);
};
