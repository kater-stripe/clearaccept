'use server';

import type { CountryCode } from '@/constants/countryCodes';
import { plain } from '@/utils/plain';
import Stripe from 'stripe';
import { Mock } from '@demoeng/utils/mock';
import { Language as MockLanguage } from '@demoeng/utils/languages';
import { CountryCode as MockCountryCode } from '@demoeng/utils/countries';
import { STRIPE_API_VERSION } from '@/constants/stripeApiVersion';

type CreateAccountParams = {
  countryCode: CountryCode;
  language?: string;
  email: string;
  treasuryCapabilityEnabled?: boolean;
  issuingCapabilityEnabled?: boolean;
  stripeSecretKey?: string;
  useV2Accounts?: boolean;
};

export const createAccount = async ({
  countryCode,
  language = 'en',
  email,
  treasuryCapabilityEnabled = false,
  issuingCapabilityEnabled = true,
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  useV2Accounts = false,
}: CreateAccountParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create account because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    // @ts-expect-error
    apiVersion: `${STRIPE_API_VERSION}${useV2Accounts ? '' : ';embedded_connect_beta=v2'}`,
  });

  const { data: customers } = await stripe.customers.list({
    email,
  });

  if (customers.length > 0) {
    return {
      message: 'sign-up.errors.email-already-in-use',
    };
  }

  let account: Stripe.Account | Stripe.V2.Core.Account;

  if (useV2Accounts) {
    account = await stripe.v2.core.accounts.create({
      contact_email: email,
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
      },
      identity: {
        country: countryCode
      },
      defaults: {
        responsibilities: {
          fees_collector: 'application',
          losses_collector: 'application',
        },
      },
      dashboard: 'none',
      metadata: {
        useV2Accounts: 'true',
      },
      include: [
        'requirements',
        'configuration.merchant',
        'identity',
        'defaults',
      ],
    });
  } else {
    account = await stripe.accounts.create({
      country: countryCode,
      email,
      controller: {
        losses: { payments: 'application' },
        fees: { payer: 'application' },
        requirement_collection: 'application',
        stripe_dashboard: {
          type: 'none' as const,
        },
      },
      capabilities: {
        card_payments: {
          requested: true,
        },
        transfers: {
          requested: true,
        },
      },
    });
  }

  const mock = new Mock({
    language: language as MockLanguage,
    country: countryCode as MockCountryCode,
    validForConnect: true,
  });

  const shouldPrefillBusinessProfile = email
    .split('@')?.[0]
    ?.includes('+prefill-biz');

  const shouldPrefillIndividual = email
    .split('@')?.[0]
    ?.includes('+prefill-ind');

  let mcc = '5999';

  // Attempt to parse a 3 digit MCC from the e-mail address.
  try {
    const last3 = parseInt(email.split('@')?.[0]?.slice(-3));

    if (!isNaN(last3)) {
      mcc = `0${last3}`;
    }
  } catch {
    // Our attempt to parse an MCC from the e-mail failed, but we can safely ignore this.
  }

  // Attempt to parse a 4 digit MCC from the e-mail address.
  try {
    const last4 = parseInt(email.split('@')?.[0]?.slice(-4));

    if (!isNaN(last4)) {
      mcc = `${last4}`;
    }
  } catch {
    // Our attempt to parse an MCC from the e-mail failed, but we can safely ignore this.
  }

  if (shouldPrefillBusinessProfile) {
    const companyNames = mock.companyNames();

    const individualNames = mock.individualNames();

    const addresses = mock.addresses();

    const person = {
      ...individualNames,
      ...addresses,
      phone: mock.phoneNumber(),
      dob: {
        day: 1,
        month: 1,
        year: 1901,
      },
      id_number: mock.taxId(),
      relationship: {
        owner: true,
        title: 'Owner',
      },
    };

    // The `individualNames` contains a `name` property, but it's not a valid property for the `person` object.
    // @ts-expect-error
    delete person.name;

    if (useV2Accounts) {
      await stripe.v2.core.accounts.persons.create(account.id, {
        given_name: person.first_name || person.first_name_kana,
        surname: person.last_name || person.last_name_kana,
        phone: person.phone,
        email: mock.email({
          individualNames,
        }),
        address: person.address
          ? {
              ...person.address,
              country:
                person.address.country.toLowerCase(),
            }
          : {
              ...person.address_kana,
              country:
                person.address_kana!.country.toLowerCase(),
            },
        date_of_birth: person.dob,
      });
    } else {
      await stripe.accounts.createPerson(account.id, person);
    }

    if (useV2Accounts) {
      const typedAccount = account as Stripe.V2.Core.Account;

      await stripe.v2.core.accounts.update(account.id, {
        configuration: {
          merchant: {
            mcc,
            support: {
              url: 'https://accessible.stripe.com',
              address: addresses.address
                ? {
                    ...addresses.address,
                    country:
                      addresses.address.country.toLowerCase(),
                  }
                : {
                    ...addresses.address_kana,
                    country:
                      addresses.address_kana!.country.toLowerCase(),
                  },
              email: mock.email({
                companyNames,
              }),
              phone: mock.phoneNumber(),
            },
          },
        },
        identity: {
          entity_type: 'company',
          business_details: {
            registered_name: companyNames.name,
            annual_revenue: {
              amount: {
                value: mock.integer({ min: 10_000, max: 1_000_000 }) * 100,
                currency: typedAccount.defaults?.currency ?? 'usd',
              },
              fiscal_year_end: `${new Date().getFullYear() - 1}-12-30`,
            },
            estimated_worker_count: mock.integer({ min: 2, max: 100 }),
            address: addresses.address
              ? {
                  ...addresses.address,
                  country:
                    addresses.address.country.toLowerCase(),
                }
              : {
                  ...addresses.address_kana,
                  country:
                    addresses.address_kana!.country.toLowerCase(),
                },
            phone: mock.phoneNumber(),
          },
        },
      });
    } else {
      const typedAccount = account as Stripe.Account;

      const businessProfile: Stripe.AccountCreateParams.BusinessProfile = {
        mcc,
        url: 'https://accessible.stripe.com',
        name: companyNames.name,
        annual_revenue: {
          amount: mock.integer({ min: 10_000, max: 1_000_000 }) * 100,
          currency: typedAccount.default_currency ?? 'usd',
          fiscal_year_end: `${new Date().getFullYear() - 1}-12-30`,
        },
        estimated_worker_count: mock.integer({ min: 2, max: 100 }),
        support_address: addresses.address ?? addresses.address_kana,
        support_email: mock.email({
          companyNames,
        }),
        support_phone: mock.phoneNumber(),
        support_url: 'https://accessible.stripe.com',
      };

      const bankAccount = mock.bankAccount();

      await stripe.accounts.update(account.id, {
        business_profile: businessProfile,
        business_type: 'company',
        company: {
          owners_provided: true,
          ...companyNames,
          tax_id: mock.taxId(),
          vat_id: mock.vatId() ?? undefined,
          ...addresses,
          phone: mock.phoneNumber(),
        },
        external_account: {
          object: 'bank_account',
          account_holder_name: companyNames.name,
          account_number: bankAccount.accountNumber,
          ...('routingNumber' in bankAccount
            ? {
                routing_number: bankAccount.routingNumber,
              }
            : {}),
          country: typedAccount.country ?? 'US',
          currency: typedAccount.default_currency ?? 'usd',
        },
      });
    }
  }

  if (shouldPrefillIndividual) {
    const individualNames = mock.individualNames();

    const addresses = mock.addresses();

    if (useV2Accounts) {
      await stripe.v2.core.accounts.persons.create(account.id, {
        given_name:
          individualNames.first_name || individualNames.first_name_kana,
        surname: individualNames.last_name || individualNames.last_name_kana,
        phone: mock.phoneNumber(),
        email: mock.email({
          individualNames,
        }),
        address: addresses.address
          ? {
              ...addresses.address,
              country:
                addresses.address.country.toLowerCase(),
            }
          : {
              ...addresses.address_kana,
              country:
                addresses.address_kana!.country.toLowerCase(),
            },
        date_of_birth: {
          day: 1,
          month: 1,
          year: 1901,
        },
      });

      await stripe.v2.core.accounts.update(account.id, {
        configuration: {
          merchant: {
            mcc,
            support: {
              url: 'https://accessible.stripe.com',
              address: addresses.address
                ? {
                    ...addresses.address,
                    country:
                      addresses.address.country.toLowerCase(),
                  }
                : {
                    ...addresses.address_kana,
                    country:
                      addresses.address_kana!.country.toLowerCase(),
                  },
              email: mock.email({
                individualNames,
              }),
              phone: mock.phoneNumber(),
            },
          },
        },
        identity: {
          entity_type: 'individual',
        },
      });
    } else {
      const typedAccount = account as Stripe.Account;

      const individual: Stripe.AccountCreateParams.Individual = {
        ...individualNames,
        phone: mock.phoneNumber(),
        ...addresses,
        dob: {
          day: 1,
          month: 1,
          year: 1901,
        },
        id_number: mock.taxId(),
      };

      // The `individualNames` contains a `name` property, but it's not a valid property for the `individual` object.
      // @ts-expect-error
      delete individual.name;

      const businessProfile: Stripe.AccountCreateParams.BusinessProfile = {
        mcc,
        url: 'https://accessible.stripe.com',
        name: individualNames.name,
        annual_revenue: {
          amount: mock.integer({ min: 10_000, max: 1_000_000 }) * 100,
          currency: typedAccount.default_currency ?? 'usd',
          fiscal_year_end: `${new Date().getFullYear() - 1}-12-30`,
        },
        estimated_worker_count: Math.floor(Math.random() * 98) + 2, // 2 to 100
        support_address: addresses.address,
        support_email: mock.email({
          individualNames,
        }),
        support_phone: mock.phoneNumber(),
        support_url: 'https://accessible.stripe.com',
      };

      const bankAccount = mock.bankAccount();

      await stripe.accounts.update(account.id, {
        individual,
        business_profile: businessProfile,
        business_type: 'individual',
        external_account: {
          object: 'bank_account',
          account_holder_name: individualNames.name,
          account_number: bankAccount.accountNumber,
          ...('routingNumber' in bankAccount
            ? {
                routing_number: bankAccount.routingNumber,
              }
            : {}),
          country: typedAccount.country ?? 'US',
          currency: typedAccount.default_currency ?? 'usd',
        },
      });
    }
  }

  const capabilities:
    | Stripe.AccountCreateParams.Capabilities
    | Stripe.V2.Core.Account.Configuration.Merchant.Capabilities = {
    crypto_payments: {
      requested: true,
    },
    ...(treasuryCapabilityEnabled
      ? {
          treasury: {
            requested: true,
          },
        }
      : {}),
    ...(issuingCapabilityEnabled
      ? {
          card_issuing: {
            requested: true,
          },
        }
      : {}),
  };

  for (const [capability, value] of Object.entries(capabilities)) {
    try {
      if (useV2Accounts) {
        await stripe.v2.core.accounts.update(account.id, {
          configuration: {
            merchant: {
              capabilities: {
                [capability]: value,
              },
            },
          },
        });
      } else {
        await stripe.accounts.update(account.id, {
          capabilities: { [capability]: value },
        });
      }
    } catch (error) {
      console.error(
        `Unable to request capability ${capability} for account ${account.id}`,
        error,
      );
    }
  }

  if (useV2Accounts) {
    /**
     * You can pass a v2 account id to legacy customers API to update the underlying customer.
     */
    await stripe.customers.update(account.id, {
      metadata: {
        accountId: account.id,
        useV2Accounts: 'true',
      },
    });
  } else {
    await stripe.customers.create({
      email,
      metadata: {
        accountId: account.id,
      },
    });
  }

  return plain(account);
};
