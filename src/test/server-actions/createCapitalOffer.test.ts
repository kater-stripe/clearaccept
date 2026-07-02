import { buildMockStripe } from '../mockStripe';

const mockStripe = buildMockStripe();

jest.mock('@/utils/initializeStripe', () => ({
  initializeStripe: jest.fn(() => mockStripe),
}));

import { createCapitalOffer } from '@/app/api/financing-offers/createCapitalOffer';

const BASE_PARAMS = {
  accountId: 'acct_test',
  country: 'GB' as const,
  stripeSecretKey: 'sk_test_123',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockStripe.rawRequest.mockResolvedValue({ id: 'cfo_test', state: 'delivered' });
});

describe('createCapitalOffer', () => {
  it('throws when no secret key is provided', async () => {
    await expect(
      createCapitalOffer({ ...BASE_PARAMS, stripeSecretKey: undefined }),
    ).rejects.toThrow('Unable to create financing offer');
  });

  it('creates a GB offer as cash_advance with is_youlend: true', async () => {
    await createCapitalOffer({ ...BASE_PARAMS, country: 'GB' });

    expect(mockStripe.rawRequest).toHaveBeenCalledWith(
      'POST',
      '/v1/capital/financing_offers/test_mode',
      expect.objectContaining({
        financing_type: 'cash_advance',
        is_youlend: true,
        country: 'GB',
        connected_account: 'acct_test',
      }),
    );
  });

  it('creates a US offer as flex_loan with is_youlend: false', async () => {
    await createCapitalOffer({ ...BASE_PARAMS, country: 'US' });

    expect(mockStripe.rawRequest).toHaveBeenCalledWith(
      'POST',
      '/v1/capital/financing_offers/test_mode',
      expect.objectContaining({
        financing_type: 'flex_loan',
        is_youlend: false,
        country: 'US',
      }),
    );
  });

  it('sets offer state to delivered', async () => {
    await createCapitalOffer(BASE_PARAMS);
    expect(mockStripe.rawRequest).toHaveBeenCalledWith(
      'POST',
      '/v1/capital/financing_offers/test_mode',
      expect.objectContaining({ state: 'delivered' }),
    );
  });

  it('returns null when the Capital endpoint is unavailable on this platform', async () => {
    mockStripe.rawRequest.mockRejectedValueOnce(new Error('endpoint not available'));

    const result = await createCapitalOffer(BASE_PARAMS);
    expect(result).toBeNull();
  });

  it('returns the created offer on success', async () => {
    const result = await createCapitalOffer(BASE_PARAMS);
    expect(result).toMatchObject({ id: 'cfo_test', state: 'delivered' });
  });
});
