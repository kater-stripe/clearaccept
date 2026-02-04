'use server';

import { STRIPE_API_VERSION } from '@/constants/stripeApiVersion';
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

  const body = new URLSearchParams();
  const currencyKey = currency.toLowerCase();

  if (enabled) {
    // Configure automatic transfer rules to send funds to the v2 FA
    // Structure: payments[payouts][automatic_transfer_rules_by_currency][<currency>][0][payout_method|type|transfer_up_to_amount]
    body.append(
      `payments[payouts][automatic_transfer_rules_by_currency][${currencyKey}][0][payout_method]`,
      financialAccountId,
    );

    if (transferAllFunds) {
      // Transfer all available funds to the FA
      body.append(
        `payments[payouts][automatic_transfer_rules_by_currency][${currencyKey}][0][type]`,
        'transfer_all',
      );
    } else if (targetAmount !== undefined) {
      // Transfer until target amount is reached in the FA
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

  const res = await fetch('https://api.stripe.com/v1/balance_settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': STRIPE_API_VERSION,
      ...(accountId ? { 'Stripe-Account': accountId } : {}),
      Authorization: `Bearer ${stripeSecretKey}`,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    try {
      const error = await res.json();
      console.error('Unable to update balance settings:', error);
      return {
        success: false,
        message:
          error?.error?.message ||
          'An error occurred while updating balance settings.',
      };
    } catch {
      return {
        success: false,
        message: 'An error occurred while updating balance settings.',
      };
    }
  }

  const balanceSettings = await res.json();

  return {
    success: true,
    data: plain(balanceSettings),
  };
};

