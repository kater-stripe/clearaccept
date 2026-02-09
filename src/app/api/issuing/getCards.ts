'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';
import type Stripe from 'stripe';

type GetCardsParams = {
  accountId: string;
  status?: Stripe.Issuing.Card.Status;
  limit?: number;
  stripeSecretKey?: string;
};

export const getCards = async ({
  accountId,
  status,
  limit = 100,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: GetCardsParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get cards because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const { data: cards } = await stripe.issuing.cards.list(
    {
      limit,
      ...(status ? { status } : {}),
    },
    {
      stripeAccount: accountId,
    },
  );

  return plain(cards);
};

