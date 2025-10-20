'use client';

import { useCart } from '@/context/CartContext';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { formatPrice } from '@/utils/formatPrice';
import { useTranslation } from 'react-i18next';
import { CartItemList } from '../cart/CartItemList';
// import { PromotionCodeArea } from './PromotionCodeArea';
import { CurrencySelectorElement } from '@stripe/react-stripe-js';
import { useAgnosticElements } from './AgnosticElementsProvider';

export const OrderSummary = () => {
  const {
    shippingOptionId,
    shippingOptions,
    isConfirming,
    onConfirm,
    canConfirm,
    tax,
    total,
    subtotal,
    currency,
    lineItems,
  } = useAgnosticElements();

  const { language, elementsAddressFormEnabled, checkoutMethod } =
    useDemoConfig();
  const { items, hasSubscriptionInCart } = useCart();
  const { onrampDiscountEligible } = useDemoConfig();
  const { t } = useTranslation();

  const shippingCost =
    shippingOptions.find((option) => option.id === shippingOptionId)?.amount ??
    0;

  return (
    <div className='sticky top-0 -mt-10 pt-10 z-10'>
      <div>
        <h2 className='text-lg font-bold text-gray-900'>
          {t('checkout.order_summary.title')}
        </h2>
        <div className='mt-4 rounded-lg border border-gray-20 bg-white shadow-sm'>
          <CartItemList lineItems={lineItems ?? undefined} />
          <div>
            <dl className='space-y-4 px-4 py-6 sm:px-6 text-gray-900'>
              {/* <PromotionCodeArea className='pb-6 border-b border-gray-200' /> */}
              {checkoutMethod === 'elements-checkout-with-checkout-sessions' &&
                !hasSubscriptionInCart && (
                  <CurrencySelectorElement id='currency-selector-element' />
                )}
              <div className='flex items-center justify-between'>
                <dt className='text-sm font-bold'>
                  {t('checkout.order_summary.subtotal')}
                </dt>
                <dd className='text-sm font-bold text-gray-900'>
                  {formatPrice(subtotal, language, currency)}
                </dd>
              </div>
              {onrampDiscountEligible && (
                <div className='flex items-center justify-between'>
                  <dt className='text-sm font-bold'>
                    {t('checkout.order_summary.discount')}
                  </dt>
                  <dd className='text-sm font-bold text-green-600'>
                    -{formatPrice(Math.floor((subtotal as any) * 0.2), language, currency)}
                  </dd>
                </div>
              )}
              {shippingOptions.length > 0 && (
                <div className='flex items-center justify-between'>
                  <dt className='text-sm font-bold'>
                    {t('checkout.order_summary.shipping')}
                  </dt>
                  <dd className='text-sm font-bold text-gray-900'>
                    {shippingOptionId
                      ? formatPrice(shippingCost, language, currency)
                      : t('checkout.order_summary.shipping_not_selected')}
                  </dd>
                </div>
              )}
              {elementsAddressFormEnabled && (
                <div className='flex items-center justify-between'>
                  <dt className='text-sm font-bold'>
                    {t('checkout.order_summary.taxes')}
                  </dt>
                  <dd className='text-sm font-bold text-gray-900'>
                    {formatPrice(tax, language, currency)}
                  </dd>
                </div>
              )}
              <div className='flex items-center justify-between border-t border-gray-200 pt-6'>
                <dt className='text-base font-bold'>
                  {t('checkout.order_summary.total')}
                </dt>
                <dd className='text-base font-bold text-gray-900'>
                  {formatPrice(total, language, currency)}
                </dd>
              </div>
            </dl>
          </div>

          <div className='border-t border-gray-200 px-4 py-6 sm:px-6'>
            <button
              type='button'
              data-testid='confirm-order-button'
              onClick={() => {
                // Don't pass the Synthetic Mouse Event to `onConfirm`.
                onConfirm();
              }}
              disabled={items.length === 0 || !canConfirm || isConfirming}
              className='w-full flex items-center justify-center rounded-md bg-brand-secondary px-4 py-3 text-base font-bold text-brand-secondary-contrasting-text shadow-sm hover:bg-brand-secondary-accent focus:outline-none focus:ring-2 focus:ring-brand-secondary-accent focus:ring-offset-2 focus:ring-offset-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isConfirming ? (
                <span>{t('checkout.order_summary.processing')}</span>
              ) : (
                <span>{t('checkout.order_summary.confirm_order')}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
