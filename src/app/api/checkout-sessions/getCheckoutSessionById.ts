'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { plain } from '@/utils/plain';
import Stripe from 'stripe';

type GetCheckoutSessionByIdParams = {
  stripeSecretKey?: string;
  id: string;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
};

export const getCheckoutSessionById = async ({
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  id,
  chargeType,
  accountId,
}: GetCheckoutSessionByIdParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get checkout session because a secret key was not provided nor found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const checkoutSession = await stripe.checkout.sessions.retrieve(
    id,
    chargeType === 'direct'
      ? {
          stripeAccount: accountId,
        }
      : undefined,
  );

  return plain(checkoutSession);
};
