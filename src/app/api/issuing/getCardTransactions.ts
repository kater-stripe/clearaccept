'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type GetCardTransactionsParams = {
  cardId: string;
  accountId: string;
  limit?: number;
  stripeSecretKey?: string;
};

export const getCardTransactions = async ({
  cardId,
  accountId,
  limit = 100,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: GetCardTransactionsParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get card transactions because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const { data: transactions } = await stripe.issuing.transactions.list(
    {
      card: cardId,
      limit,
    },
    {
      stripeAccount: accountId,
    },
  );

  return plain(transactions);
};

