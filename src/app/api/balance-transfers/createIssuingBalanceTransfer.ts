'use server';

import { CurrencyCode } from '@/constants/currencyCodes';
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
      'Unable to get account balance because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const balanceTransferRes = await fetch(
    'https://api.stripe.com/v1/balance_transfers',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2025-07-30.preview',
        ...(accountId ? { 'Stripe-Account': accountId } : {}),
        Authorization: `Bearer ${stripeSecretKey}`,
      },
      body: new URLSearchParams({
        amount: amount.toString(),
        currency,
        'source_balance[type]': 'payments',
        'destination_balance[type]': 'issuing',
      }).toString(),
    },
  );

  if (!balanceTransferRes.ok) {
    try {
      console.error('Unable to create issuing balance transfer.');

      console.error(await balanceTransferRes.json());
    } catch {}

    return {
      message: 'dashboard.expenses.issuing-topups.error',
    };
  }

  const balanceTransfer = await balanceTransferRes.json();

  return plain(balanceTransfer);
};
