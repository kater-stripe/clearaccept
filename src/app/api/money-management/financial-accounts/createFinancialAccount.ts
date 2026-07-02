'use server';

import type { CurrencyCode } from '@/constants/currencyCodes';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';
import { createFinancialAddress } from '@/app/api/money-management/financial-addresses/createFinancialAddress';

type CreateFinancialAccountParams = {
  name: string;
  accountId: string;
  currency?: CurrencyCode;
  stripeSecretKey?: string;
};

export const createFinancialAccount = async ({
  name,
  accountId,
  currency,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: CreateFinancialAccountParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create financial account because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const account = await stripe.v2.core.accounts.retrieve(accountId, {
    include: ['defaults', 'identity'],
  });
  const envCurrency = process.env.CURRENCY?.toLowerCase();
  const resolvedCurrency = currency ?? account.defaults?.currency ?? envCurrency ?? 'gbp';
  const country = account.identity?.country?.toUpperCase() ?? 'GB';

  try {
    // v2 API: use stripeContext (Stripe-Context header), not stripeAccount (Stripe-Account header)
    const financialAccount =
      await stripe.v2.moneyManagement.financialAccounts.create(
        {
          display_name: name,
          type: 'storage',
          storage: {
            holds_currencies: [resolvedCurrency],
          },
        },
        {
          stripeContext: accountId,
        },
      );

    // Provision a financial address so the account can receive funds
    try {
      await createFinancialAddress({
        accountId,
        financialAccountId: financialAccount.id,
        country: country === 'GB' ? 'GB' : 'US',
        stripeSecretKey,
      });
    } catch (error) {
      console.error(
        `Unable to create financial address for FA ${financialAccount.id}`,
        error,
      );
    }

    return plain(financialAccount);
  } catch (error) {
    console.error(
      `Unable to create financial account "${name}" for account ${accountId}`,
      error,
    );

    return {
      message: 'modals.create-financial-account.error',
    };
  }
};
