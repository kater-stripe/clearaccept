'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type GetFinancialAddressesParams = {
  accountId: string;
  stripeSecretKey?: string;
  financialAccountId: string;
};

export const getFinancialAddresses = async ({
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  financialAccountId,
}: GetFinancialAddressesParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get financial accounts because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const { data: financialAddresses } =
    await stripe.v2.moneyManagement.financialAddresses.list(
      {
        financial_account: financialAccountId,
        include: [
          'credentials.gb_bank_account.account_number',
          'credentials.us_bank_account.account_number',
        ],
      },
      {
        stripeAccount: accountId,
      },
    );

  return plain(financialAddresses);
};
