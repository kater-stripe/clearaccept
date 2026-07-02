import { buildMockStripe } from '../mockStripe';

const mockStripe = buildMockStripe();

jest.mock('@/utils/initializeStripe', () => ({
  initializeStripe: jest.fn(() => mockStripe),
}));

import { createFinancialAccount } from '@/app/api/money-management/financial-accounts/createFinancialAccount';

const BASE_PARAMS = {
  name: 'ClearAccept Wallet',
  accountId: 'acct_test',
  currency: 'gbp',
  stripeSecretKey: 'sk_test_123',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockStripe.v2.core.accounts.retrieve.mockResolvedValue({
    id: 'acct_test',
    defaults: { currency: 'gbp' },
  });
  mockStripe.v2.core.accounts.update.mockResolvedValue({});
  mockStripe.v2.moneyManagement.financialAccounts.create.mockResolvedValue({
    id: 'fa_test',
    display_name: 'ClearAccept Wallet',
    type: 'storage',
    status: 'open',
    storage: { holds_currencies: ['gbp'] },
    created: new Date().toISOString(),
  });
});

describe('createFinancialAccount', () => {
  it('throws when no secret key is provided', async () => {
    await expect(
      createFinancialAccount({ ...BASE_PARAMS, stripeSecretKey: undefined }),
    ).rejects.toThrow('Unable to create financial account');
  });

  it('creates a GBP financial account successfully', async () => {
    const result = await createFinancialAccount(BASE_PARAMS);
    expect(result).toMatchObject({ id: 'fa_test', display_name: 'ClearAccept Wallet' });
    expect(mockStripe.v2.moneyManagement.financialAccounts.create).toHaveBeenCalledWith(
      { display_name: 'ClearAccept Wallet', type: 'storage', storage: { holds_currencies: ['gbp'] } },
      { stripeContext: 'acct_test' },
    );
  });

  it('requests only the specified currency capability', async () => {
    await createFinancialAccount({ ...BASE_PARAMS, currency: 'eur' });
    expect(mockStripe.v2.core.accounts.update).toHaveBeenCalledWith(
      'acct_test',
      expect.objectContaining({
        configuration: expect.objectContaining({
          money_manager: expect.objectContaining({
            capabilities: expect.objectContaining({
              business_storage: {
                inbound: { eur: { requested: true } },
                outbound: { eur: { requested: true } },
              },
            }),
          }),
        }),
      }),
    );
  });

  it('resolves currency from account defaults when not specified', async () => {
    mockStripe.v2.core.accounts.retrieve.mockResolvedValueOnce({
      id: 'acct_test',
      defaults: { currency: 'eur' },
    });
    mockStripe.v2.moneyManagement.financialAccounts.create.mockResolvedValueOnce({
      id: 'fa_eur',
      storage: { holds_currencies: ['eur'] },
    });

    await createFinancialAccount({ name: 'Euro Wallet', accountId: 'acct_test', stripeSecretKey: 'sk_test' });

    expect(mockStripe.v2.moneyManagement.financialAccounts.create).toHaveBeenCalledWith(
      expect.objectContaining({ storage: { holds_currencies: ['eur'] } }),
      expect.any(Object),
    );
  });

  it('retries on capability_restricted and succeeds on a later attempt', async () => {
    const capError = Object.assign(new Error('restricted'), { code: 'financial_account_capability_restricted' });
    mockStripe.v2.moneyManagement.financialAccounts.create
      .mockRejectedValueOnce(capError)
      .mockRejectedValueOnce(capError)
      .mockResolvedValueOnce({ id: 'fa_retry', storage: { holds_currencies: ['gbp'] } });

    const result = await createFinancialAccount(BASE_PARAMS);

    expect(result).toMatchObject({ id: 'fa_retry' });
    expect(mockStripe.v2.moneyManagement.financialAccounts.create).toHaveBeenCalledTimes(3);
  }, 15_000);

  it('returns error message after all 5 retries are exhausted', async () => {
    const capError = Object.assign(new Error('restricted'), { code: 'financial_account_capability_restricted' });
    mockStripe.v2.moneyManagement.financialAccounts.create.mockRejectedValue(capError);

    const result = await createFinancialAccount(BASE_PARAMS);

    expect(result).toEqual({ message: 'modals.create-financial-account.error' });
    expect(mockStripe.v2.moneyManagement.financialAccounts.create).toHaveBeenCalledTimes(5);
  }, 15_000);

  it('does not retry on non-capability errors', async () => {
    const other = Object.assign(new Error('bad'), { code: 'invalid_request' });
    mockStripe.v2.moneyManagement.financialAccounts.create.mockRejectedValueOnce(other);

    const result = await createFinancialAccount(BASE_PARAMS);

    expect(result).toEqual({ message: 'modals.create-financial-account.error' });
    expect(mockStripe.v2.moneyManagement.financialAccounts.create).toHaveBeenCalledTimes(1);
  });

  it('proceeds even when capability update fails (best-effort)', async () => {
    mockStripe.v2.core.accounts.update.mockRejectedValueOnce(new Error('not enabled'));
    const result = await createFinancialAccount(BASE_PARAMS);
    expect(result).toMatchObject({ id: 'fa_test' });
  });
});
