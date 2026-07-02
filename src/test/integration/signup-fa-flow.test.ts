/**
 * Integration tests: account sign-up → FA creation → address provisioning.
 * Mocks only the Stripe SDK; exercises real server action logic.
 */
import { buildMockStripe } from '../mockStripe';

const mockStripe = buildMockStripe();

jest.mock('@/utils/initializeStripe', () => ({
  initializeStripe: jest.fn(() => mockStripe),
}));

import { createAccount } from '@/app/api/accounts/createAccount';
import { createFinancialAccount } from '@/app/api/money-management/financial-accounts/createFinancialAccount';
import { createFinancialAddress } from '@/app/api/money-management/financial-addresses/createFinancialAddress';

const SK = 'sk_test_integration';

beforeEach(() => {
  jest.clearAllMocks();
  mockStripe.customers.list.mockResolvedValue({ data: [] });
  mockStripe.customers.update.mockResolvedValue({});
  mockStripe.accounts.update.mockResolvedValue({});
  mockStripe.v2.core.accounts.create.mockResolvedValue({
    id: 'acct_integration',
    identity: { country: 'GB' },
    defaults: { currency: 'gbp' },
    requirements: null,
  });
  mockStripe.v2.core.accounts.retrieve.mockResolvedValue({
    id: 'acct_integration',
    defaults: { currency: 'gbp' },
  });
  mockStripe.v2.core.accounts.update.mockResolvedValue({});
  mockStripe.v2.moneyManagement.financialAccounts.create.mockResolvedValue({
    id: 'fa_integration',
    display_name: 'ClearAccept Wallet',
    type: 'storage',
    status: 'open',
    storage: { holds_currencies: ['gbp'] },
    created: new Date().toISOString(),
  });
  mockStripe.v2.moneyManagement.financialAddresses.create.mockResolvedValue({
    id: 'fad_integration',
    type: 'gb_bank_account',
    gb_bank_account: { sort_code: '60-83-71', account_number: '00000002' },
  });
});

describe('GB merchant sign-up → FA creation → address provisioning', () => {
  it('creates a new GB account and auto-creates default GBP FA', async () => {
    const account = await createAccount({
      countryCode: 'GB',
      email: 'test_merchant@example.com',
      storerCapabilityEnabled: true,
      stripeSecretKey: SK,
    });

    expect(account).toMatchObject({ id: 'acct_integration' });
    expect(mockStripe.v2.moneyManagement.financialAccounts.create).toHaveBeenCalledWith(
      expect.objectContaining({ storage: { holds_currencies: ['gbp'] } }),
      { stripeContext: 'acct_integration' },
    );
  });

  it('provisions a GB bank address for the default FA', async () => {
    const address = await createFinancialAddress({
      accountId: 'acct_integration',
      financialAccountId: 'fa_integration',
      currency: 'gbp',
      stripeSecretKey: SK,
    });

    expect(address).toMatchObject({ type: 'gb_bank_account' });
    expect((address as any).gb_bank_account).toMatchObject({
      sort_code: '60-83-71',
      account_number: '00000002',
    });
  });

  it('full flow: sign up → create extra EUR FA → provision GBP address', async () => {
    await createAccount({
      countryCode: 'GB',
      email: 'new_merchant@example.com',
      storerCapabilityEnabled: true,
      stripeSecretKey: SK,
    });

    await createFinancialAccount({
      name: 'EUR Wallet',
      accountId: 'acct_integration',
      currency: 'eur',
      stripeSecretKey: SK,
    });

    expect(mockStripe.v2.moneyManagement.financialAccounts.create).toHaveBeenCalledWith(
      expect.objectContaining({ storage: { holds_currencies: ['eur'] } }),
      { stripeContext: 'acct_integration' },
    );

    const address = await createFinancialAddress({
      accountId: 'acct_integration',
      financialAccountId: 'fa_integration',
      currency: 'gbp',
      stripeSecretKey: SK,
    });
    expect(address).toMatchObject({ type: 'gb_bank_account' });
  });

  it('blocks duplicate email sign-ups', async () => {
    mockStripe.customers.list.mockResolvedValueOnce({ data: [{ id: 'cus_existing' }] });

    const result = await createAccount({
      countryCode: 'GB',
      email: 'duplicate_user@example.com',
      stripeSecretKey: SK,
    });

    expect(result).toEqual({ message: 'sign-up.errors.email-already-in-use' });
  });
});

describe('Capability-restricted retry recovery', () => {
  it('recovers from transient capability restriction during auto-FA creation', async () => {
    const capError = Object.assign(new Error('restricted'), {
      code: 'financial_account_capability_restricted',
    });
    mockStripe.v2.moneyManagement.financialAccounts.create
      .mockRejectedValueOnce(capError)
      .mockResolvedValueOnce({
        id: 'fa_retry',
        display_name: 'ClearAccept Wallet',
        storage: { holds_currencies: ['gbp'] },
      });

    const account = await createAccount({
      countryCode: 'GB',
      email: 'retry_user@example.com',
      storerCapabilityEnabled: true,
      stripeSecretKey: SK,
    });

    expect(account).toMatchObject({ id: 'acct_integration' });
    expect(mockStripe.v2.moneyManagement.financialAccounts.create).toHaveBeenCalledTimes(2);
  }, 15_000);
});
