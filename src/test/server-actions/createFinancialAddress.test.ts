import { buildMockStripe } from '../mockStripe';

const mockStripe = buildMockStripe();

jest.mock('@/utils/initializeStripe', () => ({
  initializeStripe: jest.fn(() => mockStripe),
}));

import { createFinancialAddress } from '@/app/api/money-management/financial-addresses/createFinancialAddress';

const BASE_PARAMS = {
  accountId: 'acct_test',
  financialAccountId: 'fa_test',
  stripeSecretKey: 'sk_test_123',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockStripe.v2.moneyManagement.financialAddresses.create.mockResolvedValue({
    id: 'fad_test',
    type: 'gb_bank_account',
    gb_bank_account: { sort_code: '12-34-56', account_number: '12345678' },
  });
});

describe('createFinancialAddress', () => {
  it('throws when no secret key is provided', async () => {
    await expect(
      createFinancialAddress({ ...BASE_PARAMS, stripeSecretKey: undefined }),
    ).rejects.toThrow('Unable to create financial address');
  });

  it('creates a GBP address using gb_bank_account type', async () => {
    await createFinancialAddress({ ...BASE_PARAMS, currency: 'gbp' });
    expect(mockStripe.v2.moneyManagement.financialAddresses.create).toHaveBeenCalledWith(
      { financial_account: 'fa_test', type: 'gb_bank_account' },
      { stripeContext: 'acct_test' },
    );
  });

  it('creates an EUR address using sepa_bank_account type', async () => {
    mockStripe.v2.moneyManagement.financialAddresses.create.mockResolvedValueOnce({
      id: 'fad_eur',
      type: 'sepa_bank_account',
    });
    await createFinancialAddress({ ...BASE_PARAMS, currency: 'eur' });
    expect(mockStripe.v2.moneyManagement.financialAddresses.create).toHaveBeenCalledWith(
      { financial_account: 'fa_test', type: 'sepa_bank_account' },
      { stripeContext: 'acct_test' },
    );
  });

  it('creates a USD address using us_bank_account type', async () => {
    mockStripe.v2.moneyManagement.financialAddresses.create.mockResolvedValueOnce({
      id: 'fad_usd',
      type: 'us_bank_account',
    });
    await createFinancialAddress({ ...BASE_PARAMS, currency: 'usd' });
    expect(mockStripe.v2.moneyManagement.financialAddresses.create).toHaveBeenCalledWith(
      { financial_account: 'fa_test', type: 'us_bank_account' },
      { stripeContext: 'acct_test' },
    );
  });

  it('defaults to GBP / gb_bank_account when no currency supplied', async () => {
    await createFinancialAddress(BASE_PARAMS);
    expect(mockStripe.v2.moneyManagement.financialAddresses.create).toHaveBeenCalledWith(
      { financial_account: 'fa_test', type: 'gb_bank_account' },
      { stripeContext: 'acct_test' },
    );
  });

  it('returns null for unsupported_currency instead of throwing', async () => {
    const unsupported = Object.assign(new Error('unsupported'), { code: 'unsupported_currency' });
    mockStripe.v2.moneyManagement.financialAddresses.create.mockRejectedValueOnce(unsupported);

    const result = await createFinancialAddress({ ...BASE_PARAMS, currency: 'jpy' });
    expect(result).toBeNull();
  });

  it('rethrows non-unsupported-currency errors', async () => {
    const other = Object.assign(new Error('bad request'), { code: 'invalid_request' });
    mockStripe.v2.moneyManagement.financialAddresses.create.mockRejectedValueOnce(other);

    await expect(createFinancialAddress(BASE_PARAMS)).rejects.toThrow('bad request');
  });

  it('is case-insensitive for currency', async () => {
    await createFinancialAddress({ ...BASE_PARAMS, currency: 'GBP' });
    expect(mockStripe.v2.moneyManagement.financialAddresses.create).toHaveBeenCalledWith(
      { financial_account: 'fa_test', type: 'gb_bank_account' },
      { stripeContext: 'acct_test' },
    );
  });
});
