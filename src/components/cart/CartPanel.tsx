'use client';

import { Fragment } from 'react';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/context/CartContext';
import { CartItemList } from './CartItemList';
import { formatPrice } from '@/utils/formatPrice';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { CheckoutButton } from './CheckoutButton';

export const CartPanel = () => {
  const { language, currency } = useDemoConfig();
  const { isCartOpen, closeCart, subtotal } = useCart();
  const { t } = useTranslation();

  return (
    <Transition show={isCartOpen} as={Fragment}>
      <Dialog as='div' className='relative z-10' onClose={closeCart}>
        <TransitionChild
          as={Fragment}
          enter='ease-in-out duration-500'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in-out duration-500'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-gray-500/75 transition-opacity' />
        </TransitionChild>

        <div className='fixed inset-0 overflow-hidden'>
          <div className='absolute inset-0 overflow-hidden'>
            <div className='pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10'>
              <TransitionChild
                as={Fragment}
                enter='transform transition ease-in-out duration-500 sm:duration-700'
                enterFrom='translate-x-full'
                enterTo='translate-x-0'
                leave='transform transition ease-in-out duration-500 sm:duration-700'
                leaveFrom='translate-x-0'
                leaveTo='translate-x-full'
              >
                <DialogPanel className='pointer-events-auto w-screen max-w-md'>
                  <div className='flex h-full flex-col overflow-y-scroll bg-white shadow-xl'>
                    <div className='flex-1 overflow-y-auto px-4 py-6 sm:px-6'>
                      <div className='flex items-start justify-between'>
                        <DialogTitle className='text-lg font-medium text-gray-900'>
                          {t('cartPanel.title')}
                        </DialogTitle>
                        <div className='ml-3 flex h-7 items-center'>
                          <button
                            type='button'
                            className='relative -m-2 p-2 text-gray-400 hover:text-gray-500'
                            onClick={closeCart}
                          >
                            <span className='absolute -inset-0.5' />
                            <span className='sr-only'>
                              {t('cartPanel.closePanel')}
                            </span>
                            <XMarkIcon className='h-6 w-6' aria-hidden='true' />
                          </button>
                        </div>
                      </div>

                      <div className='mt-8'>
                        <div className='flow-root'>
                          <CartItemList />
                        </div>
                      </div>
                    </div>

                    <div className='border-t border-gray-200 px-4 py-6 sm:px-6'>
                      <div className='flex justify-between text-base font-medium text-gray-900'>
                        <p>{t('cartPanel.subtotal')}</p>
                        <p>{formatPrice(subtotal, language, currency)}</p>
                      </div>
                      <p className='mt-0.5 text-sm text-gray-500'>
                        {t('cartPanel.shippingTaxes')}
                      </p>
                      <div className='mt-6 flex justify-center text-center'>
                        <CheckoutButton />
                      </div>
                      <div className='mt-4 flex justify-center text-center text-sm text-gray-500'>
                        <p>
                          {t('cartPanel.or')}{' '}
                          <button
                            type='button'
                            className='font-medium text-gray-500 hover:text-gray-900'
                            onClick={closeCart}
                          >
                            {t('cartPanel.continueShopping')}
                            <span aria-hidden='true'> &rarr;</span>
                          </button>
                        </p>
                      </div>
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
