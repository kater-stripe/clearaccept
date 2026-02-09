'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type GetCardholdersParams = {
  accountId: string;
  limit?: number;
  stripeSecretKey?: string;
};

export const getCardholders = async ({
  accountId,
  limit = 100,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: GetCardholdersParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get cardholders because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const { data: cardholders } = await stripe.issuing.cardholders.list(
    {
      limit,
    },
    {
      stripeAccount: accountId,
    },
  );

  return plain(cardholders);
};

