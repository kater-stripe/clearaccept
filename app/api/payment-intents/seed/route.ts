import {getServerSession} from 'next-auth/next';
import {authOptions} from '@/lib/auth';
import initializeStripe from '@/app/utils/stripe/initializeStripe';
import {NextRequest} from 'next/server';
import * as fakerLocales from '@faker-js/faker';

export async function POST(request: NextRequest) {
  const stripe = initializeStripe(request.headers);

  try {
    const session = await getServerSession(authOptions);

    const connectedAccount = session?.user?.stripeAccount;

    if (!connectedAccount) {
      return new Response('No connected account found on the user', {
        status: 400,
      });
    }

    const faker =
      (fakerLocales[
        `fakerEN_${connectedAccount.country}` as keyof typeof fakerLocales
      ] as fakerLocales.Faker) ?? fakerLocales.faker;

    const customers = [];

    for (let i = 0; i < 10; i++) {
      const [firstName, lastName] = [
        faker.person.firstName(),
        faker.person.lastName(),
      ];
      const customer = await stripe.customers.create(
        {
          name: `${firstName} ${lastName}`,
          email: faker.internet.email({
            firstName,
            lastName,
            provider: 'example.com',
          }),
        },
        {
          stripeAccount: connectedAccount.id,
        }
      );

      customers.push(customer);
    }

    const testTokens = [
      {value: 'tok_bypassPending', weight: 30, description: 'Visa (success)'},
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
      {value: 'tok_discover', weight: 5, description: 'Discover (success)'},
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
      {value: 'tok_riskLevelElevated', weight: 2, description: 'Elevated risk'},
      {
        value: 'tok_visa_debit_chargeDeclinedInsufficientFunds',
        weight: 2,
        description: 'Insufficient debit funds',
      },
    ];

    for (let i = 0; i < 30; i++) {
      const amount = faker.number.int({min: 500, max: 10000});
      const chosenToken = faker.helpers.weightedArrayElement(testTokens);

      try {
        const paymentMethod = await stripe.paymentMethods.create(
          {
            type: 'card',
            card: {token: chosenToken},
          },
          {
            stripeAccount: connectedAccount.id,
          }
        );

        await stripe.paymentIntents.create(
          {
            amount,
            currency: 'usd',
            customer: faker.helpers.arrayElement(customers).id,
            payment_method: paymentMethod.id,
            confirm: true,
            description: `${faker.string.alpha({
              casing: 'upper',
              length: 2,
            })}${faker.number.int({min: 1000, max: 9999})}`,
            return_url: 'https://example.com/return',
          },
          {
            stripeAccount: connectedAccount.id,
          }
        );
      } catch (error) {
        // Card declines throw errors. We can safely ignore.
      }
    }

    return new Response('Transaction data seeded successfully', {status: 200});
  } catch (error: any) {
    console.error(
      'An error occurred when calling the Stripe API to create an account session',
      error
    );
    return new Response(error.message, {status: 500});
  }
}
