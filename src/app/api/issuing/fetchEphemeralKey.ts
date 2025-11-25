'use server';

import Stripe from 'stripe';
import { STRIPE_API_VERSION } from '@/constants/stripeApiVersion';

type FetchEphemeralKeyParams = {
  issuingCard: string;
  nonce: string;
  accountId: string;
  stripeSecretKey?: string;
};

export const fetchEphemeralKey = async ({
  issuingCard,
  nonce,
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: FetchEphemeralKeyParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to fetch ephemeral key because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const ephemeralKey = await stripe.ephemeralKeys.create(
    {
      issuing_card: issuingCard,
      nonce,
    },
    {
      stripeAccount: accountId,
      apiVersion: STRIPE_API_VERSION
    },
  );

  return {
    ephemeralKeySecret: ephemeralKey.secret!,
    issuingCard,
    nonce,
  };
};
