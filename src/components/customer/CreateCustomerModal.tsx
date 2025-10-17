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
import { createCustomer as createCustomerAction } from '@/app/api/customers/createCustomer';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { Alert } from '../common/Alert';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { Stripe } from 'stripe';

type CreateCustomerModalProps = {
  open: boolean;
  onClose: (customer?: Stripe.Customer) => void;
  email?: string | null;
  phoneNumber?: string | null;
};

export const CreateCustomerModal = ({
  open,
  onClose,
  email: initialEmail,
  phoneNumber: initialPhoneNumber,
}: CreateCustomerModalProps) => {
  const { t } = useTranslation();
  const { account } = useDemoMerchant();
  const { stripeSecretKey, chargeType } = useDemoConfig();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!initialEmail) {
      return;
    }

    setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (!initialPhoneNumber) {
      return;
    }

    setPhone(initialPhoneNumber);
  }, [initialPhoneNumber]);

  const queryClient = useQueryClient();

  const {
    mutate: createCustomer,
    isPending: isCreatingCustomer,
    error: createCustomerError,
  } = useMutation({
    mutationFn: createCustomerAction,
    onSuccess: (customer) => {
      onClose(customer);
      setName('');
      setEmail('');
      setPhone('');

      // Invalidate and refetch customer-related queries
      queryClient.invalidateQueries({
        queryKey: ['customers'],
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createCustomer({
      name,
      email,
      phone,
      stripeSecretKey,
      chargeType,
      accountId: account!.id,
    });
  };

  return (
    <div>
      <Dialog open={open} onClose={() => onClose()} className='relative z-10'>
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
                  <div>
                    <DialogTitle
                      as='h3'
                      className='text-base font-semibold text-gray-900'
                    >
                      {t('modals.create-customer.title')}
                    </DialogTitle>
                    <div className='mt-2'>
                      <p className='text-sm text-gray-500'>
                        {t('modals.create-customer.description')}
                      </p>
                    </div>
                  </div>
                </div>

                {!isCreatingCustomer && createCustomerError && (
                  <div className='mt-4'>
                    <Alert>
                      {createCustomerError.message ||
                        t('modals.create-customer.error')}
                    </Alert>
                  </div>
                )}

                <div className='mt-4 flex flex-col gap-y-4'>
                  <Input
                    label={t('modals.create-customer.form.name')}
                    value={name}
                    onChange={setName}
                    required
                  />

                  <Input
                    label={t('modals.create-customer.form.email')}
                    value={email}
                    onChange={setEmail}
                    type='email'
                    required
                  />

                  <Input
                    label={t('modals.create-customer.form.phone')}
                    value={phone}
                    onChange={setPhone}
                    type='tel'
                    required
                  />
                </div>

                <div className='mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3'>
                  <Button
                    type='submit'
                    disabled={isCreatingCustomer}
                    className='inline-flex w-full justify-center rounded-md bg-brand-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:opacity-50 disabled:cursor-not-allowed sm:col-start-2'
                  >
                    {isCreatingCustomer ? (
                      <LoadingSpinner className='size-4' strokeWidth={3} />
                    ) : (
                      t('modals.create-customer.form.create')
                    )}
                  </Button>

                  <Button
                    type='button'
                    onClick={() => onClose()}
                    className='mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0'
                  >
                    {t('modals.create-customer.form.cancel')}
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
