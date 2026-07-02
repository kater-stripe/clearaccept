'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type UpdateCardholderParams = {
  cardholderId: string;
  status: 'active' | 'inactive';
  accountId: string;
  stripeSecretKey?: string;
};

export const updateCardholder = async ({
  cardholderId,
  status,
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: UpdateCardholderParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to update cardholder because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  try {
    const cardholder = await stripe.issuing.cardholders.update(
      cardholderId,
      {
        status,
      },
      {
        stripeContext: accountId,
      },
    );

    return plain(cardholder);
  } catch (error) {
    console.error('Unable to update cardholder:', error);

    return {
      message: 'An error occurred while updating the cardholder.',
    };
  }
};

