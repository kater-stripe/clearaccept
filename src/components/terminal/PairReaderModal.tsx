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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { Button } from '../common/Button';
import { createReader as createReaderAction } from '@/app/api/terminal/readers/createReader';
import { LoadingSpinner } from '../common/LoadingSpinner';

type PairReaderModalProps = {
  open: boolean;
  onClose: () => void;
  locationId: string;
};

export const PairReaderModal = ({
  open,
  onClose,
  locationId,
}: PairReaderModalProps) => {
  const { t } = useTranslation();
  const { account } = useDemoMerchant();
  const { stripeSecretKey, chargeType } = useDemoConfig();

  const [registrationCode, setRegistrationCode] = useState('');

  useEffect(() => {
    if (open) {
      return;
    }

    const resetTimeout = setTimeout(() => {
      setRegistrationCode('');
    }, 1000);

    return () => clearTimeout(resetTimeout);
  }, [open]);

  const queryClient = useQueryClient();

  const { mutate: createReader, isPending: isCreatingReader } = useMutation({
    mutationFn: createReaderAction,
    onSuccess: () => {
      onClose();

      queryClient.invalidateQueries({
        queryKey: ['terminal-readers', locationId, stripeSecretKey, chargeType],
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

            createReader({
              registrationCode,
              locationId,
              chargeType,
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
                      {t('modals.pair-reader.title')}
                    </DialogTitle>
                    <div className='mt-2'>
                      <p className='text-sm text-gray-500'>
                        {t('modals.pair-reader.description')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className='mt-4 flex flex-col gap-y-4'>
                  <Input
                    label={t('modals.pair-reader.form.registration-code')}
                    value={registrationCode}
                    onChange={setRegistrationCode}
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
                    {t('modals.pair-reader.form.cancel')}
                  </Button>
                  <Button
                    className='w-full'
                    disabled={isCreatingReader}
                    type='submit'
                  >
                    {isCreatingReader ? (
                      <LoadingSpinner className='size-4' strokeWidth={3} />
                    ) : (
                      t('modals.pair-reader.form.pair')
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
