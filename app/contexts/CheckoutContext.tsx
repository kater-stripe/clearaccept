'use client';

import React, {createContext, useContext, useState} from 'react';

interface CheckoutContextType {
  stripe: any;
  setStripe: React.Dispatch<React.SetStateAction<any>>;
  elements: any;
  setElements: React.Dispatch<React.SetStateAction<any>>;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(
  undefined
);

interface CheckoutProviderProps {
  children: React.ReactNode;
}

export function CheckoutProvider({children}: CheckoutProviderProps) {
  const [stripe, setStripe] = useState<any>(null);
  const [elements, setElements] = useState<any>(null);

  return (
    <CheckoutContext.Provider
      value={{stripe, setStripe, elements, setElements}}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout(): CheckoutContextType {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}
