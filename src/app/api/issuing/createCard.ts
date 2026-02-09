'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type CreateCardParams = {
  cardholderId: string;
  type: 'virtual' | 'physical';
  currency: string;
  status?: 'active' | 'inactive';
  financialAccountId?: string;
  accountId: string;
  stripeSecretKey?: string;
};

export const createCard = async ({
  cardholderId,
  type,
  currency,
  status = 'active',
  financialAccountId,
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: CreateCardParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create card because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  try {
    const card = await stripe.issuing.cards.create(
      {
        cardholder: cardholderId,
        type,
        currency,
        status,
        ...(financialAccountId
          ? { financial_account_v2: financialAccountId }
          : {}),
      },
      {
        stripeAccount: accountId,
      },
    );

    return plain(card);
  } catch (error) {
    console.error('Unable to create card:', error);

    return {
      message: 'An error occurred while creating the card.',
    };
  }
};

