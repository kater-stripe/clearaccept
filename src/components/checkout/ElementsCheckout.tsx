import { AddressElement, PaymentElement } from '@stripe/react-stripe-js';
import { OrderSummary } from './OrderSummary';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useCart } from '@/context/CartContext';
import { useDemoCustomer } from '@/context/DemoCustomerContext';
import { useTranslation } from 'react-i18next';
import { useHandleCallbacks } from './HandleCallbacks';
import { LineBreak } from './LineBreak';
import { ShippingOptions } from './ShippingOptions';
import { useAgnosticElements } from './AgnosticElementsProvider';
import { ExpressCheckout } from './ExpressCheckout';

export const ElementsCheckout = () => {
  const { updateAddress, shippingOptions } = useAgnosticElements();

  const {
    elementsStyle,
    checkoutMethod,
    elementsAddressFormEnabled,
    elementsExpressCheckoutEnabled,
  } = useDemoConfig();

  const { hasSubscriptionInCart } = useCart();

  const { email, phone, name } = useDemoCustomer();

  const { t } = useTranslation();

  const { errorMessage } = useHandleCallbacks();

  return (
    <div className='@container'>
      <div className='grid grid-cols-1 @5xl:grid-cols-12 gap-x-8 gap-y-10 @5xl:gap-x-12'>
        {/* Left - Checkout Form */}
        <div className='@5xl:col-span-8'>
          {errorMessage && (
            <div className='my-4 text-center text-red-500'>{errorMessage}</div>
          )}
          {elementsExpressCheckoutEnabled && (
            <ExpressCheckout>
              <LineBreak messageTranslationKey={'checkout.or'} />
            </ExpressCheckout>
          )}
          {(elementsAddressFormEnabled ||
            checkoutMethod === 'elements-checkout-with-checkout-sessions') && (
            <>
              <fieldset>
                <legend className='text-lg font-bold text-gray-900'>
                  {hasSubscriptionInCart || shippingOptions.length === 0
                    ? t('checkout.billing_address_header')
                    : t('checkout.shipping_address_header')}
                </legend>
                <div className='my-4'>
                  <AddressElement
                    id='address-element'
                    key={hasSubscriptionInCart ? 'billing' : 'shipping'}
                    options={{
                      mode: hasSubscriptionInCart ? 'billing' : 'shipping',
                    }}
                    onChange={({ value }) => updateAddress?.(value)}
                  />
                </div>
              </fieldset>
              <LineBreak />
            </>
          )}
          {!hasSubscriptionInCart && shippingOptions.length > 0 && (
            <>
              <fieldset>
                <legend className='text-lg font-bold text-gray-900'>
                  {t('checkout.shipping.title')}
                </legend>
                <div className='my-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4'>
                  <ShippingOptions />
                </div>
              </fieldset>
              <LineBreak />
            </>
          )}
          <fieldset>
            <legend className='text-lg font-bold text-gray-900 mb-4'>
              {t('checkout.payments_header')}
            </legend>
            <div>
              <PaymentElement
                id='payment-element'
                options={{
                  layout: elementsStyle,
                  /**
                   * Default values are not provided via. the client when using Elements w/ Checkout Sessions.
                   */
                  ...(checkoutMethod === 'elements-checkout'
                    ? {
                        defaultValues: {
                          billingDetails: {
                            email,
                            phone,
                            name,
                          },
                        },
                      }
                    : {}),
                  /**
                   * There was some general bugginess with the billing address field when using Elements w/ Checkout Sessions.
                   * This should be revisited in the future.
                   */
                  ...(checkoutMethod ===
                  'elements-checkout-with-checkout-sessions'
                    ? {
                        fields: {
                          ...(!hasSubscriptionInCart
                            ? {
                                billingDetails: {
                                  name: 'never',
                                  address: {
                                    city: 'never',
                                    country: 'never',
                                    line1: 'never',
                                    line2: 'never',
                                    postalCode: 'never',
                                    state: 'never',
                                  },
                                },
                              }
                            : {}),
                        },
                      }
                    : {}),
                }}
              />
            </div>
          </fieldset>
        </div>

        {/* Right - Order Summary */}
        <div className='@5xl:col-span-4 relative'>
          <OrderSummary />
        </div>
      </div>
    </div>
  );
};
