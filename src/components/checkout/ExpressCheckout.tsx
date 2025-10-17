import { useState, type PropsWithChildren } from 'react';
import { ExpressCheckoutElement } from '@stripe/react-stripe-js';
import { useAgnosticElements } from './AgnosticElementsProvider';

type ExpressCheckoutProps = PropsWithChildren;

export const ExpressCheckout = ({ children }: ExpressCheckoutProps) => {
  const { onConfirm } = useAgnosticElements();

  const [
    hasAvailableExpressPaymentMethods,
    setHasAvailableExpressPaymentMethods,
  ] = useState(false);

  return (
    <>
      <ExpressCheckoutElement
        id='express-checkout-element'
        className={!hasAvailableExpressPaymentMethods ? 'hidden' : ''}
        onConfirm={onConfirm}
        onReady={({ availablePaymentMethods }) => {
          if (availablePaymentMethods === undefined) {
            setHasAvailableExpressPaymentMethods(false);
            return;
          }

          if (
            Object.values(availablePaymentMethods).some(
              (isPaymentMethodAvailable) => isPaymentMethodAvailable,
            )
          ) {
            setHasAvailableExpressPaymentMethods(true);
          }
        }}
      />
      {hasAvailableExpressPaymentMethods && <>{children}</>}
    </>
  );
};
