'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import { plain } from '@/utils/plain';

type UpdateBalanceSettingsParams = {
  financialAccountId: string;
  currency: string;
  transferAllFunds?: boolean;
  targetAmount?: number;
  enabled: boolean;
  accountId?: string;
  stripeSecretKey?: string;
};

/**
 * Updates balance settings to configure automatic transfers from v1 payments balance
 * to a v2 Financial Account. This enables "Revenue Splitting" where a portion of
 * payment proceeds are automatically transferred to the FA.
 *
 * Note: This API requires the `v1_balance_settings_automatic_payout_split` feature gate
 * to be enabled on the account.
 */
export const updateBalanceSettings = async ({
  financialAccountId,
  currency,
  transferAllFunds = true,
  targetAmount,
  enabled,
  accountId,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: UpdateBalanceSettingsParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to update balance settings because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);
  const currencyKey = currency.toLowerCase();

  // Build the params using URLSearchParams since automatic_transfer_rules_by_currency
  // uses a nested array structure not covered by the SDK's typed params
  const body = new URLSearchParams();

  if (enabled) {
    // Configure automatic transfer rules to send funds to the v2 FA
    body.append(
      `payments[payouts][automatic_transfer_rules_by_currency][${currencyKey}][0][payout_method]`,
      financialAccountId,
    );

    if (transferAllFunds) {
      body.append(
        `payments[payouts][automatic_transfer_rules_by_currency][${currencyKey}][0][type]`,
        'transfer_all',
      );
    } else if (targetAmount !== undefined) {
      body.append(
        `payments[payouts][automatic_transfer_rules_by_currency][${currencyKey}][0][type]`,
        'transfer_up_to_amount',
      );
      body.append(
        `payments[payouts][automatic_transfer_rules_by_currency][${currencyKey}][0][transfer_up_to_amount]`,
        targetAmount.toString(),
      );
    }
  } else {
    // Clear automatic transfer rules by setting empty string for this currency
    body.append(
      `payments[payouts][automatic_transfer_rules_by_currency][${currencyKey}]`,
      '',
    );
  }

  try {
    const result = await stripe.rawRequest('POST', '/v1/balance_settings', {
      ...Object.fromEntries(body.entries()),
    }, {
      ...(accountId ? { stripeAccount: accountId } : {}),
    });

    // log request id
    console.log(result.lastResponse.requestId);

    return {
      success: true,
      data: plain(result),
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'An error occurred while updating balance settings.';
    console.error('Unable to update balance settings:', error);
    return {
      success: false,
      message,
    };
  }
};
