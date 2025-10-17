'use server';

import Stripe from 'stripe';

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

  const stripe = new Stripe(stripeSecretKey, {
    // @ts-ignore
    apiVersion: '2023-10-16; embedded_connect_beta=v2',
  });

  await stripe.rawRequest(
    'POST',
    `/v1/capital/financing_offers/${offerId}/expire`,
    {},
  );

  return null;
};
