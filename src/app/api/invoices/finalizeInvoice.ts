'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type FinalizeInvoiceParams = {
  invoiceId: string;
  accountId: string;
  stripeSecretKey?: string;
  chargeType: DemoConfig['chargeType'];
};

export const finalizeInvoice = async ({
  invoiceId,
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  chargeType,
}: FinalizeInvoiceParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to finalize invoice because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const stripeAccountOption =
    chargeType === 'direct' ? { stripeAccount: accountId } : undefined;

  const invoice = await stripe.invoices.finalizeInvoice(
    invoiceId,
    undefined,
    stripeAccountOption,
  );

  return plain(invoice);
};
