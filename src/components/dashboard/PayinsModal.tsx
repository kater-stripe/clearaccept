'use client';

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { Button } from '../common/Button';
import { CreditCardIcon } from '@heroicons/react/24/solid';
import { POSIcon } from '../pos/POSIcon';
import Link from 'next/link';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useEffect, useState } from 'react';
import { Checkout } from '../checkout/Checkout';
import { useHandleCallbacks } from '../checkout/HandleCallbacks';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';

type PayinsModalProps = {
  open: boolean;
  onClose: () => void;
};

export const PayinsModal = ({ open, onClose }: PayinsModalProps) => {
  const { t } = useTranslation();
  const { language } = useDemoConfig();
  const { items, clearCart } = useCart();
  const {
    redirectCountdown,
    resetRedirectCountdown,
    hasCallbackParameters,
    setErrorMessage,
  } = useHandleCallbacks();

  const [showCheckout, setShowCheckout] = useState(hasCallbackParameters);

  useEffect(() => {
    if (open) {
      return;
    }

    resetRedirectCountdown();
    setShowCheckout(false);
    clearCart();
    setErrorMessage('');
  }, [open]);

  useEffect(() => {
    if (items.length !== 0) {
      return;
    }
  }, [items]);

  return (
    <div>
      <Dialog open={open} onClose={onClose} className='relative z-10'>
        <DialogBackdrop
          transition
          className='fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in'
        />

        <div className='fixed inset-0 z-10 w-screen overflow-y-auto'>
          <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
            <DialogPanel
              transition
              className='relative transform overflow-hidden rounded-lg bg-white p-4 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 sm:data-closed:translate-y-0 sm:data-closed:scale-95'
            >
              <DialogTitle
                as='h3'
                className='text-base font-semibold text-gray-900 sr-only'
              >
                {t('modals.payins.title')}
              </DialogTitle>
              {redirectCountdown < 6 ? (
                <div className='py-16 flex-shrink-0 flex justify-center'>
                  <div className='text-center'>
                    <Image
                      src='/img/icon/check-circle-outlined.svg'
                      alt='Success checkmark circle'
                      height={16}
                      width={16}
                      className='h-16 w-16 inline'
                    />

                    <h1 className='mt-2 text-4xl font-extrabold text-brand-primary tracking-tight sm:text-5xl'>
                      {t('success.title')}
                    </h1>
                    <div className='mt-6'>
                      <div className='text-base font-medium text-brand-primary hover:shadow-none text-md'>
                        {t('success.description', {
                          countdown: redirectCountdown,
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {showCheckout ? (
                    <Checkout shippingOptionsOverride={[]} />
                  ) : (
                    <div className='flex gap-4'>
                      <Button
                        className='h-40 flex flex-col gap-2'
                        onClick={() => setShowCheckout(true)}
                      >
                        <CreditCardIcon className='size-8' />
                        {t('modals.payins.manual-entry-option')}
                      </Button>
                      <Link
                        href={`/${language}/dashboard/terminal-and-pos/pos`}
                      >
                        <Button className='h-40 flex flex-col gap-2'>
                          <POSIcon className='size-8' />
                          {t('modals.payins.present-to-terminal-reader-option')}
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
