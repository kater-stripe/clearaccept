'use server';

import { plain } from '@/utils/plain';
import Stripe from 'stripe';

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

  const stripe = new Stripe(stripeSecretKey);

  const balances = await stripe.balance.retrieve({
    ...(accountId ? { stripeAccount: accountId } : {}),
  });

  return plain(balances);
};
