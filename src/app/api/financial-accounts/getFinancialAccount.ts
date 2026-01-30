'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type GetFinancialAccountParams = {
  accountId: string;
  financialAccountId: string;
  stripeSecretKey?: string;
};

export const getFinancialAccount = async ({
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  financialAccountId,
}: GetFinancialAccountParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get financial account because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const financialAccount =
    await stripe.v2.moneyManagement.financialAccounts.retrieve(
      financialAccountId,
      {
        stripeAccount: accountId,
      },
    );
    
  return plain(financialAccount);
};
