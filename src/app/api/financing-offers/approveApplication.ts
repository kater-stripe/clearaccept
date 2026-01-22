'use server';

import { STRIPE_API_VERSION } from '@/constants/stripeApiVersion';
import { initializeStripe } from '@/utils/initializeStripe';

type ApproveApplicationParams = {
  stripeSecretKey?: string;
  offerId: string;
};

export const approveApplication = async ({
  offerId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: ApproveApplicationParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get financing offers because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey, {
    // @ts-ignore
    apiVersion: `${STRIPE_API_VERSION}; embedded_connect_beta=v2`,
  });

  try {
    await stripe.rawRequest(
      'POST',
      `/v1/capital/financing_offers/${offerId}/payout`,
      {},
    );
  } catch (error) {
    console.error('Unable to approve financing offer.', error);

    return {
      message:
        'Capital review may not exist yet. Please try again in 30 seconds.',
    };
  }

  return null;
};
