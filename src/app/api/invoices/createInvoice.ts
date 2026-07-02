'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type LineItem = {
  description: string;
  quantity: number;
  unitAmount: number;
};

type CreateInvoiceParams = {
  customerId: string;
  currency: string;
  daysUntilDue: number;
  lineItems: LineItem[];
  accountId: string;
  stripeSecretKey?: string;
  chargeType: DemoConfig['chargeType'];
};

export const createInvoice = async ({
  customerId,
  currency,
  daysUntilDue,
  lineItems,
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  chargeType,
}: CreateInvoiceParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create invoice because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const stripeAccountOption =
    chargeType === 'direct' ? { stripeAccount: accountId } : undefined;

  // Create the invoice
  const invoice = await stripe.invoices.create(
    {
      customer: customerId,
      currency,
      days_until_due: daysUntilDue,
      collection_method: 'send_invoice',
      metadata: {
        accountId,
      },
    },
    stripeAccountOption,
  );

  // Add line items to the invoice
  for (const item of lineItems) {
    await stripe.invoiceItems.create(
      {
        customer: customerId,
        invoice: invoice.id,
        description: item.description,
        amount: item.unitAmount,
        quantity: item.quantity,
        currency,
      },
      stripeAccountOption,
    );
  }

  return plain(invoice);
};
