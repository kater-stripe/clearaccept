'use client';

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Skeleton } from '../common/Skeleton';
import { getPayoutMethods as getPayoutMethodsAction } from '@/app/api/money-management/payout-methods/getPayoutMethods';
import { createOutboundTransfer as createOutboundTransferAction } from '@/app/api/money-management/outbound-transfers/createOutboundTransfer';
import { formatPrice } from '@/utils/formatPrice';
import type { CurrencyCode } from '@/constants/currencyCodes';
import type { SupportedLanguage } from '@/constants/languages';
import type Stripe from 'stripe';

type WithdrawModalProps = {
  open: boolean;
  onClose: () => void;
  sourceFinancialAccount: Stripe.V2.MoneyManagement.FinancialAccount;
};

export const WithdrawModal = ({
  open,
  onClose,
  sourceFinancialAccount,
}: WithdrawModalProps) => {
  const { stripeSecretKey, language } = useDemoConfig();
  const { account } = useDemoMerchant();
  const queryClient = useQueryClient();

  const [selectedPayoutMethodId, setSelectedPayoutMethodId] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const availableBalance = (() => {
    if (!sourceFinancialAccount.balance?.available) return null;
    const entries = Object.entries(sourceFinancialAccount.balance.available);
    return entries.length > 0 ? entries[0][1] : null;
  })();

  const currency = availableBalance?.currency ?? 'gbp';

  const fmt = (value: number, cur: string) =>
    formatPrice(value, language as SupportedLanguage, cur as CurrencyCode);

  const { data: payoutMethods, isPending: isLoadingMethods } = useQuery({
    queryKey: ['payout-methods-own', account?.id, stripeSecretKey],
    queryFn: () =>
      getPayoutMethodsAction({ connectedAccountId: account!.id, stripeSecretKey }),
    enabled: !!account && open,
  });

  const {
    mutate: withdraw,
    isPending: isWithdrawing,
    error: withdrawError,
    reset: resetMutation,
  } = useMutation({
    mutationFn: createOutboundTransferAction,
    onSuccess: (response) => {
      if ('message' in response) {
        throw new Error(response.error ?? response.message);
      }
      setSuccessMessage('Withdrawal initiated successfully.');
      setAmountInput('');
      queryClient.invalidateQueries({
        queryKey: ['financial-accounts', account?.id, stripeSecretKey],
      });
      queryClient.invalidateQueries({
        queryKey: ['financial-account-transactions', sourceFinancialAccount.id],
      });
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1500);
    },
  });

  const handleClose = () => {
    setAmountInput('');
    setSelectedPayoutMethodId('');
    setSuccessMessage('');
    resetMutation();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !selectedPayoutMethodId || !amountInput) return;

    const amountMinorUnits = Math.round(parseFloat(amountInput) * 100);
    if (isNaN(amountMinorUnits) || amountMinorUnits <= 0) return;

    withdraw({
      accountId: account.id,
      fromFinancialAccountId: sourceFinancialAccount.id,
      toPayoutMethodId: selectedPayoutMethodId,
      amount: amountMinorUnits,
      currency,
      stripeSecretKey,
    });
  };

  const selectedMethod = payoutMethods?.find((m) => m.id === selectedPayoutMethodId);
  const maxAmount = (availableBalance?.value ?? 0) / 100;

  const getMethodLabel = (method: any) => {
    const ba = method.gb_bank_account ?? method.us_bank_account ?? method.iban;
    if (ba?.last4) {
      const type = method.gb_bank_account
        ? 'GB Bank'
        : method.us_bank_account
          ? 'Bank'
          : 'IBAN';
      return `${type} ····${ba.last4}`;
    }
    return method.id;
  };

  return (
    <Dialog open={open} onClose={handleClose} className='relative z-20'>
      <DialogBackdrop
        transition
        className='fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in'
      />
      <form onSubmit={handleSubmit}>
        <div className='fixed inset-0 z-20 w-screen overflow-y-auto'>
          <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
            <DialogPanel
              transition
              className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:data-closed:translate-y-0 sm:data-closed:scale-95'
            >
              <DialogTitle as='h3' className='text-lg font-semibold text-gray-900'>
                Withdraw to bank
              </DialogTitle>
              <p className='mt-1 text-sm text-gray-500'>
                Send funds from your wallet to your linked bank account.
              </p>

              {availableBalance && (
                <p className='mt-2 text-sm text-gray-700'>
                  Available:{' '}
                  <span className='font-semibold'>
                    {fmt(availableBalance.value ?? 0, currency)}
                  </span>
                </p>
              )}

              {withdrawError && (
                <div className='mt-4'>
                  <Alert>
                    {withdrawError instanceof Error
                      ? withdrawError.message
                      : 'An error occurred. Please try again.'}
                  </Alert>
                </div>
              )}

              {successMessage && (
                <div className='mt-4 rounded-md bg-green-50 border border-green-200 p-3'>
                  <p className='text-sm text-green-800'>{successMessage}</p>
                </div>
              )}

              <div className='mt-4 space-y-4'>
                {/* Bank account selector */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Destination bank account
                  </label>
                  {isLoadingMethods ? (
                    <Skeleton className='h-10 w-full' />
                  ) : !payoutMethods || payoutMethods.length === 0 ? (
                    <p className='text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3'>
                      No bank accounts linked to your account. Add one via your account settings.
                    </p>
                  ) : (
                    <select
                      value={selectedPayoutMethodId}
                      onChange={(e) => setSelectedPayoutMethodId(e.target.value)}
                      required
                      className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-primary'
                    >
                      <option value=''>Select a bank account…</option>
                      {payoutMethods.map((method: any) => (
                        <option key={method.id} value={method.id}>
                          {getMethodLabel(method)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Amount ({currency.toUpperCase()})
                  </label>
                  <input
                    type='number'
                    step='0.01'
                    min='0.01'
                    max={maxAmount}
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    required
                    placeholder='0.00'
                    className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-primary'
                  />
                </div>
              </div>

              <div className='flex flex-col md:flex-row gap-3 mt-6'>
                <Button
                  type='button'
                  className='w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  className='w-full'
                  disabled={
                    isWithdrawing ||
                    !selectedPayoutMethodId ||
                    !amountInput ||
                    isLoadingMethods ||
                    !payoutMethods?.length
                  }
                >
                  {isWithdrawing ? (
                    <LoadingSpinner className='size-4' strokeWidth={3} />
                  ) : (
                    'Withdraw'
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
