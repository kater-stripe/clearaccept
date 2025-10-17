'use server';

import Stripe from 'stripe';

type RejectApplicationParams = {
  stripeSecretKey?: string;
  offerId: string;
};

export const rejectApplication = async ({
  offerId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: RejectApplicationParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get financing offers because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    // @ts-ignore
    apiVersion: '2023-10-16; embedded_connect_beta=v2',
  });

  try {
    await stripe.rawRequest(
      'POST',
      `/v1/capital/financing_offers/${offerId}/revoke_v2`,
      {},
    );
  } catch (error) {
    console.error('Unable to reject financing offer.', error);

    return {
      message:
        'Capital review may not exist yet. Please try again in 30 seconds.',
    };
  }

  return null;
};
