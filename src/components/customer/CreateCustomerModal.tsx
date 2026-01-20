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
import { Select } from '../common/Select';
import { COUNTRIES } from '@/constants/countryCodes';
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
  const [email, setEmail] = useState(initialEmail || '');
  const [phone, setPhone] = useState(initialPhoneNumber || '');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('US');

  // Update email/phone when props change (for POS page pre-fill)
  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  useEffect(() => {
    if (initialPhoneNumber) {
      setPhone(initialPhoneNumber);
    }
  }, [initialPhoneNumber]);

  useEffect(() => {
    if (open) {
      return;
    }

    const resetTimeout = setTimeout(() => {
      setName('');
      setEmail(initialEmail || '');
      setPhone(initialPhoneNumber || '');
      setLine1('');
      setLine2('');
      setCity('');
      setState('');
      setPostalCode('');
      setCountry('US');
    }, 1000);

    return () => clearTimeout(resetTimeout);
  }, [open, initialEmail, initialPhoneNumber]);

  const queryClient = useQueryClient();

  const {
    mutate: createCustomer,
    isPending: isCreatingCustomer,
    error: createCustomerError,
  } = useMutation({
    mutationFn: createCustomerAction,
    onSuccess: (customer) => {
      queryClient.invalidateQueries({
        queryKey: ['customers', account?.id, stripeSecretKey, chargeType],
      });
      onClose(customer);
    },
  });

  const handleClose = () => {
    onClose();
  };

  return (
    <div>
      <Dialog open={open} onClose={handleClose} className='relative z-10'>
        <DialogBackdrop
          transition
          className='fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in'
        />

        <form
          onSubmit={(e) => {
            e.preventDefault();

            createCustomer({
              name,
              email,
              phone: phone || undefined,
              accountId: account!.id,
              chargeType,
              stripeSecretKey,
              address: line1
                ? {
                    line1,
                    line2: line2 || undefined,
                    city: city || undefined,
                    state: state || undefined,
                    postal_code: postalCode || undefined,
                    country: country || undefined,
                  }
                : undefined,
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
                    <Alert>{t('modals.create-customer.error')}</Alert>
                  </div>
                )}
                <div className='mt-4 flex flex-col gap-y-4'>
                  <Input
                    label={t('modals.create-customer.form.name')}
                    value={name}
                    onChange={setName}
                    required={true}
                  />
                  <Input
                    label={t('modals.create-customer.form.email')}
                    type='email'
                    value={email}
                    onChange={setEmail}
                    required={true}
                  />
                  <Input
                    label={t('modals.create-customer.form.phone')}
                    type='tel'
                    value={phone}
                    onChange={setPhone}
                  />
                  <div className='border-t border-gray-200 pt-4'>
                    <h4 className='text-sm font-medium text-gray-700 mb-3'>
                      {t('modals.create-customer.form.address')}
                    </h4>
                    <div className='flex flex-col gap-y-4'>
                      <Input
                        label={t('modals.create-customer.form.line1')}
                        value={line1}
                        onChange={setLine1}
                      />
                      <Input
                        label={t('modals.create-customer.form.line2')}
                        value={line2}
                        onChange={setLine2}
                      />
                      <div className='grid grid-cols-2 gap-4'>
                        <Input
                          label={t('modals.create-customer.form.city')}
                          value={city}
                          onChange={setCity}
                        />
                        <Input
                          label={t('modals.create-customer.form.state')}
                          value={state}
                          onChange={setState}
                        />
                      </div>
                      <div className='grid grid-cols-2 gap-4'>
                        <Input
                          label={t('modals.create-customer.form.postal-code')}
                          value={postalCode}
                          onChange={setPostalCode}
                        />
                        <Select
                          label={t('modals.create-customer.form.country')}
                          value={country}
                          onChange={(value) => setCountry(value)}
                          options={COUNTRIES.map((c) => ({
                            value: c.code,
                            label: c.name,
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className='flex flex-col md:flex-row gap-4 mt-5'>
                  <Button
                    className='w-full bg-white border border-gray-500 text-gray-500 hover:bg-gray-100'
                    type='button'
                    data-autofocus
                    onClick={handleClose}
                  >
                    {t('modals.create-customer.form.cancel')}
                  </Button>
                  <Button
                    className='w-full'
                    disabled={isCreatingCustomer}
                    type='submit'
                  >
                    {t('modals.create-customer.form.create')}
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
