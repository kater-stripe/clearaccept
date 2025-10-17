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
import { createTerminalLocation as createTerminalLocationAction } from '@/app/api/terminal/locations/createTerminalLocation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import { COUNTRIES } from '@/constants/countryCodes';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { Stripe } from 'stripe';

type CreateTerminalLocationModalProps = {
  open: boolean;
  onClose: () => void;
};

export const CreateTerminalLocationModal = ({
  open,
  onClose,
}: CreateTerminalLocationModalProps) => {
  const { t } = useTranslation();
  const { account } = useDemoMerchant();
  const { stripeSecretKey, chargeType } = useDemoConfig();

  const [displayName, setDisplayName] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const defaultCountry =
    (account?.object === 'v2.core.account'
      ? account?.identity?.country
      : account?.country) ?? 'US';

  const [country, setCountry] = useState(defaultCountry);

  useEffect(() => {
    if (open) {
      return;
    }

    const resetTimeout = setTimeout(() => {
      setDisplayName('');
      setLine1('');
      setLine2('');
      setCity('');
      setState('');
      setPostalCode('');
      setCountry(defaultCountry);
    }, 1000);

    return () => clearTimeout(resetTimeout);
  }, [open]);

  const queryClient = useQueryClient();

  const { mutate: createTerminalLocation, isPending: isCreatingLocation } =
    useMutation({
      mutationFn: createTerminalLocationAction,
      onSuccess: () => {
        onClose();
        queryClient.invalidateQueries({
          queryKey: [
            'terminal-locations',
            account?.id,
            stripeSecretKey,
            chargeType,
          ],
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

            createTerminalLocation({
              display_name: displayName,
              address: {
                line1,
                line2: line2 || undefined,
                city,
                state,
                postal_code: postalCode,
                country,
              },
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
                className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:data-closed:translate-y-0 sm:data-closed:scale-95'
              >
                <div>
                  <div>
                    <DialogTitle
                      as='h3'
                      className='text-base font-semibold text-gray-900'
                    >
                      {t('modals.create-terminal-location.title')}
                    </DialogTitle>
                    <div className='mt-2'>
                      <p className='text-sm text-gray-500'>
                        {t('modals.create-terminal-location.description')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className='mt-4 flex flex-col gap-y-4'>
                  <Input
                    label={t('modals.create-terminal-location.form.name')}
                    value={displayName}
                    onChange={setDisplayName}
                    required={true}
                  />
                  <Input
                    label={t('modals.create-terminal-location.form.line1')}
                    value={line1}
                    onChange={setLine1}
                    required={true}
                  />
                  <Input
                    label={t('modals.create-terminal-location.form.line2')}
                    value={line2}
                    onChange={setLine2}
                  />
                  <Input
                    label={t('modals.create-terminal-location.form.city')}
                    value={city}
                    onChange={setCity}
                    required={true}
                  />
                  <Input
                    label={t('modals.create-terminal-location.form.state')}
                    value={state}
                    onChange={setState}
                    required={true}
                  />
                  <Input
                    label={t(
                      'modals.create-terminal-location.form.postal-code',
                    )}
                    value={postalCode}
                    onChange={setPostalCode}
                    required={true}
                  />
                  <Select
                    label={t('modals.create-terminal-location.form.country')}
                    value={country}
                    onChange={setCountry}
                    required={true}
                    options={COUNTRIES.map((country) => ({
                      value: country.code,
                      label: country.name,
                    }))}
                  />
                </div>
                <div className='flex flex-col md:flex-row gap-4 mt-5'>
                  <Button
                    className='w-full bg-white border border-gray-500 text-gray-500 hover:bg-gray-100'
                    type='button'
                    data-autofocus
                    onClick={onClose}
                  >
                    {t('modals.create-terminal-location.form.cancel')}
                  </Button>
                  <Button
                    className='w-full'
                    disabled={isCreatingLocation}
                    type='submit'
                  >
                    {isCreatingLocation ? (
                      <LoadingSpinner className='size-4' strokeWidth={3} />
                    ) : (
                      t('modals.create-terminal-location.form.create')
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
