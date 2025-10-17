'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { plain } from '@/utils/plain';
import Stripe from 'stripe';

type GetReadersByLocationIdParams = {
  locationId: string;
  stripeSecretKey?: string;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
  status?: 'online';
};

export const getReadersByLocationId = async ({
  locationId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  chargeType,
  accountId,
  status,
}: GetReadersByLocationIdParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to retrieve terminal reader because a secret key was not provided nor found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const { data: readers } = await stripe.terminal.readers.list(
    {
      location: locationId,
      status,
    },
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  return plain(readers);
};
