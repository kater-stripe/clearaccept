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

  // Card IDs and cardholder IDs to exclude from results
  const EXCLUDED_CARD_IDS = [
    'ic_1SzROdIh1x3YP8euMrJVL4HB',
    'ic_1SzROQIh1x3YP8euMTE8qSs4',
  ];
  const { data: cards } = await stripe.issuing.cards.list(
    {
      limit,
      ...(status ? { status } : {}),
    },
    {
      stripeContext: accountId,
    },
  );

  // Filter out excluded cards and cardholders
  const filteredCards = cards.filter(
    (card) => !EXCLUDED_CARD_IDS.includes(card.id),
  );

  return plain(filteredCards);
};
