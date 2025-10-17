'use server';

import { plain } from '@/utils/plain';
import Stripe from 'stripe';

type GetAccountByIdParams = {
  id: string;
  stripeSecretKey?: string;
};

export const getAccountById = async ({
  id,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: GetAccountByIdParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get account by id because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-07-30.preview',
  });

  let account: Stripe.Account | Stripe.V2.Core.Account;

  try {
    account = await stripe.v2.core.accounts.retrieve(id, {
      include: [
        'requirements',
        'configuration.merchant',
        'identity',
        'defaults',
      ],
    });
  } catch {
    try {
      account = await stripe.accounts.retrieve(id);
    } catch (error) {
      console.error('Uable to get account by id', error);

      return {
        message: 'sign-in.errors.account-not-found',
      };
    }
  }

  return plain(account);
};
