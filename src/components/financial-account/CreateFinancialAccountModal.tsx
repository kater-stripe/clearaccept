'use client';

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { Input } from '../common/Input';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { CURRENCY_CODES, CurrencyCode } from '@/constants/currencyCodes';
import { useEffect, useState } from 'react';
import { createFinancialAccount as createFinancialAccountAction } from '@/app/api/financial-accounts/createFinancialAccount';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import { Alert } from '../common/Alert';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { Stripe } from 'stripe';

type CreateFinancialAccountModalProps = {
  open: boolean;
  onClose: () => void;
};

export const CreateFinancialAccountModal = ({
  open,
  onClose,
}: CreateFinancialAccountModalProps) => {
  const { t } = useTranslation();
  const { account } = useDemoMerchant();
  const { stripeSecretKey } = useDemoConfig();

  const [name, setName] = useState('');

  const defaultCurrency = account?.defaults?.currency ?? 'usd';

  const [currency, setCurrency] = useState<CurrencyCode>(
    defaultCurrency as CurrencyCode,
  );

  useEffect(() => {
    if (open) {
      return;
    }

    const resetTimeout = setTimeout(() => {
      setName('');
      setCurrency(defaultCurrency as CurrencyCode);
    }, 1000);

    return () => clearTimeout(resetTimeout);
  }, [open]);

  const queryClient = useQueryClient();

  const {
    mutate: createFinancialAccount,
    isPending: isCreatingFinancialAccount,
    error: createFinancialAccountError,
  } = useMutation({
    mutationFn: createFinancialAccountAction,
    onSuccess: (response) => {
      if ('message' in response) {
        throw new Error(response.message);
      }

      onClose();

      queryClient.invalidateQueries({
        queryKey: ['financial-accounts', account?.id, stripeSecretKey],
      });
    },
  });

  return (
    <div>
      <Dialog open={open} onClose={onClose} className='relative z-10'>
        <DialogBackdrop
          transition
          className='fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in'
        />

        <form
          onSubmit={(e) => {
            e.preventDefault();

            createFinancialAccount({
              name,
              currency,
              accountId: account!.id,
              stripeSecretKey,
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
                  <div>
                    <DialogTitle
                      as='h3'
                      className='text-base font-semibold text-gray-900'
                    >
                      {t('modals.create-financial-account.title')}
                    </DialogTitle>
                    <div className='mt-2'>
                      <p className='text-sm text-gray-500'>
                        {t('modals.create-financial-account.description')}
                      </p>
                    </div>
                  </div>
                </div>
                {!isCreatingFinancialAccount && createFinancialAccountError && (
                  <div className='mt-4'>
                    <Alert>{t(createFinancialAccountError.message)}</Alert>
                  </div>
                )}
                <div className='mt-4 flex flex-col gap-y-4'>
                  <Input
                    label={t('modals.create-financial-account.form.name')}
                    value={name}
                    onChange={setName}
                    required={true}
                  />
                  <Select
                    label={t('modals.create-financial-account.form.currency')}
                    value={currency}
                    onChange={setCurrency}
                    options={CURRENCY_CODES.map((currency) => ({
                      value: currency,
                      label: currency.toUpperCase(),
                    }))}
                    required={true}
                  />
                </div>
                <div className='flex flex-col md:flex-row gap-4 mt-5'>
                  <Button
                    className='w-full bg-white border border-gray-500 text-gray-500 hover:bg-gray-100'
                    type='button'
                    data-autofocus
                    onClick={onClose}
                  >
                    {t('modals.create-financial-account.form.cancel')}
                  </Button>
                  <Button
                    className='w-full'
                    disabled={isCreatingFinancialAccount}
                    type='submit'
                  >
                    {isCreatingFinancialAccount ? (
                      <LoadingSpinner className='size-4' strokeWidth={3} />
                    ) : (
                      t('modals.create-financial-account.form.create')
                    )}
                  </Button>
                </div>
              </DialogPanel>
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
