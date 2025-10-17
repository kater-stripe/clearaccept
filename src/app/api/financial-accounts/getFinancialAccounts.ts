'use server';

import { plain } from '@/utils/plain';
import Stripe from 'stripe';

type GetFinancialAccountsParams = {
  accountId: string;
  limit?: number;
  stripeSecretKey?: string;
};

export const getFinancialAccounts = async ({
  accountId,
  limit = 100,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: GetFinancialAccountsParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get financial accounts because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const { data: financialAccounts } =
    await stripe.treasury.financialAccounts.list(
      {
        limit,
      },
      {
        stripeAccount: accountId,
      },
    );

  return plain(financialAccounts);
};
