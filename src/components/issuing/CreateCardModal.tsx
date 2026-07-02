'use client';

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useEffect, useState } from 'react';
import { createCard as createCardAction } from '@/app/api/issuing/createCard';
import { getCardholders as getCardholdersAction } from '@/app/api/issuing/getCardholders';
import { getFinancialAccounts as getFinancialAccountsAction } from '@/app/api/money-management/financial-accounts/getFinancialAccounts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatPrice } from '@/utils/formatPrice';
import type { CurrencyCode } from '@/constants/currencyCodes';
import type { SupportedLanguage } from '@/constants/languages';
import { CreateCardholderModal } from './CreateCardholderModal';

type CreateCardModalProps = {
  open: boolean;
  onClose: () => void;
  defaultFinancialAccountId?: string;
};

export const CreateCardModal = ({ open, onClose, defaultFinancialAccountId }: CreateCardModalProps) => {
  const { t } = useTranslation();
  const { account } = useDemoMerchant();
  const { stripeSecretKey, language } = useDemoConfig();
  const queryClient = useQueryClient();

  const [cardholderId, setCardholderId] = useState('');
  const [cardType, setCardType] = useState<'virtual' | 'physical'>('virtual');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [financialAccountId, setFinancialAccountId] = useState('');
  const [isCreateCardholderOpen, setIsCreateCardholderOpen] = useState(false);

  const currency = account?.defaults?.currency ?? 'gbp';

  useEffect(() => {
    if (open) {
      // Set default financial account ID when opening if provided
      if (defaultFinancialAccountId) {
        setFinancialAccountId(defaultFinancialAccountId);
      }
      return;
    }

    const resetTimeout = setTimeout(() => {
      setCardholderId('');
      setCardType('virtual');
      setStatus('active');
      setFinancialAccountId('');
    }, 1000);

    return () => clearTimeout(resetTimeout);
  }, [open, defaultFinancialAccountId]);

  // Fetch cardholders for the selector
  const { data: cardholders, isPending: isCardholdersLoading } = useQuery({
    queryKey: ['issuing-cardholders', account?.id, stripeSecretKey],
    queryFn: () =>
      getCardholdersAction({
        accountId: account!.id,
        stripeSecretKey,
      }),
    enabled: !!account && open,
  });

  // Fetch financial accounts for the selector
  const { data: financialAccounts, isPending: isFinancialAccountsLoading } =
    useQuery({
      queryKey: ['financial-accounts', account?.id, stripeSecretKey],
      queryFn: () =>
        getFinancialAccountsAction({
          accountId: account!.id,
          stripeSecretKey,
        }),
      enabled: !!account && open,
    });

  const {
    mutate: createCard,
    isPending: isCreating,
    error: createError,
  } = useMutation({
    mutationFn: createCardAction,
    onSuccess: (response) => {
      if ('message' in response) {
        throw new Error(response.message);
      }

      onClose();

      queryClient.invalidateQueries({
        queryKey: ['issuing-cards'],
      });
    },
  });

  return (
    <>
    <Dialog open={open} onClose={onClose} className='relative z-10'>
      <DialogBackdrop
        transition
        className='fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in'
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();

          createCard({
            cardholderId,
            type: cardType,
            currency,
            status,
            financialAccountId,
            accountId: account!.id,
            stripeSecretKey: stripeSecretKey,
          });
        }}
      >
        <div className='fixed inset-0 z-10 w-screen overflow-y-auto'>
          <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
            <DialogPanel
              transition
              className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:data-closed:translate-y-0 sm:data-closed:scale-95'
            >
              <div>
                <DialogTitle
                  as='h3'
                  className='text-base font-semibold text-gray-900'
                >
                  {t('dashboard.issuing.create-card.title')}
                </DialogTitle>
                <p className='mt-1 text-sm text-gray-500'>
                  {t('dashboard.issuing.create-card.description')}
                </p>
              </div>

              {!isCreating && createError && (
                <div className='mt-4'>
                  <Alert>{createError.message}</Alert>
                </div>
              )}

              <div className='mt-4 flex flex-col gap-y-4'>
                {/* Cardholder selector */}
                <div>
                  <Select
                    label={t('dashboard.issuing.create-card.cardholder')}
                    value={cardholderId}
                    onChange={setCardholderId}
                    placeholder={
                      isCardholdersLoading
                        ? 'Loading...'
                        : t(
                          'dashboard.issuing.create-card.select-cardholder-placeholder',
                        )
                    }
                    options={
                      cardholders
                        ?.filter((ch) => ch.status === 'active')
                        .map((ch) => ({
                          value: ch.id,
                          label: ch.name,
                        })) ?? []
                    }
                    required
                    disabled={isCardholdersLoading}
                  />
                  {!isCardholdersLoading && (!cardholders || cardholders.length === 0) && (
                    <p className='mt-1 text-xs text-gray-500'>
                      No cardholders yet.{' '}
                      <button
                        type='button'
                        onClick={() => setIsCreateCardholderOpen(true)}
                        className='text-brand-primary underline hover:no-underline'
                      >
                        Create one now
                      </button>
                    </p>
                  )}
                  {!isCardholdersLoading && cardholders && cardholders.length > 0 && (
                    <button
                      type='button'
                      onClick={() => setIsCreateCardholderOpen(true)}
                      className='mt-1 text-xs text-brand-primary hover:underline'
                    >
                      + Add cardholder
                    </button>
                  )}
                </div>

                {/* Card type selector */}
                <Select
                  label={t('dashboard.issuing.create-card.card-type')}
                  value={cardType}
                  onChange={setCardType}
                  options={[
                    {
                      value: 'virtual' as const,
                      label: t('dashboard.issuing.create-card.virtual'),
                    },
                    {
                      value: 'physical' as const,
                      label: t('dashboard.issuing.create-card.physical'),
                    },
                  ]}
                  required
                />

                {/* Status selector */}
                <Select
                  label={t('dashboard.issuing.create-card.initial-status')}
                  value={status}
                  onChange={setStatus}
                  options={[
                    {
                      value: 'active' as const,
                      label: t('dashboard.issuing.create-card.active'),
                    },
                    {
                      value: 'inactive' as const,
                      label: t('dashboard.issuing.create-card.inactive'),
                    },
                  ]}
                  required
                />

                {/* Financial Account selector */}
                <div>
                  <Select
                    label={t(
                      'dashboard.issuing.create-card.financial-account',
                    )}
                    value={financialAccountId}
                    onChange={setFinancialAccountId}
                    placeholder={
                      isFinancialAccountsLoading
                        ? 'Loading...'
                        : t(
                          'dashboard.issuing.create-card.select-financial-account-placeholder',
                        )
                    }
                    options={
                      financialAccounts?.map((fa) => {
                        const availableCurrencies = Object.entries(
                          fa.balance?.available || {},
                        );
                        const balanceDisplay = availableCurrencies
                          .map(
                            ([, balance]) =>
                              `${formatPrice(
                                balance?.value ?? 0,
                                language as SupportedLanguage,
                                (balance?.currency ?? 'gbp') as CurrencyCode,
                              )}`,
                          )
                          .join(', ');

                        return {
                          value: fa.id,
                          label: `${fa.display_name || fa.id}${balanceDisplay ? ` (${balanceDisplay})` : ''}`,
                        };
                      }) ?? []
                    }
                    required
                    disabled={isFinancialAccountsLoading}
                  />
                  <p className='mt-1 text-xs text-gray-500'>
                    {t('dashboard.issuing.create-card.financial-account-help')}
                  </p>
                </div>
              </div>

              <div className='flex flex-col md:flex-row gap-4 mt-5'>
                <Button
                  className='w-full bg-white border border-gray-500 text-gray-500 hover:bg-gray-100'
                  type='button'
                  onClick={onClose}
                >
                  {t('dashboard.issuing.create-card.cancel')}
                </Button>
                <Button
                  className='w-full'
                  disabled={isCreating || !cardholderId || !financialAccountId}
                  type='submit'
                >
                  {isCreating ? (
                    <LoadingSpinner className='size-4' strokeWidth={3} />
                  ) : (
                    t('dashboard.issuing.create-card.create')
                  )}
                </Button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </form>
    </Dialog>

    <CreateCardholderModal
      open={isCreateCardholderOpen}
      onClose={() => setIsCreateCardholderOpen(false)}
      onCreated={(newCardholderId) => {
        setIsCreateCardholderOpen(false);
        setCardholderId(newCardholderId);
        queryClient.invalidateQueries({ queryKey: ['issuing-cardholders', account?.id, stripeSecretKey] });
      }}
    />
    </>
  );
};

