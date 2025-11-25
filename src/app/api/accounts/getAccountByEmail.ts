'use server';

import { plain } from '@/utils/plain';
import Stripe from 'stripe';

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

  const stripe = new Stripe(stripeSecretKey);

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

  const useV2Accounts = customer.metadata.useV2Accounts === 'true';

  let account: Stripe.Account | Stripe.V2.Core.Account;

  if (useV2Accounts) {
    account = await stripe.v2.core.accounts.retrieve(accountId, {
      include: [
        'requirements',
        'configuration.merchant',
        'identity',
        'defaults',
      ],
    });
  } else {
    account = await stripe.accounts.retrieve(accountId);
  }

  return plain(account);
};
