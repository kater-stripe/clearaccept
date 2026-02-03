'use client';

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import { CurrencyInput } from '../common/CurrencyInput';
import { Alert } from '../common/Alert';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { getFinancialAccounts as getFinancialAccountsAction } from '@/app/api/money-management/financial-accounts/getFinancialAccounts';
import { getPayoutMethods as getPayoutMethodsAction } from '@/app/api/money-management/payout-methods/getPayoutMethods';
import { createOutboundTransfer as createOutboundTransferAction } from '@/app/api/money-management/outbound-transfers/createOutboundTransfer';
import type { Stripe } from 'stripe';
import type { CurrencyCode } from '@/constants/currencyCodes';

type TransferModalProps = {
  open: boolean;
  onClose: () => void;
  sourceFinancialAccount: Stripe.V2.MoneyManagement.FinancialAccount;
};

type DestinationType = 'financial-account' | 'external-bank';

export const TransferModal = ({
  open,
  onClose,
  sourceFinancialAccount,
}: TransferModalProps) => {
  const { t } = useTranslation();
  const { stripeSecretKey } = useDemoConfig();
  const { account } = useDemoMerchant();
  const queryClient = useQueryClient();

  const [destinationType, setDestinationType] =
    useState<DestinationType>('financial-account');
  const [destinationId, setDestinationId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);

  // Get available currencies from source account
  const availableCurrencies = Object.keys(
    sourceFinancialAccount.balance?.available || {},
  );
  const defaultCurrency = availableCurrencies[0] || 'usd';
  const [currency, setCurrency] = useState<string>(defaultCurrency);

  // Get available balance for selected currency
  const availableBalance =
    sourceFinancialAccount.balance?.available?.[currency]?.value || 0;

  // Fetch all financial accounts to select destination
  const { data: financialAccounts, isPending: isLoadingAccounts } = useQuery({
    queryKey: ['financial-accounts', account?.id, stripeSecretKey],
    queryFn: () =>
      getFinancialAccountsAction({
        accountId: account!.id,
        stripeSecretKey,
      }),
    enabled: !!account && open,
  });

  // Fetch payout methods for external bank accounts
  const { data: payoutMethods, isPending: isLoadingPayoutMethods } = useQuery({
    queryKey: ['payout-methods', account?.id, stripeSecretKey],
    queryFn: () =>
      getPayoutMethodsAction({
        accountId: account!.id,
        stripeSecretKey,
      }),
    enabled: !!account && open,
  });

  // Filter out source account from destination options
  const destinationAccounts = useMemo(
    () =>
      financialAccounts?.filter((fa) => fa.id !== sourceFinancialAccount.id) ||
      [],
    [financialAccounts, sourceFinancialAccount.id],
  );

  // Filter payout methods to only show bank accounts
  const externalBankAccounts = useMemo(() => {
    if (!payoutMethods) return [];
    return payoutMethods.filter((pm) => {
      // Filter for bank account payout methods
      return pm.type === 'bank_account' && pm.bank_account;
    });
  }, [payoutMethods]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      const resetTimeout = setTimeout(() => {
        setDestinationType('financial-account');
        setDestinationId('');
        setAmount(0);
        setCurrency(defaultCurrency);
      }, 300);
      return () => clearTimeout(resetTimeout);
    }
  }, [open, defaultCurrency]);

  // Reset destination when type changes
  useEffect(() => {
    setDestinationId('');
  }, [destinationType]);

  const {
    mutate: createTransfer,
    isPending: isCreatingTransfer,
    error: transferError,
  } = useMutation({
    mutationFn: createOutboundTransferAction,
    onSuccess: (response) => {
      if ('message' in response) {
        throw new Error(response.message);
      }

      onClose();

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['financial-account', sourceFinancialAccount.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['financial-account-transactions', sourceFinancialAccount.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['financial-accounts', account?.id, stripeSecretKey],
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) return;

    createTransfer({
      accountId: account.id,
      fromFinancialAccountId: sourceFinancialAccount.id,
      toPayoutMethodId: destinationId,
      amount,
      currency,
      stripeSecretKey,
    });
  };

  const isFormValid = destinationId && amount > 0 && amount <= availableBalance;

  const isLoading = isLoadingAccounts || isLoadingPayoutMethods;

  // Get label for payout method
  const getPayoutMethodLabel = (
    pm: Stripe.V2.MoneyManagement.PayoutMethod,
  ): string => {
    if (pm.type === 'bank_account' && pm.bank_account) {
      return `${pm.bank_account.bank_name || 'Bank Account'} ••••${pm.bank_account.last4}`;
    }
    if (pm.type === 'card' && pm.card) {
      return `Card ••••${pm.card.last4}`;
    }
    return pm.id;
  };

  return (
    <Dialog open={open} onClose={onClose} className='relative z-10'>
      <DialogBackdrop
        transition
        className='fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in'
      />

      <form onSubmit={handleSubmit}>
        <div className='fixed inset-0 z-10 w-screen overflow-y-auto'>
          <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
            <DialogPanel
              transition
              className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:data-closed:translate-y-0 sm:data-closed:scale-95'
            >
              <div>
                <DialogTitle
                  as='h3'
                  className='text-lg font-semibold text-gray-900'
                >
                  {t('modals.transfer.title')}
                </DialogTitle>
                <p className='mt-1 text-sm text-gray-500'>
                  {t('modals.transfer.description', {
                    accountName: sourceFinancialAccount.display_name,
                  })}
                </p>
              </div>

              {!isCreatingTransfer && transferError && (
                <div className='mt-4'>
                  <Alert>{t('modals.transfer.error')}</Alert>
                </div>
              )}

              <div className='mt-4 flex flex-col gap-y-4'>
                {/* Destination Type */}
                <Select
                  label={t('modals.transfer.form.destination-type')}
                  value={destinationType}
                  onChange={(value) => {
                    setDestinationType(value as DestinationType);
                  }}
                  options={[
                    {
                      value: 'financial-account',
                      label: t('modals.transfer.form.financial-account'),
                    },
                    {
                      value: 'external-bank',
                      label: t('modals.transfer.form.external-bank'),
                    },
                  ]}
                  required
                />

                {/* Destination Selection - Financial Account */}
                {destinationType === 'financial-account' && (
                  <>
                    {isLoadingAccounts ? (
                      <div className='flex items-center gap-2 p-3 bg-gray-50 rounded-md'>
                        <LoadingSpinner className='size-4' strokeWidth={3} />
                        <span className='text-sm text-gray-500'>
                          {t('modals.transfer.form.loading-accounts')}
                        </span>
                      </div>
                    ) : destinationAccounts.length === 0 ? (
                      <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-md'>
                        <p className='text-sm text-yellow-700'>
                          {t('modals.transfer.form.no-accounts-available')}
                        </p>
                      </div>
                    ) : (
                      <Select
                        label={t('modals.transfer.form.destination-account')}
                        value={destinationId}
                        onChange={(value) => setDestinationId(value || '')}
                        options={destinationAccounts.map((fa) => ({
                          value: fa.id,
                          label: fa.display_name || fa.id,
                        }))}
                        placeholder={t(
                          'modals.transfer.form.select-destination-account',
                        )}
                        nullable
                        required
                      />
                    )}
                  </>
                )}

                {/* Destination Selection - External Bank */}
                {destinationType === 'external-bank' && (
                  <>
                    {isLoadingPayoutMethods ? (
                      <div className='flex items-center gap-2 p-3 bg-gray-50 rounded-md'>
                        <LoadingSpinner className='size-4' strokeWidth={3} />
                        <span className='text-sm text-gray-500'>
                          {t('modals.transfer.form.loading-banks')}
                        </span>
                      </div>
                    ) : externalBankAccounts.length === 0 ? (
                      <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-md'>
                        <p className='text-sm text-yellow-700'>
                          {t('modals.transfer.form.no-banks-available')}
                        </p>
                      </div>
                    ) : (
                      <Select
                        label={t('modals.transfer.form.destination-bank')}
                        value={destinationId}
                        onChange={(value) => setDestinationId(value || '')}
                        options={externalBankAccounts.map((pm) => ({
                          value: pm.id,
                          label: getPayoutMethodLabel(pm),
                        }))}
                        placeholder={t(
                          'modals.transfer.form.select-destination-bank',
                        )}
                        nullable
                        required
                      />
                    )}
                  </>
                )}

                {/* Currency Selection */}
                {availableCurrencies.length > 1 && (
                  <Select
                    label={t('modals.transfer.form.currency')}
                    value={currency}
                    onChange={setCurrency}
                    options={availableCurrencies.map((curr) => ({
                      value: curr,
                      label: curr.toUpperCase(),
                    }))}
                    required
                  />
                )}

                {/* Amount */}
                <div>
                  <CurrencyInput
                    label={t('modals.transfer.form.amount', {
                      available: (availableBalance / 100).toFixed(2),
                      currency: currency.toUpperCase(),
                    })}
                    currency={currency as CurrencyCode}
                    onChange={setAmount}
                    required
                    max={availableBalance / 100}
                  />
                  {amount > availableBalance && (
                    <p className='mt-1 text-sm text-red-500'>
                      {t('modals.transfer.form.insufficient-funds')}
                    </p>
                  )}
                </div>
              </div>

              <div className='flex flex-col md:flex-row gap-4 mt-5'>
                <Button
                  className='w-full bg-white border border-gray-500 text-gray-500 hover:bg-gray-100'
                  type='button'
                  onClick={onClose}
                >
                  {t('modals.transfer.form.cancel')}
                </Button>
                <Button
                  className='w-full'
                  disabled={isCreatingTransfer || !isFormValid || isLoading}
                  type='submit'
                >
                  {isCreatingTransfer ? (
                    <LoadingSpinner className='size-4' strokeWidth={3} />
                  ) : (
                    t('modals.transfer.form.transfer')
                  )}
                </Button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </form>
    </Dialog>
  );
};
