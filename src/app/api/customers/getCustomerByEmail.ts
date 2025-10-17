'use server';

import { plain } from '@/utils/plain';
import Stripe from 'stripe';

type GetCustomerByEmailParams = {
  email: string;
  stripeSecretKey?: string;
};

export const getCustomerByEmail = async ({
  email,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: GetCustomerByEmailParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get customer because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const { data: customer } = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (customer.length === 0) {
    throw new Error(
      'Unable to get customer because no customer was found with the provided email.',
    );
  }

  return plain(customer[0]);
};
