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
  const resolvedCurrency =
    currency ??
    (await stripe.v2.core.accounts.retrieve(accountId, { include: ['defaults'] })).defaults
      ?.currency ??
    process.env.CURRENCY?.toLowerCase() ??
    'gbp';

  // Request capabilities for the specific currency only.
  // Requesting unsupported currencies (e.g. EUR/USD on GBP-only platform) marks them
  // "restricted" and blocks ALL FA operations including GBP.
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
    // Best-effort: proceed even if capability update fails (e.g. platform not enabled)
  }

  // Poll capability status up to 30 s before attempting creation.
  // Capabilities are activated asynchronously; "restricted" here is transient (pending approval)
  // not a permanent block.
  const pollLimit = 30;
  for (let i = 0; i < pollLimit; i++) {
    try {
      const acct = await stripe.v2.core.accounts.retrieve(accountId, {
        include: ['configuration.money_manager'],
      });
      const caps = (acct as any).configuration?.money_manager?.capabilities;
      const inbound = caps?.business_storage?.inbound?.[resolvedCurrency]?.status;
      const outbound = caps?.business_storage?.outbound?.[resolvedCurrency]?.status;

      if (inbound === 'active' && outbound === 'active') break;

      // If still pending/restricted, wait and try again
      if (i < pollLimit - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch {
      // Non-fatal: proceed and let the create attempt surface any real error
      break;
    }
  }

  try {
    const financialAccount = await stripe.v2.moneyManagement.financialAccounts.create(
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
