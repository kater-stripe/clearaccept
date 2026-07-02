'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

const ADDRESS_TYPE: Record<string, 'gb_bank_account' | 'sepa_bank_account' | 'us_bank_account'> = {
  gbp: 'gb_bank_account',
  eur: 'sepa_bank_account',
  usd: 'us_bank_account',
};

type CreateFinancialAddressParams = {
  accountId: string;
  financialAccountId: string;
  currency?: string;
  stripeSecretKey?: string;
};

export const createFinancialAddress = async ({
  accountId,
  financialAccountId,
  currency = 'gbp',
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: CreateFinancialAddressParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create financial address because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);
  const type = (ADDRESS_TYPE[currency.toLowerCase()] ?? 'gb_bank_account') as 'gb_bank_account' | 'us_bank_account';

  try {
    const financialAddress =
      await stripe.v2.moneyManagement.financialAddresses.create(
        { financial_account: financialAccountId, type },
        { stripeContext: accountId },
      );

    return plain(financialAddress);
  } catch (error: any) {
    if (error?.code === 'unsupported_currency') {
      return null;
    }
    console.error(
      `Unable to create financial address for FA ${financialAccountId}`,
      error,
    );
    throw error;
  }
};
