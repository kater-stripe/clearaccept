import { buildMockStripe } from '../mockStripe';

const mockStripe = buildMockStripe();

jest.mock('@/utils/initializeStripe', () => ({
  initializeStripe: jest.fn(() => mockStripe),
}));

jest.mock('@/app/api/money-management/financial-accounts/createFinancialAccount', () => ({
  createFinancialAccount: jest.fn().mockResolvedValue({ id: 'fa_test' }),
}));

import { createAccount } from '@/app/api/accounts/createAccount';
import { createFinancialAccount } from '@/app/api/money-management/financial-accounts/createFinancialAccount';

const BASE_PARAMS = {
  countryCode: 'GB' as const,
  language: 'en',
  email: 'demo@example.com',
  stripeSecretKey: 'sk_test_123',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockStripe.customers.list.mockResolvedValue({ data: [] });
  mockStripe.v2.core.accounts.create.mockResolvedValue({
    id: 'acct_new',
    identity: { country: 'GB' },
    defaults: { currency: 'gbp' },
    requirements: null,
  });
  mockStripe.customers.update.mockResolvedValue({});
  mockStripe.accounts.update.mockResolvedValue({});
  (createFinancialAccount as jest.Mock).mockResolvedValue({ id: 'fa_test' });
});

describe('createAccount', () => {
  it('throws when no secret key is provided', async () => {
    await expect(
      createAccount({ ...BASE_PARAMS, stripeSecretKey: undefined }),
    ).rejects.toThrow('Unable to create account');
  });

  it('returns error message when email is already in use', async () => {
    mockStripe.customers.list.mockResolvedValueOnce({ data: [{ id: 'cus_existing' }] });

    const result = await createAccount(BASE_PARAMS);
    expect(result).toEqual({ message: 'sign-up.errors.email-already-in-use' });
    expect(mockStripe.v2.core.accounts.create).not.toHaveBeenCalled();
  });

  it('creates account with GBP business_storage for GB country', async () => {
    await createAccount({ ...BASE_PARAMS, storerCapabilityEnabled: true });

    const createCall = mockStripe.v2.core.accounts.create.mock.calls[0][0];
    expect(createCall.configuration.money_manager.capabilities.business_storage).toEqual({
      inbound: { gbp: { requested: true } },
      outbound: { gbp: { requested: true } },
    });
  });

  it('creates account with EUR business_storage for a euro-zone country', async () => {
    await createAccount({ ...BASE_PARAMS, countryCode: 'FR' as any, storerCapabilityEnabled: true });

    const createCall = mockStripe.v2.core.accounts.create.mock.calls[0][0];
    expect(createCall.configuration.money_manager.capabilities.business_storage).toEqual({
      inbound: { eur: { requested: true } },
      outbound: { eur: { requested: true } },
    });
  });

  it('creates account with USD business_storage for US country', async () => {
    await createAccount({ ...BASE_PARAMS, countryCode: 'US' as any, storerCapabilityEnabled: true });

    const createCall = mockStripe.v2.core.accounts.create.mock.calls[0][0];
    expect(createCall.configuration.money_manager.capabilities.business_storage).toEqual({
      inbound: { usd: { requested: true } },
      outbound: { usd: { requested: true } },
    });
  });

  it('omits money_manager configuration when storerCapabilityEnabled is false', async () => {
    await createAccount({ ...BASE_PARAMS, storerCapabilityEnabled: false });

    const createCall = mockStripe.v2.core.accounts.create.mock.calls[0][0];
    expect(createCall.configuration?.money_manager).toBeUndefined();
  });

  it('auto-creates ClearAccept Wallet FA when storerCapabilityEnabled is true', async () => {
    await createAccount({ ...BASE_PARAMS, storerCapabilityEnabled: true });

    expect(createFinancialAccount).toHaveBeenCalledWith({
      name: 'ClearAccept Wallet',
      accountId: 'acct_new',
      currency: 'gbp',
      stripeSecretKey: 'sk_test_123',
    });
  });

  it('does not auto-create FA when storerCapabilityEnabled is false', async () => {
    await createAccount({ ...BASE_PARAMS, storerCapabilityEnabled: false });
    expect(createFinancialAccount).not.toHaveBeenCalled();
  });

  it('completes account creation even when FA auto-creation fails', async () => {
    (createFinancialAccount as jest.Mock).mockRejectedValueOnce(new Error('FA failed'));

    const result = await createAccount({ ...BASE_PARAMS, storerCapabilityEnabled: true });
    expect(result).toMatchObject({ id: 'acct_new' });
  });

  it('sets dashboard to none', async () => {
    await createAccount(BASE_PARAMS);
    const createCall = mockStripe.v2.core.accounts.create.mock.calls[0][0];
    expect(createCall.dashboard).toBe('none');
  });

  it('passes country code to identity', async () => {
    await createAccount({ ...BASE_PARAMS, countryCode: 'DE' as any });
    const createCall = mockStripe.v2.core.accounts.create.mock.calls[0][0];
    expect(createCall.identity.country).toBe('DE');
  });

  it('includes requirements in the account include list', async () => {
    await createAccount(BASE_PARAMS);
    const createCall = mockStripe.v2.core.accounts.create.mock.calls[0][0];
    expect(createCall.include).toContain('requirements');
    expect(createCall.include).toContain('configuration.merchant');
  });
});
