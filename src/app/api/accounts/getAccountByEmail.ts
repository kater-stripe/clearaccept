'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';
import type Stripe from 'stripe';

type GetAccountByEmailParams = {
  email: string;
  stripeSecretKey?: string;
};

export const getAccountByEmail = async ({
  email,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: GetAccountByEmailParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get account by email because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const { data: customers } = await stripe.customers.list({
    email,
  });

  if (customers.length === 0) {
    return {
      message: 'sign-in.errors.email-not-found',
    };
  }

  const [customer] = customers;

  const accountId = customer.metadata.accountId;

  if (!accountId) {
    return {
      message: 'sign-in.errors.account-not-linked',
    };
  }

  const account = await stripe.v2.core.accounts.retrieve(accountId, {
    include: [
      'requirements',
      'configuration.merchant',
      'configuration.money_manager',
      'configuration.recipient',
      'identity',
      'defaults',
    ],
  });

  return plain(account);
};
