'use server';

import { STRIPE_API_VERSION } from '@/constants/stripeApiVersion';
import { initializeStripe } from '@/utils/initializeStripe';

type ExpireFinancingOfferParams = {
  stripeSecretKey?: string;
  offerId: string;
};

export const expireFinancingOffer = async ({
  offerId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: ExpireFinancingOfferParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get financing offers because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey, {
    // @ts-ignore
    apiVersion: `${STRIPE_API_VERSION}; embedded_connect_beta=v2`,
  });

  await stripe.rawRequest(
    'POST',
    `/v1/capital/financing_offers/${offerId}/expire`,
    {},
  );

  return null;
};
