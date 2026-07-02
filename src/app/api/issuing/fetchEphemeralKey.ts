'use server';

import { STRIPE_API_VERSION } from '@/constants/stripeApiVersion';
import { initializeStripe } from '@/utils/initializeStripe';

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

  const stripe = initializeStripe(stripeSecretKey);

  const ephemeralKey = await stripe.ephemeralKeys.create(
    {
      issuing_card: issuingCard,
      nonce,
    },
    {
      stripeContext: accountId,
      apiVersion: STRIPE_API_VERSION,
    },
  );

  return {
    ephemeralKeySecret: ephemeralKey.secret!,
    issuingCard,
    nonce,
  };
};
