'use client';

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import {
  ArrowRightIcon,
  BanknotesIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import type { Stripe } from 'stripe';

type MoveMoneyModalProps = {
  open: boolean;
  onClose: () => void;
  financialAccount: Stripe.V2.MoneyManagement.FinancialAccount;
  onSelectTransfer: () => void;
  onSelectPayment: () => void;
};

export const MoveMoneyModal = ({
  open,
  onClose,
  financialAccount,
  onSelectTransfer,
  onSelectPayment,
}: MoveMoneyModalProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} className='relative z-10'>
      <DialogBackdrop
        transition
        className='fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in'
      />

      <div className='fixed inset-0 z-10 w-screen overflow-y-auto'>
        <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
          <DialogPanel
            transition
            className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in sm:my-8 sm:w-full sm:max-w-md sm:p-6 sm:data-closed:translate-y-0 sm:data-closed:scale-95'
          >
            <div>
              <DialogTitle
                as='h3'
                className='text-lg font-semibold text-gray-900'
              >
                {t('modals.move-money.title')}
              </DialogTitle>
              <p className='mt-1 text-sm text-gray-500'>
                {t('modals.move-money.description', {
                  accountName: financialAccount.display_name,
                })}
              </p>
            </div>

            <div className='mt-6 space-y-3'>
              {/* Transfer Option */}
              <button
                type='button'
                onClick={() => {
                  onClose();
                  onSelectTransfer();
                }}
                className='w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-brand-primary hover:bg-gray-50 transition-colors text-left group'
              >
                <div className='flex-shrink-0 w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center'>
                  <BanknotesIcon className='w-5 h-5 text-brand-primary' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium text-gray-900'>
                    {t('modals.move-money.transfer.title')}
                  </p>
                  <p className='text-sm text-gray-500'>
                    {t('modals.move-money.transfer.description')}
                  </p>
                </div>
                <ArrowRightIcon className='w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors' />
              </button>

              {/* Payment Option */}
              <button
                type='button'
                onClick={() => {
                  onClose();
                  onSelectPayment();
                }}
                className='w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-brand-primary hover:bg-gray-50 transition-colors text-left group'
              >
                <div className='flex-shrink-0 w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center'>
                  <CreditCardIcon className='w-5 h-5 text-brand-primary' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium text-gray-900'>
                    {t('modals.move-money.payment.title')}
                  </p>
                  <p className='text-sm text-gray-500'>
                    {t('modals.move-money.payment.description')}
                  </p>
                </div>
                <ArrowRightIcon className='w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors' />
              </button>
            </div>

            <div className='mt-6'>
              <button
                type='button'
                onClick={onClose}
                className='w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary'
              >
                {t('modals.move-money.cancel')}
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};
