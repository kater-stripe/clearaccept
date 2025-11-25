'use server';

import Stripe from 'stripe';
import { STRIPE_API_VERSION } from '@/constants/stripeApiVersion';

type FullyRepayFinancingOfferParams = {
  stripeSecretKey?: string;
  offerId: string;
};

export const fullyRepayFinancingOffer = async ({
  offerId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: FullyRepayFinancingOfferParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get financing offers because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    // @ts-ignore
    apiVersion: `${STRIPE_API_VERSION}; embedded_connect_beta=v2`,
  });

  await stripe.rawRequest(
    'POST',
    `/v1/capital/financing_offers/${offerId}/fully_repay`,
    {},
  );

  return null;
};
