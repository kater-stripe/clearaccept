'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type CreateInboundTransferParams = {
  accountId: string;
  financialAccountId: string;
  paymentMethodId: string;
  amount: number;
  currency: string;
  description?: string;
  stripeSecretKey?: string;
};

/**
 * Creates a v2 InboundTransfer — pulls funds from an external bank account
 * (payment method) into a FinancialAccount. Uses stripeContext for v2.
 */
export const createInboundTransfer = async ({
  accountId,
  financialAccountId,
  paymentMethodId,
  amount,
  currency,
  description = 'Top up from bank account',
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: CreateInboundTransferParams) => {
  if (!stripeSecretKey) {
    throw new Error('No Stripe secret key available.');
  }

  const stripe = initializeStripe(stripeSecretKey);

  try {
    const transfer = await stripe.v2.moneyManagement.inboundTransfers.create(
      {
        amount: { value: amount, currency },
        from: { payment_method: paymentMethodId },
        to: { financial_account: financialAccountId, currency },
        description,
      },
      { stripeContext: accountId },
    );

    return plain(transfer);
  } catch (error) {
    console.error(`Unable to create inbound transfer into ${financialAccountId}`, error);
    return {
      message: 'Unable to create inbound transfer.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
