'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type CreateFinancialAccountParams = {
  name: string;
  accountId: string;
  stripeSecretKey?: string;
};

export const createFinancialAccount = async ({
  name,
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: CreateFinancialAccountParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create financial account because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  // Resolve the currency from the account's defaults or the platform env var
  const account = await stripe.v2.core.accounts.retrieve(accountId, {
    include: ['defaults'],
  });
  const envCurrency = process.env.CURRENCY?.toLowerCase() ?? 'gbp';
  const currency = account.defaults?.currency ?? envCurrency;

  // Ensure the account has business_storage capability for this currency before creating the FA.
  // This is a no-op if already active; it's needed when the account was created without storerCapabilityEnabled.
  try {
    await stripe.v2.core.accounts.update(accountId, {
      configuration: {
        money_manager: {
          capabilities: {
            received_credits: { bank_accounts: { requested: true } },
            business_storage: {
              inbound: { [currency]: { requested: true } },
              outbound: { [currency]: { requested: true } },
            },
            outbound_payments: {
              bank_accounts: { requested: true },
              financial_accounts: { requested: true },
            },
            outbound_transfers: {
              bank_accounts: { requested: true },
              financial_accounts: { requested: true },
            },
          },
        },
      },
    });
  } catch {
    // Best-effort: proceed even if the capability update fails (e.g. platform not enabled)
  }

  try {
    // v2 API: use stripeContext (Stripe-Context header), not stripeAccount (Stripe-Account header)
    // Financial address is provisioned separately once the FA reaches "open" status
    const financialAccount =
      await stripe.v2.moneyManagement.financialAccounts.create(
        {
          display_name: name,
          type: 'storage',
          storage: {
            holds_currencies: [currency],
          },
        },
        {
          stripeContext: accountId,
        },
      );

    return plain(financialAccount);
  } catch (error) {
    console.error(
      `Unable to create financial account "${name}" for account ${accountId}`,
      error,
    );

    return {
      message: 'modals.create-financial-account.error',
    };
  }
};
