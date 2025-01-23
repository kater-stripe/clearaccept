import type {AuthOptions} from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import {stripe} from '@/lib/stripe';
import {countryToCurrency} from '@/lib/currency';

export const authOptions: AuthOptions = {
  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({user}) {
      // Ensure the user exists on Stripe
      console.log('Signing in user', user);

      return true;
    },

    async session({session}) {
      let stripeAccount;

      try {
        const accountList = await stripe.accounts.list();
        stripeAccount = accountList.data.find(
          (account) => account.email === session.user?.email
        );
      } catch (err) {
        console.error('Could not retrieve stripe account for user', err);
        throw err;
      }

      if (!stripeAccount) {
        throw 'Could not retrieve Stripe account for user';
      }

      session.user.stripeAccount = stripeAccount;
      console.log(
        `Got session for user ${session.user?.email} and stripe account ${stripeAccount.id}`
      );

      return session;
    },
  },
  providers: [
    CredentialsProvider({
      id: 'login',
      name: 'Email & Password',
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials, req) {
        try {
          const email = credentials?.email;

          if (!email) {
            console.log('Could not find an email for provider');
            return null;
          }

          const accountList = await stripe.accounts.list();
          const account = accountList.data.find(
            (account) => account.email === email
          );
          if (!account) {
            return null;
          }

          return {
            id: account.id,
            email: account.email,
          };
        } catch (err) {
          console.warn('Got an error authorizing a user during login', err);
          return null;
        }
      },
    }),
    CredentialsProvider({
      id: 'loginas',
      name: 'Account ID',
      credentials: {
        accountId: {},
      },
      async authorize(credentials, req) {
        try {
          const stripeAccountId = credentials?.accountId;

          if (!stripeAccountId) {
            console.log('Could not find an account id for provider');
            return null;
          }

          // See if they exist on the platform
          const stripeAccount = await stripe.accounts.retrieve(stripeAccountId);

          return {
            id: stripeAccount.id,
            email: stripeAccount.email,
          };
        } catch (err) {
          console.warn('Got an error authorizing a user during login', err);
          return null;
        }
      },
    }),
    CredentialsProvider({
      id: 'signup',
      name: 'Email & Password',
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials, req) {
        console.log('Signing up');

        const email = credentials?.email;
        const country = req.body?.country;

        if (!email || !country) {
          console.log('Could not find an email for authorization');
          return null;
        }

        try {
          const firstName = 'Steve';
          const lastName = 'Kaliski';

          const bank_account: any = {
            country,
            currency: countryToCurrency(country),
            account_holder_name: `${firstName} ${lastName}`,
          };
          switch (country) {
            case 'US':
              bank_account.routing_number = '110000000';
              bank_account.account_number = '000123456789';
              break;
            case 'GB':
              bank_account.account_number = 'GB82WEST12345698765432';
              break;
            case 'DE':
              bank_account.account_number = 'DE89370400440532013000';
              break;
            case 'FR':
              bank_account.account_number = 'FR1420041010050500013M02606';
              break;
            case 'AU':
              bank_account.routing_number = '000-000';
              bank_account.account_number = '000123456';
              break;
            default:
              throw new Error('Unsupported country');
          }

          // Register the Stripe account
          const bankAccount = await stripe.tokens.create({
            bank_account,
          });

          const controller = {
            losses: {payments: 'application'},
            fees: {payer: 'application'},
            requirement_collection: 'application',
            stripe_dashboard: {
              type: 'none' as const, // The connected account will not have access to dashboard
            },
          };

          console.log('Creating stripe account for the email', email);

          const capabilities: any = {
            card_payments: {
              requested: true,
            },
            transfers: {
              requested: true,
            },
          };
          switch (country) {
            case 'GB':
              capabilities['card_issuing'] = {requested: true};
              break;
            case 'US':
              capabilities['card_issuing'] = {requested: true};
              capabilities['treasury'] = {requested: true};
              break;
            default:
              break;
          }

          const account = await stripe.accounts.create({
            // @ts-ignore
            controller,
            capabilities,
            country,
            email,
          });

          console.log('Account has been created with id', account.id);

          return {
            id: account.id,
            email,
          };
        } catch (error: any) {
          console.log(
            'Got an error authorizing and creating a user during signup',
            error
          );
          return null;
        }
      },
    }),
  ],
};
