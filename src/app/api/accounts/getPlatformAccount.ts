'use server';

import { initializeStripe } from '@/utils/initializeStripe';

export const getPlatformAccount = async ({
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: {
  stripeSecretKey?: string;
} = {}) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get platform account because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const { default_currency, country } = await stripe.accounts.retrieve();

  return {
    default_currency,
    country,
  };
};
