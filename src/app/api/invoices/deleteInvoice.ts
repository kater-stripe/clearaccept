'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type DeleteInvoiceParams = {
  invoiceId: string;
  accountId: string;
  stripeSecretKey?: string;
  chargeType: DemoConfig['chargeType'];
};

export const deleteInvoice = async ({
  invoiceId,
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  chargeType,
}: DeleteInvoiceParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to delete invoice because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const stripeAccountOption =
    chargeType === 'direct' ? { stripeAccount: accountId } : undefined;

  // First, void the invoice if it's open, or delete if draft
  const invoice = await stripe.invoices.retrieve(
    invoiceId,
    stripeAccountOption,
  );

  if (invoice.status === 'draft') {
    const deleted = await stripe.invoices.del(invoiceId, stripeAccountOption);
    return plain(deleted);
  } else if (invoice.status === 'open') {
    const voided = await stripe.invoices.voidInvoice(
      invoiceId,
      undefined,
      stripeAccountOption,
    );
    return plain(voided);
  }

  throw new Error('Can only delete draft invoices or void open invoices.');
};
