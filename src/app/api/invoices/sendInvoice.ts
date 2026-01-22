'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type SendInvoiceParams = {
  invoiceId: string;
  accountId: string;
  stripeSecretKey?: string;
  chargeType: DemoConfig['chargeType'];
};

export const sendInvoice = async ({
  invoiceId,
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  chargeType,
}: SendInvoiceParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to send invoice because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const stripeAccountOption =
    chargeType === 'direct' ? { stripeAccount: accountId } : undefined;

  const invoice = await stripe.invoices.sendInvoice(
    invoiceId,
    undefined,
    stripeAccountOption,
  );

  return plain(invoice);
};
