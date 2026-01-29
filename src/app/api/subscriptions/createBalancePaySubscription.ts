'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type CreateBalancePaySubscriptionParams = {
  stripeSecretKey?: string;
  accountId: string;
  email: string;
};

export const createBalancePaySubscription = async ({
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  accountId,
  email,
}: CreateBalancePaySubscriptionParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create balance pay subscription because a secret key was not provided nor found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const account = await stripe.v2.core.accounts.retrieve(accountId);

  const { data: prices } = await stripe.prices.list({
    lookup_keys: ['membership'],
    limit: 1,
  });

  if (prices.length === 0) {
    return {
      message:
        'Membership price not found. Make sure seeded products and have a price with the `membership` lookup key.',
    };
  }

  const [membershipPrice] = prices;

  const { data: customers } = await stripe.customers.list({
    email: email,
  });

  const [customer] = customers;

  const setupIntent = await stripe.setupIntents.create({
    customer: customer.id,
    payment_method_types: ['stripe_balance'],
    payment_method_data: {
      type: 'stripe_balance',
      stripe_balance: {
        account: accountId,
      },
    },
    confirm: true,
  });

  const subscription = await stripe.subscriptions.create({
    default_payment_method: setupIntent.payment_method as string,
    customer: customer.id,
    items: [
      {
        price_data: {
          currency: account.defaults?.currency ?? 'usd',
          product: membershipPrice.product as string,
          recurring: {
            interval: membershipPrice.recurring?.interval ?? 'month',
            interval_count: membershipPrice.recurring?.interval_count ?? 1,
          },
          unit_amount: membershipPrice.unit_amount ?? 0,
        },
        quantity: 1,
      },
    ],
    payment_settings: {
      payment_method_types: ['stripe_balance'],
    },
  });

  return plain(subscription);
};
