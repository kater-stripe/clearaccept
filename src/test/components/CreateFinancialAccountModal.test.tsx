import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@/app/api/money-management/financial-accounts/createFinancialAccount', () => ({
  createFinancialAccount: jest.fn().mockResolvedValue({ id: 'fa_test' }),
}));

jest.mock('@/context/DemoMerchantContext', () => ({
  useDemoMerchant: jest.fn(() => ({
    account: { id: 'acct_test' },
    connectInstance: null,
    isLoading: false,
  })),
}));

jest.mock('@/context/DemoConfigContext', () => ({
  useDemoConfig: jest.fn(() => ({
    stripeSecretKey: 'sk_test_123',
    demoConfig: {},
  })),
}));

import { CreateFinancialAccountModal } from '@/components/financial-account/CreateFinancialAccountModal';
import { createFinancialAccount as mockCreateFA } from '@/app/api/money-management/financial-accounts/createFinancialAccount';

function renderModal(props: { open?: boolean; onClose?: () => void } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const onClose = props.onClose ?? jest.fn();
  render(
    <QueryClientProvider client={client}>
      <CreateFinancialAccountModal open={props.open ?? true} onClose={onClose} />
    </QueryClientProvider>,
  );
  return { onClose };
}

beforeEach(() => {
  jest.clearAllMocks();
  (mockCreateFA as jest.Mock).mockResolvedValue({ id: 'fa_test' });
});

describe('CreateFinancialAccountModal', () => {
  it('renders title when open', () => {
    renderModal({ open: true });
    expect(screen.getByText('modals.create-financial-account.title')).toBeInTheDocument();
  });

  it('shows GBP, EUR, and USD currency buttons', () => {
    renderModal();
    expect(screen.getByRole('button', { name: 'GBP' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'EUR' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'USD' })).toBeInTheDocument();
  });

  it('defaults to GBP selected (highlighted border)', () => {
    renderModal();
    const gbp = screen.getByRole('button', { name: 'GBP' });
    expect(gbp).toHaveStyle({ borderColor: '#77B32A' });
  });

  it('switches currency selection when a different currency is clicked', async () => {
    renderModal();
    await userEvent.click(screen.getByRole('button', { name: 'EUR' }));
    expect(screen.getByRole('button', { name: 'EUR' })).toHaveStyle({ borderColor: '#77B32A' });
    expect(screen.getByRole('button', { name: 'GBP' })).toHaveStyle({ borderColor: '#D8DCE0' });
  });

  it('calls createFinancialAccount with the entered name and selected currency on submit', async () => {
    const { onClose } = renderModal();
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'My Wallet');

    await userEvent.click(
      screen.getByRole('button', { name: 'modals.create-financial-account.form.create' }),
    );

    await waitFor(() => {
      expect(mockCreateFA).toHaveBeenCalledWith({
        name: 'My Wallet',
        accountId: 'acct_test',
        currency: 'gbp',
        stripeSecretKey: 'sk_test_123',
      });
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('passes eur to server action when EUR is selected', async () => {
    renderModal();
    await userEvent.click(screen.getByRole('button', { name: 'EUR' }));
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Euro Account');

    await userEvent.click(
      screen.getByRole('button', { name: 'modals.create-financial-account.form.create' }),
    );

    await waitFor(() => {
      expect(mockCreateFA).toHaveBeenCalledWith(
        expect.objectContaining({ currency: 'eur' }),
      );
    });
  });

  it('calls onClose when Cancel is clicked', async () => {
    const { onClose } = renderModal();
    await userEvent.click(
      screen.getByRole('button', { name: 'modals.create-financial-account.form.cancel' }),
    );
    expect(onClose).toHaveBeenCalled();
  });
});
