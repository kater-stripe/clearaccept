import { buildMockStripe } from '../mockStripe';

const mockStripe = buildMockStripe();
const mockFetch = jest.fn();

jest.mock('@/utils/initializeStripe', () => ({
  initializeStripe: jest.fn(() => mockStripe),
}));

global.fetch = mockFetch;

import { createOutboundPayment } from '@/app/api/money-management/outbound-payments/createOutboundPayment';

const BASE_PARAMS = {
  connectedAccountId: 'acct_test',
  fromFinancialAccountId: 'fa_test',
  recipientAccountId: 'acct_recipient',
  payoutMethodId: 'pm_test_123',
  amount: 10000,
  currency: 'gbp',
  stripeSecretKey: 'sk_test_123',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
  mockStripe.v2.moneyManagement.outboundPayments.create.mockResolvedValue({
    id: 'obp_test',
    status: 'processing',
  });
  mockStripe.v2.moneyManagement.outboundPaymentQuotes.create.mockResolvedValue({
    id: 'obpq_test',
  });
});

describe('createOutboundPayment', () => {
  it('throws when no secret key is provided', async () => {
    await expect(
      createOutboundPayment({ ...BASE_PARAMS, stripeSecretKey: undefined }),
    ).rejects.toThrow('Unable to create outbound payment');
  });

  it('creates a payment without CoP for non-gbba_ payout methods', async () => {
    await createOutboundPayment(BASE_PARAMS);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockStripe.v2.moneyManagement.outboundPayments.create).toHaveBeenCalledWith(
      expect.objectContaining({
        from: { financial_account: 'fa_test', currency: 'gbp' },
        to: { recipient: 'acct_recipient', payout_method: 'pm_test_123', currency: 'gbp' },
        amount: { value: 10000, currency: 'gbp' },
      }),
      { stripeContext: 'acct_test' },
    );
  });

  it('initiates and acknowledges CoP for gbba_ payout methods', async () => {
    await createOutboundPayment({ ...BASE_PARAMS, payoutMethodId: 'gbba_test123' });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [initiateUrl] = mockFetch.mock.calls[0];
    const [acknowledgeUrl] = mockFetch.mock.calls[1];
    expect(initiateUrl).toContain('initiate_confirmation_of_payee');
    expect(acknowledgeUrl).toContain('acknowledge_confirmation_of_payee');
    expect(mockFetch.mock.calls[0][1].headers['Stripe-Context']).toBe('acct_test/acct_recipient');
  });

  it('creates an FX quote when source and destination currencies differ', async () => {
    await createOutboundPayment({ ...BASE_PARAMS, currency: 'gbp', destinationCurrency: 'eur' });

    expect(mockStripe.v2.moneyManagement.outboundPaymentQuotes.create).toHaveBeenCalledWith(
      expect.objectContaining({
        from: { financial_account: 'fa_test', currency: 'gbp' },
        to: expect.objectContaining({ currency: 'eur' }),
      }),
      { stripeContext: 'acct_test' },
    );
    expect(mockStripe.v2.moneyManagement.outboundPayments.create).toHaveBeenCalledWith(
      expect.objectContaining({ outbound_payment_quote: 'obpq_test' }),
      { stripeContext: 'acct_test' },
    );
  });

  it('skips FX quote when currencies are the same', async () => {
    await createOutboundPayment({ ...BASE_PARAMS, currency: 'gbp', destinationCurrency: 'gbp' });
    expect(mockStripe.v2.moneyManagement.outboundPaymentQuotes.create).not.toHaveBeenCalled();
  });

  it('returns error message object on payment creation failure', async () => {
    mockStripe.v2.moneyManagement.outboundPayments.create.mockRejectedValueOnce(
      new Error('insufficient funds'),
    );

    const result = await createOutboundPayment(BASE_PARAMS);
    expect(result).toMatchObject({ message: 'modals.outbound-payment.error' });
  });

  it('proceeds with payment even when CoP fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('network error'));

    const result = await createOutboundPayment({
      ...BASE_PARAMS,
      payoutMethodId: 'gbba_test123',
    });
    expect(result).toMatchObject({ id: 'obp_test' });
  });

  it('passes description to payment', async () => {
    await createOutboundPayment({ ...BASE_PARAMS, description: 'Invoice #42' });
    expect(mockStripe.v2.moneyManagement.outboundPayments.create).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Invoice #42' }),
      expect.any(Object),
    );
  });
});
