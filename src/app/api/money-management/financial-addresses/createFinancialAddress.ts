'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type CreateFinancialAddressParams = {
  accountId: string;
  financialAccountId: string;
  stripeSecretKey?: string;
};

export const createFinancialAddress = async ({
  accountId,
  financialAccountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: CreateFinancialAddressParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create financial address because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  // Only GBP financial accounts support GB bank account addresses
  const fa = await stripe.v2.moneyManagement.financialAccounts.retrieve(
    financialAccountId,
    { stripeContext: accountId },
  );
  const currencies: string[] = (fa as any).storage?.holds_currencies ?? [];
  if (!currencies.includes('gbp')) {
    return null;
  }

  try {
    // v2 API requires Stripe-Context header (stripeContext), not Stripe-Account (stripeAccount)
    const financialAddress =
      await stripe.v2.moneyManagement.financialAddresses.create(
        {
          financial_account: financialAccountId,
          type: 'gb_bank_account',
        },
        {
          stripeContext: accountId,
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
