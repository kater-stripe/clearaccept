'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type GetCardParams = {
  cardId: string;
  accountId: string;
  stripeSecretKey?: string;
};

export const getCard = async ({
  cardId,
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: GetCardParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get card because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const card = await stripe.issuing.cards.retrieve(
    cardId,
    {
      expand: ['number', 'cvc'],
    },
    {
      stripeAccount: accountId,
    },
  );

  return plain(card);
};

