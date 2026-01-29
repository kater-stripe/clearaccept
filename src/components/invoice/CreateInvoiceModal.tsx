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
import { useEffect, useState } from 'react';
import { createInvoice as createInvoiceAction } from '@/app/api/invoices/createInvoice';
import { getCustomers as getCustomersAction } from '@/app/api/customers/getCustomers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { Alert } from '../common/Alert';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import { CURRENCY_CODES, CurrencyCode } from '@/constants/currencyCodes';
import { CurrencyInput } from '../common/CurrencyInput';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number;
};

type CreateInvoiceModalProps = {
  open: boolean;
  onClose: () => void;
};

export const CreateInvoiceModal = ({
  open,
  onClose,
}: CreateInvoiceModalProps) => {
  const { t } = useTranslation();
  const { account } = useDemoMerchant();
  const { stripeSecretKey, chargeType } = useDemoConfig();

  const defaultCurrency = account?.defaults?.currency ?? 'usd';

  const [customerId, setCustomerId] = useState<string>('');
  const [currency, setCurrency] = useState<CurrencyCode>(
    defaultCurrency as CurrencyCode,
  );
  const [daysUntilDue, setDaysUntilDue] = useState(30);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unitAmount: 0 },
  ]);

  const { data: customers } = useQuery({
    queryKey: ['customers', account?.id, stripeSecretKey, chargeType],
    queryFn: () =>
      getCustomersAction({
        accountId: account!.id,
        stripeSecretKey,
        chargeType,
      }),
    enabled: !!account && open,
  });

  useEffect(() => {
    if (open) {
      return;
    }

    const resetTimeout = setTimeout(() => {
      setCustomerId('');
      setCurrency(defaultCurrency as CurrencyCode);
      setDaysUntilDue(30);
      setLineItems([
        {
          id: crypto.randomUUID(),
          description: '',
          quantity: 1,
          unitAmount: 0,
        },
      ]);
    }, 1000);

    return () => clearTimeout(resetTimeout);
  }, [open, defaultCurrency]);

  const queryClient = useQueryClient();

  const {
    mutate: createInvoice,
    isPending: isCreatingInvoice,
    error: createInvoiceError,
  } = useMutation({
    mutationFn: createInvoiceAction,
    onSuccess: () => {
      onClose();
      queryClient.invalidateQueries({
        queryKey: ['invoices', account?.id, stripeSecretKey, chargeType],
      });
    },
  });

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: crypto.randomUUID(), description: '', quantity: 1, unitAmount: 0 },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateLineItem = (
    id: string,
    field: keyof Omit<LineItem, 'id'>,
    value: string | number,
  ) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const isValid =
    customerId &&
    lineItems.every((item) => item.description && item.unitAmount > 0);

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

            createInvoice({
              customerId,
              currency,
              daysUntilDue,
              lineItems: lineItems.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitAmount: item.unitAmount,
              })),
              accountId: account!.id,
              chargeType,
              stripeSecretKey,
            });
          }}
        >
          <div className='fixed inset-0 z-10 w-screen overflow-y-auto'>
            <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
              <DialogPanel
                transition
                className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 sm:data-closed:translate-y-0 sm:data-closed:scale-95'
              >
                <div>
                  <div>
                    <DialogTitle
                      as='h3'
                      className='text-base font-semibold text-gray-900'
                    >
                      {t('modals.create-invoice.title')}
                    </DialogTitle>
                    <div className='mt-2'>
                      <p className='text-sm text-gray-500'>
                        {t('modals.create-invoice.description')}
                      </p>
                    </div>
                  </div>
                </div>
                {!isCreatingInvoice && createInvoiceError && (
                  <div className='mt-4'>
                    <Alert>{t('modals.create-invoice.error')}</Alert>
                  </div>
                )}
                <div className='mt-4 flex flex-col gap-y-4'>
                  <Select
                    label={t('modals.create-invoice.form.customer')}
                    value={customerId}
                    onChange={(value) => setCustomerId(value ?? '')}
                    options={
                      customers?.map((customer) => ({
                        value: customer.id,
                        label: `${customer.name || 'No name'} (${customer.email || 'No email'})`,
                      })) ?? []
                    }
                    required={true}
                    nullable={true}
                    placeholder={t(
                      'modals.create-invoice.form.select-customer',
                    )}
                  />
                  <div className='grid grid-cols-2 gap-4'>
                    <Select
                      label={t('modals.create-invoice.form.currency')}
                      value={currency}
                      onChange={(value) => setCurrency(value)}
                      options={CURRENCY_CODES.map((c) => ({
                        value: c,
                        label: c.toUpperCase(),
                      }))}
                      required={true}
                    />
                    <Input
                      label={t('modals.create-invoice.form.days-until-due')}
                      type='number'
                      value={String(daysUntilDue)}
                      onChange={(value) => setDaysUntilDue(Number(value) || 30)}
                      required={true}
                    />
                  </div>

                  <div className='border-t border-gray-200 pt-4'>
                    <h4 className='text-sm font-medium text-gray-700 mb-3'>
                      {t('modals.create-invoice.form.line-items')}
                    </h4>
                    <div className='flex flex-col gap-y-3'>
                      {lineItems.map((item, index) => (
                        <div
                          key={item.id}
                          className='flex gap-3 items-end p-3 bg-gray-50 rounded-md'
                        >
                          <div className='flex-1'>
                            <Input
                              label={t(
                                'modals.create-invoice.form.description',
                              )}
                              value={item.description}
                              onChange={(value) =>
                                updateLineItem(item.id, 'description', value)
                              }
                              required={true}
                            />
                          </div>
                          <div className='w-24'>
                            <Input
                              label={t('modals.create-invoice.form.quantity')}
                              type='number'
                              value={String(item.quantity)}
                              onChange={(value) =>
                                updateLineItem(
                                  item.id,
                                  'quantity',
                                  Number(value) || 1,
                                )
                              }
                              required={true}
                            />
                          </div>
                          <div className='w-32'>
                            <CurrencyInput
                              label={t(
                                'modals.create-invoice.form.unit-amount',
                              )}
                              currency={currency}
                              onChange={(value) =>
                                updateLineItem(item.id, 'unitAmount', value)
                              }
                              required={true}
                            />
                          </div>
                          <Button
                            type='button'
                            onClick={() => removeLineItem(item.id)}
                            className='bg-red-600 hover:bg-red-500 h-10 text-white'
                            disabled={lineItems.length === 1}
                          >
                            <TrashIcon className='size-4' />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type='button'
                        onClick={addLineItem}
                        className='bg-brand-primary'
                      >
                        <PlusIcon className='size-4' />
                        {t('modals.create-invoice.form.add-line-item')}
                      </Button>
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
                    {t('modals.create-invoice.form.cancel')}
                  </Button>
                  <Button
                    className='w-full'
                    disabled={isCreatingInvoice || !isValid}
                    type='submit'
                  >
                    {t('modals.create-invoice.form.create')}
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
