'use server';

import type { CurrencyCode } from '@/constants/currencyCodes';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';
import type Stripe from 'stripe';

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

  const account = await stripe.v2.core.accounts.retrieve(accountId);

  try {
    const financialAccount =
      await stripe.v2.moneyManagement.financialAccounts.create(
        {
          display_name: name,
          type: 'storage',
          storage: {
            holds_currencies: [currency ?? account.defaults?.currency ?? 'usd'],
          },
        },
        {
          stripeAccount: accountId,
        },
      );

    const features: Stripe.Treasury.FinancialAccountCreateParams.Features = {
      card_issuing: {
        requested: true,
      },
      financial_addresses: {
        aba: {
          requested: true,
        },
      },
      inbound_transfers: {
        ach: {
          requested: true,
        },
      },
      intra_stripe_flows: {
        requested: true,
      },
      outbound_payments: {
        ach: {
          requested: true,
        },
      },
      outbound_transfers: {
        ach: {
          requested: true,
        },
      },
    };

    for (const [feature, value] of Object.entries(features)) {
      try {
        await stripe.treasury.financialAccounts.update(
          financialAccount.id,
          {
            features: { [feature]: value },
          },
          {
            stripeAccount: accountId,
          },
        );
      } catch (error) {
        console.error(
          `Unable to request feature ${feature} for account ${financialAccount.id}`,
          error,
        );
      }
    }

    return plain(financialAccount);
  } catch (error) {
    console.error(
      `Unable to create financial account ${name} for account ${accountId}`,
      error,
    );

    return {
      message: 'modals.create-financial-account.error',
    };
  }
};
