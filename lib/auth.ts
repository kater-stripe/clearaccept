import type {AuthOptions} from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import Stripe from 'stripe';
import initializeStripe from '@/app/utils/stripe/initializeStripe';

// Utility function to get month-to-date earnings
function calculateMtdEarnings(charges: Stripe.Charge[]): number {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfMonthTimestamp = Math.floor(startOfMonth.getTime() / 1000);

  return charges
    .filter(
      (charge) =>
        charge.status === 'succeeded' && charge.created >= startOfMonthTimestamp
    )
    .reduce((acc, charge) => {
      const balanceTransaction =
        charge.balance_transaction as Stripe.BalanceTransaction;
      return acc + (balanceTransaction?.net || 0);
    }, 0);
}

export const authOptions: AuthOptions = {
  session: {strategy: 'jwt'},
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({user}) {
      console.log('Signing in user', user.email);
      return true;
    },
    async session({session, token}) {
      try {
        // Get the secret key from the token (stored during sign in)
        const stripeSecretKey = token.stripeSecretKey as string;

        const headers = new Headers({
          'demo-stripesecretkey': stripeSecretKey ?? '',
        });

        const stripe = initializeStripe(headers, 'v2');

        const [stripeAccount, accountBalance, accountCharges, customers] =
          await Promise.all([
            stripe.accounts.retrieve({stripeAccount: token.sub}),
            stripe.balance.retrieve({stripeAccount: token.sub}),
            stripe.charges.list(
              {limit: 50, expand: ['data.balance_transaction']},
              {stripeAccount: token.sub}
            ),
            stripe.customers.list({limit: 1}, {stripeAccount: token.sub}),
          ]);

        if (!stripeAccount) {
          throw new Error('Could not retrieve Stripe account for user');
        }

        // Calculate balances
        const availableBalance = accountBalance.available.reduce(
          (total, curr) => total + curr.amount,
          0
        );
        const pendingBalance = accountBalance.pending.reduce(
          (total, curr) => total + curr.amount,
          0
        );

        // Get recent successful charges
        const recentCharges = accountCharges.data
          .filter((charge) => charge.status === 'succeeded')
          .slice(0, 3);

        // Calculate month-to-date earnings
        const mtdEarnings = calculateMtdEarnings(accountCharges.data);

        // Update session user with all required fields
        session.user.email = session.user.email || stripeAccount.email || '';
        session.user.name =
          stripeAccount.business_profile?.name || 'Instructor';
        session.user.stripeSecretKey = stripeSecretKey;
        session.user.stripeAccount = stripeAccount;
        session.user.pendingBalance = pendingBalance;
        session.user.availableBalance = availableBalance;
        session.user.charges = recentCharges;
        session.user.mtdEarnings = mtdEarnings;
        session.user.customerCount = customers.data.length;
        session.user.accountType = token.accountType as 'v1' | 'v2';
        session.user.customerId = token.customerId as string;

        console.log(
          `Session created for user ${session.user.email} with account ${stripeAccount.id}`
        );

        return session;
      } catch (err) {
        console.error('Failed to create session for user:', err);
        throw err;
      }
    },

    async jwt({token, user}) {
      if (!user) {
        return token;
      }

      const typedUser = user as unknown as {
        stripeSecretKey?: string | undefined;
        accountType: 'v1' | 'v2';
        customerId?: string;
      };

      if (typedUser.stripeSecretKey) {
        token.stripeSecretKey = typedUser.stripeSecretKey;
      }

      if (typedUser.accountType) {
        token.accountType = typedUser.accountType;
      }

      if (typedUser.customerId) {
        token.customerId = typedUser.customerId;
      }

      return token;
    },
  },

  providers: [
    CredentialsProvider({
      id: 'login',
      name: 'Email & Password',
      credentials: {
        email: {label: 'Email', type: 'email'},
        password: {label: 'Password', type: 'password'},
        stripe_sk: {label: 'Stripe Secret Key', type: 'password'},
      },
      async authorize(credentials, _req) {
        try {
          const email = credentials?.email;
          const stripeSecretKey = credentials?.stripe_sk;

          if (!email || !stripeSecretKey) {
            console.log('Missing email or Stripe secret key');
            return null;
          }

          const headers = new Headers({
            'demo-stripesecretkey': stripeSecretKey ?? '',
          });

          const stripe = initializeStripe(headers);

          const {data: customers} = await stripe.customers.list({
            email,
          });

          if (customers.length === 0) {
            console.log('No customer-account mapping found for email:', email);
            return null;
          }

          let account: Stripe.V2.Core.Account | Stripe.Account | undefined;

          const [customer] = customers;

          const useV2Accounts = customer?.metadata?.useV2Accounts === 'true';

          if (useV2Accounts) {
            const stripe = initializeStripe(headers, 'v2');

            account = await stripe.v2.core.accounts.retrieve(
              customer.metadata.connectedAccountId
            );
          } else {
            const stripe = initializeStripe(headers, 'v1');

            account = await stripe.accounts.retrieve(
              customer.metadata.connectedAccountId
            );
          }

          if (!account) {
            console.log('No account found for email:', email);
            return null;
          }

          const name =
            ('display_name' in account
              ? account.display_name
              : account.company?.name) ?? email;

          const accountType = useV2Accounts ? 'v2' : 'v1';

          return {
            id: account.id,
            email,
            name,
            stripeSecretKey,
            accountType,
            customerId: customer.id,
          };
        } catch (err) {
          console.warn('Login authorization failed:', err);
          return null;
        }
      },
    }),

    CredentialsProvider({
      id: 'loginas',
      name: 'Login as Account',
      credentials: {
        accountId: {label: 'Account ID', type: 'text'},
        stripe_sk: {label: 'Stripe Secret Key', type: 'password'},
      },
      async authorize(credentials, _req) {
        try {
          const accountId = credentials?.accountId;
          const stripeSecretKey = credentials?.stripe_sk;

          if (!accountId || !stripeSecretKey) {
            console.log('Missing account ID or Stripe secret key');
            return null;
          }

          const headers = new Headers({
            'demo-stripesecretkey': stripeSecretKey ?? '',
          });

          let stripeAccount:
            | Stripe.V2.Core.Account
            | Stripe.Account
            | undefined;

          let accountType: 'v1' | 'v2' = 'v1';

          try {
            const stripe = initializeStripe(headers, 'v2');

            stripeAccount = await stripe.v2.core.accounts.retrieve(accountId);
            accountType = 'v2';
          } catch {
            const stripe = initializeStripe(headers, 'v1');

            stripeAccount = await stripe.accounts.retrieve(accountId);
            accountType = 'v1';
          }

          const email =
            ('contact_email' in stripeAccount
              ? stripeAccount.contact_email
              : stripeAccount.email) ?? '';

          const name =
            ('display_name' in stripeAccount
              ? stripeAccount.display_name
              : stripeAccount.company?.name) ?? 'User';

          const stripe = initializeStripe(headers);

          const {data: customers} = await stripe.customers.list({
            email,
          });

          const customer = customers.find(
            (customer) =>
              customer.metadata.connectedAccountId === stripeAccount.id
          );

          if (!customer) {
            console.log('No customer found for account:', stripeAccount.id);
            return null;
          }

          return {
            id: stripeAccount.id,
            email,
            name,
            stripeSecretKey,
            accountType,
          };
        } catch (err) {
          console.warn('Login-as authorization failed:', err);
          return null;
        }
      },
    }),

    CredentialsProvider({
      id: 'signup',
      name: 'Sign Up',
      credentials: {
        email: {label: 'Email', type: 'email'},
        password: {label: 'Password', type: 'password'},
        stripe_sk: {label: 'Stripe Secret Key', type: 'password'},
        use_v2_accounts: {label: 'Use v2 Accounts', type: 'boolean'},
      },
      async authorize(credentials, req) {
        try {
          const email = credentials?.email;
          const stripeSecretKey = credentials?.stripe_sk;
          const useV2Accounts = credentials?.use_v2_accounts === 'true';
          const country = req.body?.country;

          if (!email || !country) {
            console.log('Missing required signup fields');
            return null;
          }

          const headers = new Headers({
            'demo-stripesecretkey': stripeSecretKey ?? '',
          });

          const stripe = initializeStripe(headers, 'v2');

          const platformAccount = await stripe.accounts.retrieve();

          let account: Stripe.V2.Core.Account | Stripe.Account | undefined;
          let customer: Stripe.Customer | undefined;
          let accountType: 'v1' | 'v2' = 'v1';

          if (useV2Accounts) {
            account = await stripe.v2.core.accounts.create({
              display_name: email,
              contact_email: email,
              dashboard: 'none',
              identity: {
                country,
                entity_type: 'company',
              },
              defaults: {
                responsibilities: {
                  losses_collector: 'application',
                  fees_collector: 'application',
                },
                currency:
                  platformAccount.default_currency as Stripe.V2.Core.AccountCreateParams.Defaults.Currency,
              },
              configuration: {
                merchant: {
                  capabilities: {
                    card_payments: {
                      requested: true,
                    },
                  },
                },
                customer: {
                  capabilities: {
                    automatic_indirect_tax: {
                      requested: true,
                    },
                  },
                },
                recipient: {
                  capabilities: {
                    stripe_balance: {
                      stripe_transfers: {
                        requested: true,
                      },
                    },
                  },
                },
              },
            });

            /**
             * We can query for and update the backing customer via the Account V2 id.
             * This is a workaround for the fact that v2 Accounts are not yet queryable.
             * Once the /v2/accounts/search endpoint is available, we will search directly for v2 Accounts when logging in.
             */
            customer = await stripe.customers.update(account.id, {
              metadata: {
                connectedAccountId: account.id,
                useV2Accounts: 'true',
              },
            });

            accountType = 'v2';
          } else {
            account = await stripe.accounts.create({
              controller: {
                losses: {payments: 'application'},
                fees: {payer: 'application'},
                requirement_collection: 'application',
                stripe_dashboard: {
                  type: 'none' as const,
                },
              },
              capabilities: {
                card_payments: {requested: true},
                transfers: {requested: true},
              },
              country,
              email,
            });

            customer = await stripe.customers.create({
              email,
              metadata: {
                connectedAccountId: account.id,
                useV2Accounts: 'false',
              },
            });

            accountType = 'v1';

            try {
              await stripe.accounts.update(account.id, {
                capabilities: {
                  card_issuing: {requested: true},
                },
              });
            } catch {
              console.error(
                `Failed to request card issuing capabilities for ${account.id}. This may be an unsupported country.`
              );
            }

            try {
              await stripe.accounts.update(account.id, {
                capabilities: {
                  treasury: {requested: true},
                },
              });

              try {
                await stripe.treasury.financialAccounts.create(
                  {
                    supported_currencies: [
                      platformAccount.default_currency ?? 'usd',
                    ],
                  },
                  {stripeAccount: account.id}
                );
              } catch {
                console.error(
                  `Failed to create financial account for ${account.id}. This may be an unsupported country.`
                );
              }
            } catch {
              console.error(
                `Failed to request treasury capabilities for ${account.id}. This may be an unsupported country.`
              );
            }
          }

          if (!account) {
            throw new Error('Failed to create account.');
          }

          console.log('Account created successfully:', account.id);

          return {
            id: account.id,
            email,
            name: email, // Use email as display name initially
            stripeSecretKey,
            accountType,
            customerId: customer.id,
          };
        } catch (error) {
          console.error('Signup authorization failed:', error);
          throw error;
        }
      },
    }),
  ],
};
