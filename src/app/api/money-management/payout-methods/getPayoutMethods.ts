'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type GetPayoutMethodsParams = {
  connectedAccountId: string;
  // Optional: If provided, fetches payout methods for a recipient
  // If not provided, fetches payout methods for the connected account itself
  recipientAccountId?: string;
  stripeSecretKey?: string;
};

/**
 * Lists payout methods for an account.
 * - If recipientAccountId is provided: Uses Stripe-Context with format {connectedAccountId}/{recipientAccountId}
 *   to fetch payout methods for a recipient (used for OutboundPayments to recipients)
 * - If recipientAccountId is not provided: Uses Stripe-Context with just {connectedAccountId}
 *   to fetch payout methods for the connected account itself (used for OutboundTransfers)
 * This follows the FA4P (Financial Accounts for Platforms) pattern.
 */
export const getPayoutMethods = async ({
  connectedAccountId,
  recipientAccountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: GetPayoutMethodsParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to get payout methods because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  // Stripe-Context format for FA4P:
  // - For recipients: connectedAccountId/recipientAccountId
  // - For connected account's own payout methods: connectedAccountId
  const stripeContextValue = recipientAccountId
    ? `${connectedAccountId}/${recipientAccountId}`
    : connectedAccountId;

  // List payout methods
  const { data: payoutMethods } =
    await stripe.v2.moneyManagement.payoutMethods.list(
      {},
      {
        stripeContext: stripeContextValue,
      },
    );

  return plain(payoutMethods);
};
