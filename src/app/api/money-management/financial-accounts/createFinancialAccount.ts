'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

const req = { requested: true as const };

type CreateFinancialAccountParams = {
  name: string;
  accountId: string;
  currency?: string;
  stripeSecretKey?: string;
};

export const createFinancialAccount = async ({
  name,
  accountId,
  currency,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: CreateFinancialAccountParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create financial account because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  // Resolve currency: explicit > account default > env var > gbp
  const resolvedCurrency = currency ?? (await stripe.v2.core.accounts.retrieve(accountId, { include: ['defaults'] })).defaults?.currency ?? process.env.CURRENCY?.toLowerCase() ?? 'gbp';

  // Request only the capability for the specific currency being created.
  // Requesting unsupported currencies (e.g. EUR/USD on a GBP-only platform) marks them
  // "restricted" which then blocks ALL FA operations including GBP ones.
  try {
    await stripe.v2.core.accounts.update(accountId, {
      configuration: {
        money_manager: {
          capabilities: {
            received_credits: { bank_accounts: req },
            business_storage: {
              inbound: { [resolvedCurrency]: req },
              outbound: { [resolvedCurrency]: req },
            },
            outbound_payments: { bank_accounts: req, financial_accounts: req },
            outbound_transfers: { bank_accounts: req, financial_accounts: req },
          },
        },
      },
    });
  } catch {
    // Best-effort: proceed even if the capability update fails (e.g. platform not enabled)
  }

  try {
    const financialAccount =
      await stripe.v2.moneyManagement.financialAccounts.create(
        {
          display_name: name,
          type: 'storage',
          storage: { holds_currencies: [resolvedCurrency] },
        },
        { stripeContext: accountId },
      );

    return plain(financialAccount);
  } catch (error) {
    console.error(
      `Unable to create financial account "${name}" for account ${accountId}`,
      error,
    );

    return { message: 'modals.create-financial-account.error' };
  }
};
