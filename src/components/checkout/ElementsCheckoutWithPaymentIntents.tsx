import { useDemoConfig } from '@/context/DemoConfigContext';
import { AgnosticElementsProvider } from './AgnosticElementsProvider';
import { useCart } from '@/context/CartContext';
import { useDemoCustomer } from '@/context/DemoCustomerContext';
import {
  ComponentProps,
  type PropsWithChildren,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  loadStripe,
  type ShippingAddress,
  type StripeCheckoutShippingOption,
  type StripeElementLocale,
  type StripeElementsOptions,
} from '@stripe/stripe-js';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createCustomerSession } from '@/app/api/customer-sessions/createCustomerSession';
import { elementsAppearence } from '@/constants/elementsAppearence';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { calculateTax } from '@/app/api/tax-calculations/calculateTax';
import { formatPrice } from '@/utils/formatPrice';
import { useHandleCallbacks } from './HandleCallbacks';
import { isShippingAddressComplete } from '@/utils/isShippingAddressComplete';
import { createPaymentIntent } from '@/app/api/payment-intents/createPaymentIntent';
import { createSubscription } from '@/app/api/subscriptions/createSubscription';
import { reportPayment } from '@/app/api/payment-records/reportPayment';
import { useDemoMerchant } from '@/context/DemoMerchantContext';

type ElementsCheckoutWithPaymentIntentsProps = ComponentProps<'div'> & {
  shippingOptionsOverride?: StripeCheckoutShippingOption[];
};

export const ElementsCheckoutWithPaymentIntents = ({
  children,
  shippingOptionsOverride,
  className,
  ...props
}: ElementsCheckoutWithPaymentIntentsProps) => {
  const {
    currency,
    language,
    stripeSecretKey,
    stripePublishableKey,
    customPaymentMethods,
    elementsExpressCheckoutEnabled,
    chargeType,
    cryptoEnabled,
  } = useDemoConfig();
  const { subtotal, hasSubscriptionInCart } = useCart();
  const { isSignedIn, id: customerId } = useDemoCustomer();
  const { secondaryColor } = useDemoConfig();

  const { account } = useDemoMerchant();

  const stripePromise = useMemo(() => {
    if (!stripePublishableKey) {
      return null;
    }

    return loadStripe(stripePublishableKey, {
      ...(chargeType === 'direct' ? { stripeAccount: account!.id } : {}),
    });
  }, [stripePublishableKey]);

  const { data: customerSession, isFetching: isFetchingCustomerSession } =
    useQuery({
      queryKey: [
        'customerSession',
        customerId,
        stripeSecretKey,
        chargeType,
        account!.id,
      ],
      queryFn: () =>
        createCustomerSession({
          stripeSecretKey,
          customerId: customerId!,
          chargeType,
          accountId: account!.id,
        }),
      enabled: isSignedIn,
      refetchOnWindowFocus: false,
      refetchOnMount: 'always',
      staleTime: 0,
    });

  const options = useMemo<StripeElementsOptions | undefined>(() => {
    if (
      isSignedIn &&
      (isFetchingCustomerSession || customerSession === undefined)
    ) {
      return;
    }

    return {
      mode: hasSubscriptionInCart ? 'subscription' : 'payment',
      amount: subtotal,
      currency,
      appearance: {
        ...elementsAppearence,
        variables: {
          ...elementsAppearence.variables,
          colorPrimary: '#171717',
        },
      },
      locale: language as StripeElementLocale,
      customerSessionClientSecret: isSignedIn
        ? customerSession?.client_secret
        : undefined,
      ...(cryptoEnabled === false && {
        excludedPaymentMethodTypes: ['crypto'],
      }),
      customPaymentMethods: customPaymentMethods.map((id) => ({
        id,
        options: {
          type: 'static',
        },
      })),
      ...(isSignedIn
        ? {
            setup_future_usage: 'off_session',
          }
        : {}),
      ...(chargeType === 'destination-on-behalf-of'
        ? {
            onBehalfOf: account!.id,
          }
        : {}),
    } satisfies StripeElementsOptions;
  }, [
    currency,
    language,
    customerSession?.client_secret,
    isSignedIn,
    hasSubscriptionInCart,
    customPaymentMethods,
    cryptoEnabled,
  ]);

  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [options, elementsExpressCheckoutEnabled]);

  return (
    <div className={`mx-auto max-w-4xl lg:max-w-7xl ${className}`} {...props}>
      {!options ? (
        <LoadingSpinner className='text-black' />
      ) : (
        <Elements stripe={stripePromise} options={options} key={key}>
          <MapElementsContextToAgnosticElementsContext
            shippingOptionsOverride={shippingOptionsOverride}
          >
            {children}
          </MapElementsContextToAgnosticElementsContext>
        </Elements>
      )}
    </div>
  );
};

type MapElementsContextToAgnosticElementsContextProps = PropsWithChildren<{
  shippingOptionsOverride?: StripeCheckoutShippingOption[];
}>;

const MapElementsContextToAgnosticElementsContext = ({
  children,
  shippingOptionsOverride,
}: MapElementsContextToAgnosticElementsContextProps) => {
  const router = useRouter();
  const { currency, country, language, stripeSecretKey, chargeType } =
    useDemoConfig();
  const { id: customerId, email: customerEmail } = useDemoCustomer();
  const { subtotal, hasSubscriptionInCart, items } = useCart();
  const { account } = useDemoMerchant();

  const [isConfirming, setIsConfirming] = useState(false);
  const { t } = useTranslation();
  const { onrampDiscountEligible, configure } = useDemoConfig();

  const stripe = useStripe();
  const elements = useElements();

  const {
    data: taxCalculation,
    mutate: mutateTaxCalculation,
    isPending: taxCalculationPending,
  } = useMutation({
    mutationFn: calculateTax,
    onSuccess: (result) => {
      console.info(`Inclusive tax: ${result.tax_amount_inclusive ?? 0}
Exclsuive tax: ${result.tax_amount_exclusive ?? 0}`);
    },
  });

  const { mutate: mutateReportPayment } = useMutation({
    mutationFn: reportPayment,
  });

  const shippingOptions: StripeCheckoutShippingOption[] =
    shippingOptionsOverride ??
    (hasSubscriptionInCart
      ? []
      : ([
          {
            id: 'standard',
            minorUnitsAmount: 850,
            amount: formatPrice(850, language, currency),
            displayName: 'checkout.shipping.standard.title',
            currency,
            deliveryEstimate: {
              minimum: {
                unit: 'day',
                value: 5,
              },
              maximum: {
                unit: 'day',
                value: 7,
              },
            },
          },
          {
            id: 'express',
            minorUnitsAmount: 1500,
            amount: formatPrice(1500, language, currency),
            displayName: 'checkout.shipping.priority.title',
            currency,
            deliveryEstimate: {
              minimum: {
                unit: 'day',
                value: 2,
              },
              maximum: {
                unit: 'day',
                value: 3,
              },
            },
          },
        ] as const));

  const [shippingOption, setShippingOption] = useState<
    (typeof shippingOptions)[number]['id'] | undefined
  >(shippingOptions?.[0]?.id);

  const shippingCost =
    shippingOptions.find((option) => option.id === shippingOption)
      ?.minorUnitsAmount ?? 0;

  const taxAmount =
    (taxCalculation?.tax_amount_inclusive ?? 0) +
    (taxCalculation?.tax_amount_exclusive ?? 0);

  const {
    hasCallbackParameters,
    errorMessage,
    setErrorMessage,
    handlePaymentIntent,
    successUrl,
  } = useHandleCallbacks();

  /**
   * Ensures the `amount` is appropriately updated with the tax and shipping cost.
   * This is especially important to ensure the correct `amount` is reflected in Express Checkout.
   */
  useEffect(() => {
    if (elements === null) {
      return;
    }

    const amount =
      Math.max(
        0,
        onrampDiscountEligible
          ? subtotal - Math.floor(subtotal * 0.2)
          : subtotal,
      ) +
      (taxCalculation?.tax_amount_exclusive ?? 0) +
      shippingCost;

    if (amount <= 0) {
      return;
    }

    elements.update({
      amount,
    });
  }, [
    elements,
    subtotal,
    taxCalculation,
    shippingCost,
    onrampDiscountEligible,
  ]);

  const onConfirm = async () => {
    if (elements === null || stripe == null) {
      return;
    }

    setIsConfirming(true);

    const { submit } = elements;

    const { error: submitError, selectedPaymentMethod } = await submit();

    if (submitError !== undefined) {
      setErrorMessage(submitError.message ?? t('payment_status.error'));
      setIsConfirming(false);

      return;
    }

    if (selectedPaymentMethod?.startsWith('cpmt_')) {
      await mutateReportPayment({
        customPaymentMethodId: selectedPaymentMethod,
        amount: total,
        currency,
        stripeSecretKey,
        customerId,
        chargeType,
        accountId: account!.id,
      });

      router.push(successUrl);
      return;
    }

    if (hasSubscriptionInCart) {
      mutateCreateSubscription({
        taxAmount: taxCalculation?.tax_amount_exclusive ?? 0,
        customerId,
        customerEmail,
        items,
        currency,
        stripeSecretKey,
        chargeType,
        accountId: account!.id,
      });
    } else {
      mutateCreatePaymentIntent({
        currency,
        customerEmail,
        customerId,
        applyOnrampDiscount: onrampDiscountEligible,
        taxAmount: taxCalculation?.tax_amount_exclusive ?? 0,
        shippingCost,
        items,
        stripeSecretKey,
        chargeType,
        accountId: account!.id,
      });
    }
  };

  const [shippingAddress, setShippingAddress] = useState<
    ShippingAddress | undefined
  >(undefined);

  /**
   * Calculates tax when the shipping address or cart subtotal changes.
   */
  useEffect(() => {
    if (!isShippingAddressComplete(shippingAddress)) {
      return;
    }

    mutateTaxCalculation({
      currency,
      items,
      shippingAddress: {
        city: shippingAddress?.address.city,
        country: shippingAddress?.address.country ?? country ?? '',
        line1: shippingAddress?.address.line1,
        line2: shippingAddress?.address.line2,
        postal_code: shippingAddress?.address.postal_code,
        state: shippingAddress?.address.state,
      },
      stripeSecretKey,
      chargeType,
      accountId: account!.id,
    });
  }, [shippingAddress, subtotal]);

  const { mutate: mutateCreatePaymentIntent } = useMutation({
    mutationFn: createPaymentIntent,
    onSuccess: async (result) => {
      if (result === undefined) {
        return;
      }

      if (elements === null || stripe === null) {
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret: result.client_secret!,
        confirmParams: {
          return_url: `${window.location.origin}${window.location.pathname}`,
          payment_method_data: {
            allow_redisplay: 'always',
            billing_details: {
              email: customerEmail,
            },
          },
        },
        redirect: 'if_required',
      });

      if (error?.message) {
        setErrorMessage(error.message);
        setIsConfirming(false);

        return;
      }

      if (paymentIntent !== undefined) {
        handlePaymentIntent(paymentIntent);
      }
    },
  });

  const { mutate: mutateCreateSubscription } = useMutation({
    mutationFn: createSubscription,
    mutationKey: ['createSubscription'],
    onSuccess: async (result) => {
      if (result === undefined) {
        return;
      }

      if (elements === null || stripe === null) {
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret: result.latest_invoice.confirmation_secret!.client_secret!,
        confirmParams: {
          return_url: `${window.location.origin}${window.location.pathname}`,
          payment_method_data: {
            allow_redisplay: 'always',
            billing_details: {
              email: customerEmail,
            },
          },
        },
        redirect: 'if_required',
      });

      if (error?.message) {
        setErrorMessage(error.message);
        setIsConfirming(false);

        return;
      }

      if (paymentIntent !== undefined) {
        handlePaymentIntent(paymentIntent);
      }
    },
  });

  const canConfirm = !taxCalculationPending;

  const discountedSubtotal = onrampDiscountEligible
    ? Math.max(0, subtotal - Math.floor(subtotal * 0.2))
    : subtotal;
  const total =
    discountedSubtotal +
    shippingCost +
    (taxCalculation?.tax_amount_exclusive ?? 0);

  return (
    <AgnosticElementsProvider
      currency={currency}
      onConfirm={onConfirm}
      isConfirming={isConfirming}
      shippingOptionId={shippingOption}
      shippingOptions={shippingOptions}
      canConfirm={canConfirm}
      tax={taxAmount}
      total={total}
      subtotal={subtotal}
      updateShippingOption={setShippingOption}
      updateAddress={setShippingAddress}
      lineItems={null}
    >
      {children}
    </AgnosticElementsProvider>
  );
};
