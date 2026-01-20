'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { plain } from '@/utils/plain';
import Stripe from 'stripe';

type GetInvoicesParams = {
  accountId: string;
  stripeSecretKey?: string;
  chargeType: DemoConfig['chargeType'];
  limit?: number;
};

export const getInvoices = async ({
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  chargeType,
  limit = 100,
}: GetInvoicesParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get invoices because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const { data: invoices } = await stripe.invoices.list(
    {
      limit,
      expand: ['data.customer'],
    },
    chargeType === 'direct' ? { stripeAccount: accountId } : undefined,
  );

  /**
   * Filter invoices to only include ones associated with the current account
   * when not using direct charges.
   */
  const filteredInvoices = invoices.filter(
    (invoice) =>
      chargeType === 'direct' || invoice.metadata?.accountId === accountId,
  );

  return plain(filteredInvoices);
};
