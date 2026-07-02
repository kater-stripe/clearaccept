/** Build a full Stripe mock. Each callable is a jest.fn() so tests can override. */
export function buildMockStripe() {
  return {
    customers: {
      list: jest.fn().mockResolvedValue({ data: [] }),
      create: jest.fn().mockResolvedValue({ id: 'cus_test' }),
      update: jest.fn().mockResolvedValue({ id: 'cus_test' }),
    },
    accounts: {
      update: jest.fn().mockResolvedValue({}),
    },
    paymentMethods: {
      create: jest.fn().mockResolvedValue({ id: 'pm_test' }),
    },
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ id: 'pi_test' }),
    },
    capital: {
      financingOffers: {
        list: jest.fn().mockResolvedValue({ data: [] }),
      },
    },
    rawRequest: jest.fn().mockResolvedValue({}),
    v2: {
      core: {
        accounts: {
          create: jest.fn().mockResolvedValue({
            id: 'acct_test',
            identity: { country: 'GB' },
            defaults: { currency: 'gbp' },
            requirements: null,
          }),
          update: jest.fn().mockResolvedValue({}),
          retrieve: jest.fn().mockResolvedValue({
            id: 'acct_test',
            identity: { country: 'GB' },
            defaults: { currency: 'gbp' },
            requirements: null,
          }),
          persons: {
            create: jest.fn().mockResolvedValue({ id: 'person_test' }),
          },
        },
      },
      moneyManagement: {
        financialAccounts: {
          create: jest.fn().mockResolvedValue({
            id: 'fa_test',
            display_name: 'ClearAccept Wallet',
            type: 'storage',
            status: 'open',
            storage: { holds_currencies: ['gbp'] },
            created: new Date().toISOString(),
          }),
          list: jest.fn().mockResolvedValue({ data: [] }),
        },
        financialAddresses: {
          create: jest.fn().mockResolvedValue({
            id: 'fad_test',
            type: 'gb_bank_account',
            gb_bank_account: { sort_code: '12-34-56', account_number: '12345678' },
          }),
          list: jest.fn().mockResolvedValue({ data: [] }),
        },
        outboundPayments: {
          create: jest.fn().mockResolvedValue({ id: 'obp_test', status: 'processing' }),
        },
        outboundPaymentQuotes: {
          create: jest.fn().mockResolvedValue({ id: 'obpq_test' }),
        },
        outboundTransfers: {
          create: jest.fn().mockResolvedValue({ id: 'obt_test', status: 'processing' }),
        },
      },
    },
  };
}

export type MockStripe = ReturnType<typeof buildMockStripe>;
