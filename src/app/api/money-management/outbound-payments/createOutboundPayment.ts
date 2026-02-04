'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type CreateOutboundPaymentParams = {
  accountId: string;
  fromFinancialAccountId: string;
  recipientAccountId: string;
  payoutMethodId: string;
  amount: number;
  currency: string;
  description?: string;
  stripeSecretKey?: string;
};

export const createOutboundPayment = async ({
  accountId,
  fromFinancialAccountId,
  recipientAccountId,
  payoutMethodId,
  amount,
  currency,
  description,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: CreateOutboundPaymentParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create outbound payment because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  try {
    const outboundPayment =
      await stripe.v2.moneyManagement.outboundPayments.create(
        {
          from: {
            financial_account: fromFinancialAccountId,
            currency,
          },
          to: {
            recipient: recipientAccountId,
            payout_method: payoutMethodId,
            currency,
          },
          amount: {
            value: amount,
            currency,
          },
          description: description || 'Payment to third-party',
        },
        {
          stripeAccount: accountId,
        },
      );

    return plain(outboundPayment);
  } catch (error) {
    console.error(
      `Unable to create outbound payment from ${fromFinancialAccountId} to recipient ${recipientAccountId} via payout method ${payoutMethodId}`,
      error,
    );

    return {
      message: 'modals.outbound-payment.error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
