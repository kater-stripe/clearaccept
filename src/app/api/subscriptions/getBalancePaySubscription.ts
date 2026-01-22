'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type GetBalancePaySubscriptionParams = {
  stripeSecretKey?: string;
  email: string;
};

export const getBalancePaySubscription = async ({
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  email,
}: GetBalancePaySubscriptionParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get balance pay subscription because a secret key was not provided nor found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const { data: customers } = await stripe.customers.list({
    email: email,
  });

  if (customers.length === 0) {
    null;
  }

  const [customer] = customers;

  const { data: subscriptions } = await stripe.subscriptions.list({
    customer: customer.id,
  });

  if (subscriptions.length === 0) {
    return null;
  }

  const [latestSubscription] = subscriptions.sort(
    (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime(),
  );

  return plain(latestSubscription);
};
