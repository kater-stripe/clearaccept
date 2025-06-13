import {getServerSession} from 'next-auth/next';
import {authOptions} from '@/lib/auth';
import initializeStripe from '@/app/utils/stripe/initializeStripe';
import {NextRequest} from 'next/server';
import {faker} from '@faker-js/faker';

export async function POST(request: NextRequest) {
  const stripe = initializeStripe(request.headers);

  try {
    const session = await getServerSession(authOptions);

    const {seedCredits, seedDebits} = await request.json();

    if (!seedCredits && !seedDebits) {
      return new Response('No seeding options selected', {status: 400});
    }

    const connectedAccount = session?.user?.stripeAccount;

    if (!connectedAccount) {
      return new Response('No connected account found on the user', {
        status: 400,
      });
    }

    const {data: financialAccounts} =
      await stripe.treasury.financialAccounts.list(
        {limit: 100},
        {stripeAccount: connectedAccount.id}
      );

    for (const financialAccount of financialAccounts) {
      // Activate financial addresses (necessary for received credits)
      await stripe.treasury.financialAccounts.updateFeatures(
        financialAccount.id,
        {financial_addresses: {aba: {requested: true}}},
        {stripeAccount: connectedAccount.id}
      );

      let hasActiveFinancialAddresses = false;

      do {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const newFinancialAccount =
          await stripe.treasury.financialAccounts.retrieve(
            financialAccount.id,
            {stripeAccount: connectedAccount.id}
          );

        hasActiveFinancialAddresses =
          newFinancialAccount.financial_addresses.length > 0;
      } while (!hasActiveFinancialAddresses);

      // Create received credits into the financial account
      for (let i = 0; i < 30; i++) {
        if (seedCredits) {
          await stripe.testHelpers.treasury.receivedCredits.create(
            {
              financial_account: financialAccount.id,
              currency: connectedAccount.default_currency ?? 'usd',
              network: faker.helpers.arrayElement(['us_domestic_wire', 'ach']),
              amount: faker.number.int({min: 10000, max: 150000}),
              initiating_payment_method_details: {
                type: 'us_bank_account',
                us_bank_account: {
                  account_holder_name:
                    `${faker.person.firstName()} ${faker.person.lastName()}`.slice(
                      0,
                      24
                    ),
                },
              },
            },
            {stripeAccount: connectedAccount.id}
          );
        }

        if (seedDebits) {
          // 20% of chance to debit the account
          if (faker.number.int({min: 0, max: 10}) <= 2) {
            await stripe.testHelpers.treasury.receivedDebits.create(
              {
                financial_account: financialAccount.id,
                currency: connectedAccount.default_currency ?? 'usd',
                network: 'ach',
                amount: faker.number.int({min: 10000, max: 150000}),
                initiating_payment_method_details: {
                  type: 'us_bank_account',
                  us_bank_account: {
                    account_holder_name: faker.company.name().slice(0, 24),
                  },
                },
              },
              {stripeAccount: connectedAccount.id}
            );
          }
        }
      }
    }

    return new Response('Financial Account data seeded successfully', {
      status: 200,
    });
  } catch (error: any) {
    console.error(
      'An error occurred when calling the Stripe API to create an account session',
      error
    );
    return new Response(error.message, {status: 500});
  }
}
