'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type CreateFinancialAddressParams = {
  accountId: string;
  financialAccountId: string;
  country?: 'US' | 'GB';
  stripeSecretKey?: string;
};

export const createFinancialAddress = async ({
  accountId,
  financialAccountId,
  country = 'US',
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: CreateFinancialAddressParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create financial address because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  try {
    // Create financial address based on country
    const financialAddress =
      await stripe.v2.moneyManagement.financialAddresses.create(
        {
          financial_account: financialAccountId,
          type: country === 'GB' ? 'gb_bank_account' : 'us_bank_account',
        },
        {
          stripeAccount: accountId,
        },
      );

    return plain(financialAddress);
  } catch (error) {
    console.error(
      `Unable to create financial address for FA ${financialAccountId}`,
      error,
    );
    throw error;
  }
};
