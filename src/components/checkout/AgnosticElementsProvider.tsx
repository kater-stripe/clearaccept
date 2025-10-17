import type {
  ShippingAddress,
  StripeCheckoutUpdateShippingOptionResult,
  StripeCheckoutShippingOption,
  StripeCheckoutLineItem,
} from '@stripe/stripe-js';
import type { CurrencyCode } from '@/constants/currencyCodes';

import { createContext, useContext, type PropsWithChildren } from 'react';

type AgnosticElementsContextProps = {
  currency: CurrencyCode;
  onConfirm: () => Promise<void>;
  isConfirming: boolean;
  updateAddress: (address: ShippingAddress) => void;
  shippingOptionId: string | undefined;
  shippingOptions: StripeCheckoutShippingOption[];
  updateShippingOption: (
    shippingOptionId: string,
  ) => void | Promise<StripeCheckoutUpdateShippingOptionResult>;
  canConfirm: boolean;
  tax: number | string;
  total: number | string;
  subtotal: number | string;
  /**
   * Do not assume `lineItems` is always available.
   * Unlike the other parameters, this will be provided in Elements with Checkout Sessions only.
   */
  lineItems: StripeCheckoutLineItem[] | null;
};

const AgnosticElementsContext =
  createContext<AgnosticElementsContextProps | null>(null);

export const AgnosticElementsProvider = ({
  children,
  ...context
}: PropsWithChildren<AgnosticElementsContextProps>) => {
  return (
    <AgnosticElementsContext.Provider value={context}>
      {children}
    </AgnosticElementsContext.Provider>
  );
};

export const useAgnosticElements = () => {
  const context = useContext(AgnosticElementsContext);

  if (!context) {
    throw new Error(
      '`useAgnosticElements` must be used within a `AgnosticElementsProvider`',
    );
  }

  return context;
};
