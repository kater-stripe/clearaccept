'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type GetAccountByIdParams = {
  id: string;
  stripeSecretKey?: string;
};

export const getAccountById = async ({
  id,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: GetAccountByIdParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get account by id because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  try {
    const account = await stripe.v2.core.accounts.retrieve(id, {
      include: [
        'requirements',
        'configuration.merchant',
        'configuration.money_manager',
        'configuration.recipient',
        'identity',
        'defaults',
      ],
    });

    return plain(account);
  } catch (error) {
    console.error('Unable to get account by id', error);

    return {
      message: 'sign-in.errors.account-not-found',
    };
  }
};
