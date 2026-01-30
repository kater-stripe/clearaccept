'use server';

import type { DemoConfig } from '@/types/demoConfig';
import { initializeStripe } from '@/utils/initializeStripe';
import { CountryCode } from '@demoeng/utils/countries';
import { Language } from '@demoeng/utils/languages';
import { Mock } from '@demoeng/utils/mock/index';

type SeedTransactionsParams = {
  accountId: string;
  language: Language;
  stripeSecretKey?: string;
  chargeType: DemoConfig['chargeType'];
};

export const seedTransactions = async ({
  accountId,
  language,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  chargeType,
}: SeedTransactionsParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to seed transactions because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = initializeStripe(stripeSecretKey);

  const account = await stripe.v2.core.accounts.retrieve(accountId);

  try {
    const mock = new Mock({
      country: (account.identity?.country?.toUpperCase() ??
        'US') as CountryCode,
      language,
      validForConnect: false,
    });

    const customers = [];

    for (let i = 0; i < 10; i++) {
      const individualNames = mock.individualNames();

      const { first_name, first_name_kana, last_name, last_name_kana } =
        individualNames;

      const customer = await stripe.customers.create(
        {
          name: `${first_name || last_name_kana} ${last_name || first_name_kana}`,
          email: mock.email({
            individualNames,
          }),
        },
        chargeType === 'direct'
          ? {
              stripeAccount: accountId,
            }
          : undefined,
      );

      customers.push(customer);
    }

    const testTokens = [
      { value: 'tok_bypassPending', weight: 30, description: 'Visa (success)' },
      {
        value: 'tok_visa_debit',
        weight: 10,
        description: 'Visa Debit (success)',
      },
      {
        value: 'tok_mastercard',
        weight: 20,
        description: 'Mastercard (success)',
      },
      {
        value: 'tok_amex',
        weight: 10,
        description: 'American Express (success)',
      },
      { value: 'tok_discover', weight: 5, description: 'Discover (success)' },
      {
        value: 'tok_visa_chargeDeclined',
        weight: 5,
        description: 'Generic decline',
      },
      {
        value: 'tok_visa_chargeDeclinedInsufficientFunds',
        weight: 5,
        description: 'Insufficient funds',
      },
      {
        value: 'tok_visa_chargeDeclinedLostCard',
        weight: 2,
        description: 'Lost card',
      },
      {
        value: 'tok_visa_chargeDeclinedStolenCard',
        weight: 2,
        description: 'Stolen card',
      },
      {
        value: 'tok_visa_chargeDeclinedExpiredCard',
        weight: 2,
        description: 'Expired card',
      },
      {
        value: 'tok_visa_chargeDeclinedFraudulent',
        weight: 2,
        description: 'Fraudulent',
      },
      {
        value: 'tok_createDispute',
        weight: 3,
        description: 'Will be disputed as fraudulent',
      },
      {
        value: 'tok_riskLevelElevated',
        weight: 2,
        description: 'Elevated risk',
      },
      {
        value: 'tok_visa_debit_chargeDeclinedInsufficientFunds',
        weight: 2,
        description: 'Insufficient debit funds',
      },
    ];

    for (let i = 0; i < 30; i++) {
      const amount = mock.integer({ min: 500, max: 10000 });
      const chosenToken = mock.chooseFromWeightedArray(testTokens);

      try {
        const paymentMethod = await stripe.paymentMethods.create(
          {
            type: 'card',
            card: { token: chosenToken?.value },
          },
          chargeType === 'direct'
            ? {
                stripeAccount: accountId,
              }
            : undefined,
        );

        const customerIndex = mock.integer({
          min: 0,
          max: customers.length - 1,
        });

        const randomLetters = mock.uppercaseLetters({ length: 2 });

        await stripe.paymentIntents.create(
          {
            amount,
            currency: account.defaults?.currency ?? 'usd',
            customer: customers[customerIndex].id,
            payment_method: paymentMethod.id,
            confirm: true,
            description: `${randomLetters}${mock.integer({ min: 1000, max: 9999 })}`,
            return_url: 'https://example.com/return',
            ...(chargeType === 'destination' ||
            chargeType === 'destination-on-behalf-of'
              ? {
                  transfer_data: {
                    destination: accountId,
                  },
                }
              : {}),
            ...(chargeType === 'destination-on-behalf-of'
              ? {
                  on_behalf_of: accountId,
                }
              : {}),
          },
          chargeType === 'direct'
            ? {
                stripeAccount: accountId,
              }
            : undefined,
        );
      } catch (error) {
        // Card declines throw errors. We can safely ignore.
      }
    }

    return null;
  } catch (error: unknown) {
    console.error(error);

    return {
      message:
        'An error occurred when calling the Stripe API to seed transactions',
    };
  }
};
