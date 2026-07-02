'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type GetBalancesParams = {
  accountId?: string;
  stripeSecretKey?: string;
};

export const getBalances = async ({
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: GetBalancesParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get account balance because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const balances = await stripe.balance.retrieve(
    {},
    accountId ? { stripeAccount: accountId } : {},
  );

  return plain(balances);
};
