'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type UpdateCardParams = {
  cardId: string;
  status: 'active' | 'inactive' | 'canceled';
  accountId: string;
  stripeSecretKey?: string;
};

export const updateCard = async ({
  cardId,
  status,
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: UpdateCardParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to update card because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  try {
    const card = await stripe.issuing.cards.update(
      cardId,
      {
        status,
      },
      {
        stripeContext: accountId,
      },
    );

    return plain(card);
  } catch (error) {
    console.error('Unable to update card:', error);

    return {
      message: 'An error occurred while updating the card.',
    };
  }
};

