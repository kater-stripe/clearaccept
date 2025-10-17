'use server';

import Stripe from 'stripe';

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
      apiVersion: '2025-07-30.preview',
    },
  );

  return {
    ephemeralKeySecret: ephemeralKey.secret!,
    issuingCard,
    nonce,
  };
};
