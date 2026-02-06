'use server';

import { initializeStripe } from '@/utils/initializeStripe';
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

  const stripe = initializeStripe(stripeSecretKey);

  try {
    const balanceSettings = await stripe.balanceSettings.retrieve(
      {},
      accountId ? { stripeAccount: accountId } : undefined,
    );

    return plain(balanceSettings);
  } catch (error) {
    console.error('Unable to get balance settings:', error);
    return null;
  }
};
