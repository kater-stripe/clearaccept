import { CheckoutProvider, useCheckout } from '@stripe/react-stripe-js';
import { AgnosticElementsProvider } from './AgnosticElementsProvider';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { elementsAppearence } from '@/constants/elementsAppearence';
import {
  type ComponentProps,
  type PropsWithChildren,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useCart } from '@/context/CartContext';
import { useDemoCustomer } from '@/context/DemoCustomerContext';
import { useQuery } from '@tanstack/react-query';
import { createCustomCheckoutSession } from '@/app/api/checkout-sessions/createCustomCheckoutSession';
import {
  loadStripe,
  type StripeExpressCheckoutElementConfirmEvent,
  type StripeCheckoutOptions,
  StripeCheckoutShippingOption,
} from '@stripe/stripe-js';
import type { CurrencyCode } from '@/constants/currencyCodes';
import { useHandleCallbacks } from '@/components/checkout/HandleCallbacks';
import { useDemoMerchant } from '@/context/DemoMerchantContext';

type ElementsCheckoutWithCheckoutSessionsProps = ComponentProps<'div'> & {
  shippingOptionsOverride?: StripeCheckoutShippingOption[];
};

export const ElementsCheckoutWithCheckoutSessions = ({
  children,
  className,
  shippingOptionsOverride,
  ...props
}: ElementsCheckoutWithCheckoutSessionsProps) => {
  const {
    stripePublishableKey,
    stripeSecretKey,
    language,
    currency,
    elementsExpressCheckoutEnabled,
    chargeType,
    secondaryColor,
  } = useDemoConfig();

  const { account } = useDemoMerchant();

  const { items } = useCart();

  const { id: customerId, email: customerEmail } = useDemoCustomer();

  const { returnUrl } = useHandleCallbacks();

  const stripePromise = useMemo(() => {
    if (!stripePublishableKey) {
      return null;
    }

    return loadStripe(stripePublishableKey, {
      betas: ['custom_checkout_adaptive_pricing_2'],
      ...(chargeType === 'direct' ? { stripeAccount: account!.id } : {}),
    });
  }, [stripePublishableKey]);

  const { data: checkoutSession, isFetching: isFetchingCheckoutSession } =
    useQuery({
      queryKey: [
        'checkoutSession',
        stripeSecretKey,
        customerId,
        customerEmail,
        language,
        currency,
        chargeType,
        account!.id,
        shippingOptionsOverride,
        returnUrl,
      ],
      queryFn: () =>
        createCustomCheckoutSession({
          items,
          stripeSecretKey,
          customerId,
          customerEmail,
          language,
          returnUrl,
          currency,
          chargeType,
          accountId: account!.id,
          shippingOptionsOverride,
        }),
      refetchOnWindowFocus: false,
      refetchOnMount: 'always',
      staleTime: 0,
    });

  const optionsWithClientSecret = useMemo<
    StripeCheckoutOptions | undefined
  >(() => {
    if (!checkoutSession?.client_secret || isFetchingCheckoutSession) {
      return;
    }

    return {
      fetchClientSecret: async () => checkoutSession.client_secret!,
      elementsOptions: {
        appearance: {
          ...elementsAppearence,
          variables: {
            ...elementsAppearence.variables,
            colorPrimary: '#171717',
          },
        },
      },
    } satisfies StripeCheckoutOptions;
  }, [checkoutSession?.client_secret, isFetchingCheckoutSession]);

  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [optionsWithClientSecret, elementsExpressCheckoutEnabled]);

  return (
    <div className={`mx-auto max-w-4xl lg:max-w-7xl ${className}`} {...props}>
      {!optionsWithClientSecret ? (
        <LoadingSpinner className='text-black' />
      ) : (
        <CheckoutProvider
          stripe={stripePromise}
          options={{
            ...optionsWithClientSecret,
            // @ts-expect-error - adaptivePricing is a valid property for the checkout options
            adaptivePricing: { allowed: true },
          }}
          key={key}
        >
          <MapCheckoutContextToAgnosticElementsContext>
            {children}
          </MapCheckoutContextToAgnosticElementsContext>
        </CheckoutProvider>
      )}
    </div>
  );
};

type MapCheckoutContextToAgnosticElementsContextProps = PropsWithChildren;

export const MapCheckoutContextToAgnosticElementsContext = ({
  children,
}: MapCheckoutContextToAgnosticElementsContextProps) => {
  const {
    canConfirm,
    total,
    shipping,
    shippingOptions,
    updateShippingOption,
    updateLineItemQuantity,
    lineItems,
    confirm,
    status,
    updatePhoneNumber,
    updateBillingAddress,
    updateShippingAddress,
    // applyPromotionCode,
    // discountAmounts,
    // removePromotionCode,
    currency,
  } = useCheckout();

  const { phone } = useDemoCustomer();
  const [isConfirming, setIsConfirming] = useState(false);
  const { handleStripeCheckoutStatus, handleStripeCheckoutConfirmResult } =
    useHandleCallbacks();
  const { hasSubscriptionInCart } = useCart();

  const onConfirm = async (
    expressCheckoutConfirmEvent?: StripeExpressCheckoutElementConfirmEvent,
  ) => {
    setIsConfirming(true);

    const confirmResult = await confirm({
      redirect: 'if_required',
      expressCheckoutConfirmEvent,
    });

    setIsConfirming(false);
    handleStripeCheckoutConfirmResult(confirmResult);
  };

  useEffect(() => {
    handleStripeCheckoutStatus(status);
  }, [status]);

  useEffect(() => {
    if (!phone) {
      return;
    }

    updatePhoneNumber(phone);
  }, [phone]);

  const { items } = useCart();

  useEffect(() => {
    if (!lineItems) {
      return;
    }

    for (const lineItem of lineItems) {
      const correspondingCartItem = items.find(
        (item) => item.product.name === lineItem.name,
      );

      if (!correspondingCartItem) {
        updateLineItemQuantity({
          lineItem: lineItem.id,
          quantity: 0,
        });
        continue;
      }

      if (lineItem.quantity !== correspondingCartItem.quantity) {
        updateLineItemQuantity({
          lineItem: lineItem.id,
          quantity: correspondingCartItem.quantity,
        });
      }
    }
  }, [items]);

  return (
    <AgnosticElementsProvider
      currency={currency as CurrencyCode}
      isConfirming={isConfirming}
      onConfirm={onConfirm}
      subtotal={total.subtotal.amount}
      tax={
        total.taxExclusive.minorUnitsAmount > 0
          ? total.taxExclusive.amount
          : total.taxInclusive.amount
      }
      total={total.total.amount}
      shippingOptionId={shipping?.shippingOption.id}
      shippingOptions={shippingOptions}
      updateShippingOption={updateShippingOption}
      updateAddress={
        hasSubscriptionInCart ? updateShippingAddress : updateBillingAddress
      }
      canConfirm={canConfirm}
      // applyPromotionCode={applyPromotionCode}
      // discountAmounts={discountAmounts ?? []}
      // discount={total.discount.amount}
      // removePromotionCode={removePromotionCode}
      lineItems={lineItems}
    >
      {children}
    </AgnosticElementsProvider>
  );
};
