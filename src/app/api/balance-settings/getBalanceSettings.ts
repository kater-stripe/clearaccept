'use server';

import { STRIPE_API_VERSION } from '@/constants/stripeApiVersion';
import { plain } from '@/utils/plain';

type GetBalanceSettingsParams = {
  accountId?: string;
  stripeSecretKey?: string;
};

/**
 * Retrieves the current balance settings for an account, including
 * any automatic transfer rules configured for v2 Financial Accounts.
 */
export const getBalanceSettings = async ({
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: GetBalanceSettingsParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get balance settings because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const res = await fetch('https://api.stripe.com/v1/balance_settings', {
    method: 'GET',
    headers: {
      'Stripe-Version': STRIPE_API_VERSION,
      ...(accountId ? { 'Stripe-Account': accountId } : {}),
      Authorization: `Bearer ${stripeSecretKey}`,
    },
  });

  if (!res.ok) {
    try {
      const error = await res.json();
      console.error('Unable to get balance settings:', error);
      return null;
    } catch {
      return null;
    }
  }

  const balanceSettings = await res.json();

  return plain(balanceSettings);
};

