'use client';

import {useCheckout} from '@/app/contexts/CheckoutContext';
import {useConfigContext} from '@/app/contexts/ConfigContext';
import {useState, useEffect} from 'react';
import {useTranslation} from 'react-i18next';

interface OrderSummaryProps {
  subtotal: number;
  tax: number;
  setSubtotal: (subtotal: number) => void;
  onOrderConfirm: (stripe: any, checkout: any) => void;
  isProcessing: boolean;
}

export default function OrderSummary({
  subtotal,
  tax,
  setSubtotal,
  onOrderConfirm,
  isProcessing,
}: OrderSummaryProps) {
  const {t} = useTranslation();
  const {stripe, elements} = useCheckout();
  const {settings} = useConfigContext();
  const [amount, setAmount] = useState(4000);

  useEffect(() => {
    setSubtotal(amount);
  }, [amount, setSubtotal]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = Math.round(
      parseFloat(e.target.value) * (settings?.currency === 'jpy' ? 1 : 100)
    );

    if (newAmount > 0) {
      setAmount(newAmount);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.error('Stripe has not been initialized');
      return;
    }

    onOrderConfirm(stripe, elements);
  };

  return (
    <div className="mx-auto max-w-sm rounded-lg bg-white p-6">
      <h2 className="mb-4 text-2xl font-bold text-gray-800">
        {t('checkout.elements.orderSummary')}
      </h2>
      <div className="mb-4">
        <label
          htmlFor="amount"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          {t('checkout.elements.classCharge')}:
        </label>
        <div className="flex items-center">
          <input
            type="number"
            id="amount"
            value={amount / (settings?.currency === 'jpy' ? 1 : 100)}
            onChange={handleAmountChange}
            min="1"
            step="1"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <span className="ml-2 text-gray-600">
            {settings?.currency.toUpperCase()}
          </span>
        </div>
      </div>
      <div className="mb-2 flex justify-between text-gray-600">
        <span>{t('checkout.elements.tax')}:</span>
        <span>
          {(tax / (settings?.currency === 'jpy' ? 1 : 100)).toFixed(
            settings?.currency === 'jpy' ? 0 : 2
          )}{' '}
          {settings?.currency.toUpperCase()}
        </span>
      </div>
      <div className="mb-6 flex justify-between text-lg font-bold text-gray-800">
        <span>{t('checkout.elements.total')}:</span>
        <span>
          {(
            (subtotal + tax) /
            (settings?.currency === 'jpy' ? 1 : 100)
          ).toFixed(settings?.currency === 'jpy' ? 0 : 2)}{' '}
          {settings?.currency.toUpperCase()}
        </span>
      </div>
      <button
        onClick={handleSubmit}
        disabled={isProcessing}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white transition duration-150 ease-in-out hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
      >
        {isProcessing ? t('loading') : t('checkout.elements.chargeCustomer')}
      </button>
    </div>
  );
}
