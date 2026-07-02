'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type CreateOutboundTransferParams = {
  accountId: string;
  fromFinancialAccountId: string;
  toPayoutMethodId: string;
  amount: number;
  currency: string;
  description?: string;
  stripeSecretKey?: string;
};

export const createOutboundTransfer = async ({
  accountId,
  fromFinancialAccountId,
  toPayoutMethodId,
  amount,
  currency,
  description,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: CreateOutboundTransferParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create outbound transfer because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  // Request outbound transfer capabilities if not already active.
  // Existing accounts may predate these being included in the default money_manager config.
  try {
    await stripe.v2.core.accounts.update(accountId, {
      configuration: {
        money_manager: {
          capabilities: {
            outbound_transfers: {
              bank_accounts: { requested: true },
              financial_accounts: { requested: true },
            },
          },
        },
      },
    });
  } catch {
    // Silently skip — the transfer call will surface the real error if capability is missing.
  }

  try {
    const outboundTransfer =
      await stripe.v2.moneyManagement.outboundTransfers.create(
        {
          from: {
            financial_account: fromFinancialAccountId,
            currency,
          },
          to: {
            payout_method: toPayoutMethodId,
            currency,
          },
          amount: {
            value: amount,
            currency,
          },
          description: description || 'Transfer to own account',
        },
        {
          stripeContext: accountId,
        },
      );

    return plain(outboundTransfer);
  } catch (error) {
    console.error(
      `Unable to create outbound transfer from ${fromFinancialAccountId}`,
      error,
    );

    return {
      message: 'modals.outbound-transfer.error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
