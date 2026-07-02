'use server';

import { initializeStripe } from '@/utils/initializeStripe';
import type { CountryCode, Language } from '@/utils/mock';
import { Mock } from '@/utils/mock';

type SeedFinancialAccountTransactionsParams = {
  seedCredits: boolean;
  seedDebits: boolean;
  accountId: string;
  language: Language;
  stripeSecretKey?: string;
};

export const seedFinancialAccountTransactions = async ({
  seedCredits,
  seedDebits,
  accountId,
  language,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
}: SeedFinancialAccountTransactionsParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to seed financial account transactions because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const account = await stripe.v2.core.accounts.retrieve(accountId);

  try {
    if (!seedCredits && !seedDebits) {
      return {
        message: 'No seeding options selected',
      };
    }

    const { data: financialAccounts } =
      await stripe.treasury.financialAccounts.list(
        { limit: 100 },
        { stripeAccount: accountId },
      );

    for (const financialAccount of financialAccounts) {
      // Activate financial addresses (necessary for received credits)
      await stripe.treasury.financialAccounts.updateFeatures(
        financialAccount.id,
        { financial_addresses: { aba: { requested: true } } },
        { stripeAccount: accountId },
      );

      let hasActiveFinancialAddresses = false;

      do {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const newFinancialAccount =
          await stripe.treasury.financialAccounts.retrieve(
            financialAccount.id,
            {},
            { stripeAccount: accountId },
          );

        hasActiveFinancialAddresses =
          newFinancialAccount.financial_addresses.length > 0;
      } while (!hasActiveFinancialAddresses);

      const mock = new Mock({
        country: (account.identity?.country?.toUpperCase() ??
          'US') as CountryCode,
        language: language,
        validForConnect: false,
      });

      // Create received credits into the financial account
      for (let i = 0; i < 10; i++) {
        const { name } = mock.individualNames();

        if (seedCredits) {
          await stripe.testHelpers.treasury.receivedCredits.create(
            {
              financial_account: financialAccount.id,
              currency: account.defaults?.currency ?? 'usd',
              network:
                mock.integer({ min: 0, max: 1 }) === 0
                  ? 'us_domestic_wire'
                  : 'ach',
              amount: mock.integer({ min: 10000, max: 150000 }),
              initiating_payment_method_details: {
                type: 'us_bank_account',
                us_bank_account: {
                  account_holder_name: `${name}`.slice(0, 24),
                },
              },
            },
            { stripeAccount: accountId },
          );
        }

        if (seedDebits) {
          // 20% of chance to debit the account
          if (mock.integer({ min: 0, max: 10 }) <= 2) {
            await stripe.testHelpers.treasury.receivedDebits.create(
              {
                financial_account: financialAccount.id,
                currency: account.defaults?.currency ?? 'usd',
                network: 'ach',
                amount: mock.integer({ min: 10000, max: 150000 }),
                initiating_payment_method_details: {
                  type: 'us_bank_account',
                  us_bank_account: {
                    account_holder_name: mock.companyNames().name.slice(0, 24),
                  },
                },
              },
              { stripeAccount: accountId },
            );
          }
        }
      }
    }

    return null;
  } catch (error: unknown) {
    console.error(error);

    return {
      error:
        'An error occurred when calling the Stripe API to seed financial account transactions',
    };
  }
};
