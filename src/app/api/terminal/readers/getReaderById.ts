'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { plain } from '@/utils/plain';
import Stripe from 'stripe';

export const getReaderById = async ({
  readerId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  chargeType,
  accountId,
}: {
  readerId: string;
  stripeSecretKey?: string;
  chargeType: DemoConfig['chargeType'];
  accountId: string;
}) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to retrieve terminal reader because a secret key was not provided nor found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  try {
    const reader = await stripe.terminal.readers.retrieve(
      readerId,
      {
        expand: ['action.collect_payment_method.payment_intent'],
      },
      chargeType === 'direct'
        ? {
            stripeAccount: accountId,
          }
        : undefined,
    );

    if (reader.deleted) {
      throw new Error('The requested reader has been deleted.');
    }

    return plain(reader);
  } catch (e) {
    if (e instanceof Stripe.errors.StripeError) {
      if (e.code === 'resource_missing') {
        throw new Error('The requested reader was not found.');
      }
    }

    throw new Error('An unknown error occurred while retrieving the reader.');
  }
};
