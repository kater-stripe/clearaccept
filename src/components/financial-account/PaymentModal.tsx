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
import { Input } from '../common/Input';
import { CurrencyInput } from '../common/CurrencyInput';
import { Alert } from '../common/Alert';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { getPayoutMethods as getPayoutMethodsAction } from '@/app/api/money-management/payout-methods/getPayoutMethods';
import { createOutboundPayment as createOutboundPaymentAction } from '@/app/api/money-management/outbound-payments/createOutboundPayment';
import type { Stripe } from 'stripe';
import type { CurrencyCode } from '@/constants/currencyCodes';

type PaymentModalProps = {
  open: boolean;
  onClose: () => void;
  sourceFinancialAccount: Stripe.V2.MoneyManagement.FinancialAccount;
};

export const PaymentModal = ({
  open,
  onClose,
  sourceFinancialAccount,
}: PaymentModalProps) => {
  const { t } = useTranslation();
  const { stripeSecretKey } = useDemoConfig();
  const { account } = useDemoMerchant();
  const queryClient = useQueryClient();

  const [payoutMethodId, setPayoutMethodId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>('');

  // Get available currencies from source account
  const availableCurrencies = Object.keys(
    sourceFinancialAccount.balance?.available || {},
  );
  const defaultCurrency = availableCurrencies[0] || 'usd';
  const [currency, setCurrency] = useState<string>(defaultCurrency);

  // Get available balance for selected currency
  const availableBalance =
    sourceFinancialAccount.balance?.available?.[currency]?.value || 0;

  // Fetch payout methods
  const { data: payoutMethods, isPending: isLoadingPayoutMethods } = useQuery({
    queryKey: ['payout-methods', account?.id, stripeSecretKey],
    queryFn: () =>
      getPayoutMethodsAction({
        accountId: account!.id,
        stripeSecretKey,
      }),
    enabled: !!account && open,
  });

  // Filter to only bank accounts and cards
  const availablePayoutMethods = useMemo(() => {
    if (!payoutMethods) return [];
    return payoutMethods.filter(
      (pm) =>
        (pm.type === 'bank_account' && pm.bank_account) ||
        (pm.type === 'card' && pm.card),
    );
  }, [payoutMethods]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      const resetTimeout = setTimeout(() => {
        setPayoutMethodId('');
        setAmount(0);
        setDescription('');
        setCurrency(defaultCurrency);
      }, 300);
      return () => clearTimeout(resetTimeout);
    }
  }, [open, defaultCurrency]);

  // Create payment mutation
  const {
    mutate: createPayment,
    isPending: isCreatingPayment,
    error: paymentError,
  } = useMutation({
    mutationFn: createOutboundPaymentAction,
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

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) return;

    createPayment({
      accountId: account.id,
      fromFinancialAccountId: sourceFinancialAccount.id,
      recipientId: payoutMethodId, // Using payout method as the recipient
      amount,
      currency,
      description: description || undefined,
      stripeSecretKey,
    });
  };

  const isPaymentFormValid =
    payoutMethodId && amount > 0 && amount <= availableBalance;

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

      <form onSubmit={handleSubmitPayment}>
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
                  {t('modals.payment.title')}
                </DialogTitle>
                <p className='mt-1 text-sm text-gray-500'>
                  {t('modals.payment.description', {
                    accountName: sourceFinancialAccount.display_name,
                  })}
                </p>
              </div>

              {!isCreatingPayment && paymentError && (
                <div className='mt-4'>
                  <Alert>{t('modals.payment.error')}</Alert>
                </div>
              )}

              <div className='mt-4 flex flex-col gap-y-4'>
                {/* Payout Method Selection */}
                <div>
                  {isLoadingPayoutMethods ? (
                    <div className='flex items-center gap-2 p-3 bg-gray-50 rounded-md'>
                      <LoadingSpinner className='size-4' strokeWidth={3} />
                      <span className='text-sm text-gray-500'>
                        {t('modals.payment.form.loading-payout-methods')}
                      </span>
                    </div>
                  ) : !availablePayoutMethods ||
                    availablePayoutMethods.length === 0 ? (
                    <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-md'>
                      <p className='text-sm text-yellow-700'>
                        {t('modals.payment.form.no-payout-methods-available')}
                      </p>
                    </div>
                  ) : (
                    <Select
                      label={t('modals.payment.form.destination')}
                      value={payoutMethodId}
                      onChange={(value) => setPayoutMethodId(value || '')}
                      options={availablePayoutMethods.map((pm) => ({
                        value: pm.id,
                        label: getPayoutMethodLabel(pm),
                      }))}
                      placeholder={t('modals.payment.form.select-destination')}
                      nullable
                      required
                    />
                  )}
                </div>

                {/* Currency Selection */}
                {availableCurrencies.length > 1 && (
                  <Select
                    label={t('modals.payment.form.currency')}
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
                    label={t('modals.payment.form.amount', {
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
                      {t('modals.payment.form.insufficient-funds')}
                    </p>
                  )}
                </div>

                {/* Description */}
                <Input
                  label={t('modals.payment.form.description')}
                  value={description}
                  onChange={setDescription}
                  placeholder={t('modals.payment.form.description-placeholder')}
                />
              </div>

              <div className='flex flex-col md:flex-row gap-4 mt-5'>
                <Button
                  className='w-full bg-white border border-gray-500 text-gray-500 hover:bg-gray-100'
                  type='button'
                  onClick={onClose}
                >
                  {t('modals.payment.form.cancel')}
                </Button>
                <Button
                  className='w-full'
                  disabled={
                    isCreatingPayment ||
                    !isPaymentFormValid ||
                    isLoadingPayoutMethods
                  }
                  type='submit'
                >
                  {isCreatingPayment ? (
                    <LoadingSpinner className='size-4' strokeWidth={3} />
                  ) : (
                    t('modals.payment.form.send-payment')
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
