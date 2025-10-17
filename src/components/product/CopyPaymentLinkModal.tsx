'use client';

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useState } from 'react';

type CopyPaymentLinkModalProps = {
  open: boolean;
  onClose: () => void;
  url: string;
};

export const CopyPaymentLinkModal = ({
  open,
  onClose,
  url,
}: CopyPaymentLinkModalProps) => {
  const { t } = useTranslation();

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

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
              className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:data-closed:translate-y-0 sm:data-closed:scale-95'
            >
              <div>
                <div>
                  <DialogTitle
                    as='h3'
                    className='text-base font-semibold text-gray-900'
                  >
                    {t('modals.copy-payment-link.title')}
                  </DialogTitle>
                  <div className='mt-2'>
                    <p className='text-sm text-gray-500'>
                      {t('modals.copy-payment-link.description')}
                    </p>
                  </div>
                </div>
              </div>
              <div className='mt-4 flex items-end gap-x-2 w-full'>
                <Input
                  label={t('modals.copy-payment-link.form.url')}
                  value={url}
                  disabled={true}
                />
                <Button className='h-10' onClick={handleCopy}>
                  {copied
                    ? t('modals.copy-payment-link.form.copied')
                    : t('modals.copy-payment-link.form.copy')}
                </Button>
              </div>
              <div className='mt-5'>
                <Button
                  className='w-full bg-white border border-gray-500 text-gray-500 hover:bg-gray-100'
                  type='button'
                  data-autofocus
                  onClick={onClose}
                >
                  {t('modals.copy-payment-link.form.close')}
                </Button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
