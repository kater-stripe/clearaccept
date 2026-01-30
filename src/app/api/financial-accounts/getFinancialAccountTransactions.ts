'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type GetFinancialAccountTransactionsParams = {
  accountId: string;
  financialAccountId: string;
  stripeSecretKey?: string;
};

export const getFinancialAccountTransactions = async ({
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  financialAccountId,
}: GetFinancialAccountTransactionsParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get financial account transactions because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const { data: transactions } =
    await stripe.v2.moneyManagement.transactions.list(
      {
        financial_account: financialAccountId,
      },
      {
        stripeAccount: accountId,
      },
    );

  return plain(transactions);
};
