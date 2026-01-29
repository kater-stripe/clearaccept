'use client';

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { Input } from '../common/Input';
import { TextArea } from '../common/TextArea';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { CurrencyInput } from '../common/CurrencyInput';
import { CURRENCY_CODES, CurrencyCode } from '@/constants/currencyCodes';
import { useEffect, useState } from 'react';
import { createProduct as createProductAction } from '@/app/api/products/createProduct';
import { createProductImageWithFileLink as createProductImageWithFileLinkAction } from '@/app/api/products/createProductImageWithFileLink';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { Alert } from '../common/Alert';
import { Button } from '../common/Button';
import { ConnectProductTaxCodeSelector } from '@stripe/react-connect-js';
import { Select } from '../common/Select';
import { FileUpload } from '../common/FileUpload';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Checkbox } from '../common/Checkbox';

type CreateProductModalProps = {
  open: boolean;
  onClose: () => void;
};

export const CreateProductModal = ({
  open,
  onClose,
}: CreateProductModalProps) => {
  const { t } = useTranslation();
  const { account } = useDemoMerchant();
  const { stripeSecretKey, chargeType } = useDemoConfig();

  const [name, setName] = useState('');
  const [description, setDescription] = useState<string | undefined>(undefined);
  const [unitAmount, setUnitAmount] = useState(0);

  const defaultCurrency = account?.defaults?.currency ?? 'usd';

  const [currency, setCurrency] = useState<CurrencyCode>(
    defaultCurrency as CurrencyCode,
  );
  const [productTaxCode, setProductTaxCode] = useState<string | undefined>(
    undefined,
  );
  const [category, setCategory] = useState<'good' | 'service'>('service');
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('11:00');
  const [recurringFrequency, setRecurringFrequency] = useState<
    Parameters<typeof createProductAction>[0]['recurringFrequency'] | undefined
  >(undefined);

  useEffect(() => {
    if (open) {
      return;
    }

    const resetTimeout = setTimeout(() => {
      setName('');
      setDescription(undefined);
      setUnitAmount(0);
      setCurrency(defaultCurrency as CurrencyCode);
      setProductTaxCode(undefined);
      setCategory('service');
      setStartTime('10:00');
      setEndTime('11:00');
      setRecurringFrequency(undefined);
      resetProductImageFileLink();
    }, 1000);

    return () => clearTimeout(resetTimeout);
  }, [open]);

  const queryClient = useQueryClient();

  const {
    mutate: createProduct,
    isPending: isCreatingProduct,
    error: createProductError,
  } = useMutation({
    mutationFn: createProductAction,
    onSuccess: (response) => {
      if ('message' in response) {
        throw new Error(response.message);
      }

      onClose();
      queryClient.invalidateQueries({
        queryKey: ['products', account?.id, stripeSecretKey, chargeType],
      });
    },
  });

  const {
    data: productImageFileLink,
    mutate: createProductImageWithFileLink,
    isPending: isCreatingProductImageWithFileLink,
    reset: resetProductImageFileLink,
  } = useMutation({
    mutationFn: createProductImageWithFileLinkAction,
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

            createProduct({
              name,
              description,
              unitAmount,
              productTaxCode,
              accountId: account!.id,
              currency,
              chargeType,
              imageUrl: productImageFileLink?.url ?? undefined,
              recurringFrequency,
              startTime,
              endTime,
              stripeSecretKey,
              category,
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
                      {t('modals.create-product.title')}
                    </DialogTitle>
                    <div className='mt-2'>
                      <p className='text-sm text-gray-500'>
                        {t('modals.create-product.description')}
                      </p>
                    </div>
                  </div>
                </div>
                {!isCreatingProduct && createProductError && (
                  <div className='mt-4'>
                    <Alert>{t(createProductError.message)}</Alert>
                  </div>
                )}
                <div className='mt-4 flex flex-col gap-y-4'>
                  <Input
                    label={t('modals.create-product.form.name')}
                    value={name}
                    onChange={setName}
                    required={true}
                  />
                  <TextArea
                    label={t('modals.create-product.form.description')}
                    value={description}
                    onChange={(v) => setDescription(v || undefined)}
                  />
                  <Select
                    label={t('modals.create-product.form.category')}
                    value={category}
                    onChange={(value) => setCategory(value)}
                    options={[
                      {
                        value: 'service',
                        label: t('modals.create-product.form.service'),
                      },
                      {
                        value: 'good',
                        label: t('modals.create-product.form.good'),
                      },
                    ]}
                  />
                  {category === 'service' && (
                    <>
                      <Input
                        label={t('modals.create-product.form.start-time')}
                        type='time'
                        value={startTime}
                        onChange={(value) => setStartTime(value)}
                        required={true}
                      />
                      <Input
                        label={t('modals.create-product.form.end-time')}
                        type='time'
                        value={endTime}
                        onChange={(value) => setEndTime(value)}
                        required={true}
                      />
                    </>
                  )}
                  <Select
                    label={t('modals.create-product.form.currency')}
                    value={currency}
                    onChange={(value) => setCurrency(value)}
                    options={CURRENCY_CODES.map((currency) => ({
                      value: currency,
                      label: currency.toUpperCase(),
                    }))}
                    required={true}
                  />
                  <CurrencyInput
                    label={t('modals.create-product.form.unit-amount')}
                    currency={currency}
                    onChange={setUnitAmount}
                    required={true}
                  />
                  <Checkbox
                    label={t(
                      'modals.create-product.form.recurring.is-recurring',
                    )}
                    checked={recurringFrequency !== undefined}
                    onChange={(value) =>
                      setRecurringFrequency(value ? 'month' : undefined)
                    }
                  />
                  {recurringFrequency !== undefined && (
                    <Select
                      label={t(
                        'modals.create-product.form.recurring.frequency',
                      )}
                      value={recurringFrequency}
                      onChange={(value) => setRecurringFrequency(value)}
                      options={[
                        {
                          value: 'day',
                          label: t('modals.create-product.form.recurring.day'),
                        },
                        {
                          value: 'week',
                          label: t('modals.create-product.form.recurring.week'),
                        },
                        {
                          value: 'month',
                          label: t(
                            'modals.create-product.form.recurring.month',
                          ),
                        },
                        {
                          value: 'year',
                          label: t('modals.create-product.form.recurring.year'),
                        },
                      ]}
                      required={true}
                    />
                  )}

                  <FileUpload
                    label={t('modals.create-product.form.image')}
                    onChange={async (e) => {
                      if (!e.target.files || e.target.files.length === 0) {
                        return;
                      }

                      const arrayBuffer = await e.target.files[0].arrayBuffer();

                      createProductImageWithFileLink({
                        stripeSecretKey,
                        image: arrayBuffer,
                      });
                    }}
                    multiple={false}
                    accept='image/png, image/jpeg, image/jpg'
                  />
                  {isCreatingProductImageWithFileLink && (
                    <div className='py-2 flex justify-start'>
                      <div>
                        <LoadingSpinner className='size-8 text-brand-secondary' />
                      </div>
                    </div>
                  )}
                  {productImageFileLink && (
                    <div>
                      <img
                        src={productImageFileLink.url!}
                        alt='Product Image'
                        className='h-24'
                      />
                    </div>
                  )}
                  <div>
                    <label className='block mb-2 text-sm font-medium text-gray-700 flex items-center gap-x-1'>
                      {t('modals.create-product.form.product-tax-code')}
                    </label>
                    <div id='connect-product-tax-code-selector'>
                      <ConnectProductTaxCodeSelector
                        onTaxCodeSelect={(taxCode) => {
                          setProductTaxCode(taxCode ?? undefined);
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className='flex flex-col md:flex-row gap-4 mt-5'>
                  <Button
                    className='w-full bg-white border border-gray-500 text-gray-500 hover:bg-gray-100'
                    type='button'
                    data-autofocus
                    onClick={onClose}
                  >
                    {t('modals.create-product.form.cancel')}
                  </Button>
                  <Button
                    className='w-full'
                    disabled={
                      isCreatingProduct || isCreatingProductImageWithFileLink
                    }
                    type='submit'
                  >
                    {t('modals.create-product.form.create')}
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
