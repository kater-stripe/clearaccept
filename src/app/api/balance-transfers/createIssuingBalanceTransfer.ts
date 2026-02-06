'use server';

import type { CurrencyCode } from '@/constants/currencyCodes';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type CreateIssuingBalanceTransferParams = {
  amount: number;
  currency: CurrencyCode;
  accountId?: string;
  stripeSecretKey?: string;
};

export const createIssuingBalanceTransfer = async ({
  amount,
  currency,
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: CreateIssuingBalanceTransferParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create issuing balance transfer because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  try {
    const balanceTransfer = await stripe.rawRequest(
      'POST',
      '/v1/balance_transfers',
      {
        amount: amount.toString(),
        currency,
        'source_balance[type]': 'payments',
        'destination_balance[type]': 'issuing',
      },
      {
        ...(accountId ? { stripeAccount: accountId } : {}),
        apiVersion: '2025-07-30.preview',
      },
    );

    return plain(balanceTransfer);
  } catch (error) {
    console.error('Unable to create issuing balance transfer:', error);

    return {
      message: 'dashboard.expenses.issuing-topups.error',
    };
  }
};
