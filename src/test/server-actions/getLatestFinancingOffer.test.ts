import { buildMockStripe } from '../mockStripe';

const mockStripe = buildMockStripe();

jest.mock('@/utils/initializeStripe', () => ({
  initializeStripe: jest.fn(() => mockStripe),
}));

import { getLatestFinancingOffer } from '@/app/api/financing-offers/getLatestFinancingOffer';

const BASE_PARAMS = {
  accountId: 'acct_test',
  stripeSecretKey: 'sk_test_123',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockStripe.capital.financingOffers.list.mockResolvedValue({ data: [] });
});

describe('getLatestFinancingOffer', () => {
  it('throws when no secret key is provided', async () => {
    await expect(
      getLatestFinancingOffer({ ...BASE_PARAMS, stripeSecretKey: undefined }),
    ).rejects.toThrow('Unable to get financing offers');
  });

  it('returns null when there are no offers', async () => {
    const result = await getLatestFinancingOffer(BASE_PARAMS);
    expect(result).toBeNull();
  });

  it('returns the most recently created offer', async () => {
    const older = { id: 'cfo_old', created: '2024-01-01T00:00:00.000Z', state: 'delivered' };
    const newer = { id: 'cfo_new', created: '2024-06-01T00:00:00.000Z', state: 'accepted' };
    mockStripe.capital.financingOffers.list.mockResolvedValueOnce({ data: [older, newer] });

    const result = await getLatestFinancingOffer(BASE_PARAMS);
    expect(result).toMatchObject({ id: 'cfo_new' });
  });

  it('returns the single offer when only one exists', async () => {
    const offer = { id: 'cfo_only', created: '2024-01-01T00:00:00.000Z', state: 'delivered' };
    mockStripe.capital.financingOffers.list.mockResolvedValueOnce({ data: [offer] });

    const result = await getLatestFinancingOffer(BASE_PARAMS);
    expect(result).toMatchObject({ id: 'cfo_only' });
  });

  it('queries offers filtered by connected_account', async () => {
    await getLatestFinancingOffer(BASE_PARAMS);
    expect(mockStripe.capital.financingOffers.list).toHaveBeenCalledWith({
      connected_account: 'acct_test',
    });
  });
});
