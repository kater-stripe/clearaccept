'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { useFakeBills } from '@/hooks/useFakeBills';
import { formatPrice } from '@/utils/formatPrice';
import { createAuthorization } from '@/app/api/issuing/createAuthorization';
import { getCards } from '@/app/api/issuing/getCards';
import type { CurrencyCode } from '@/constants/currencyCodes';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

const PayBillPage = () => {
  const { billId } = useParams<{ billId: string }>();
  const { language, stripeSecretKey } = useDemoConfig();
  const { account } = useDemoMerchant();
  const router = useRouter();
  const { getBillById, markBillAsPaid } = useFakeBills();

  const [selectedCardId, setSelectedCardId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const bill = getBillById(billId);

  // Fetch available cards for the dropdown
  const { data: cards, isLoading: isLoadingCards } = useQuery({
    queryKey: ['cards', account?.id, stripeSecretKey],
    queryFn: () =>
      getCards({
        accountId: account!.id,
        status: 'active',
        stripeSecretKey,
      }),
    enabled: !!account,
  });

  // Determine if dropdown or manual entry is being used
  const isUsingDropdown = selectedCardId !== '';
  const isUsingManualEntry = cardNumber !== '';

  // Find card by last4 digits from manual entry
  const matchedCardFromNumber = useMemo(() => {
    if (!cards || !cardNumber) return null;
    // Extract just digits from the card number
    const digitsOnly = cardNumber.replace(/\s/g, '');
    if (digitsOnly.length < 4) return null;
    // Get last 4 digits
    const last4 = digitsOnly.slice(-4);
    // Find matching card
    return cards.find((card) => card.last4 === last4) || null;
  }, [cards, cardNumber]);

  // The card ID to use for payment (from dropdown or matched from manual entry)
  const effectiveCardId = selectedCardId || matchedCardFromNumber?.id || '';

  const {
    mutate: processPayment,
    isPending: isProcessing,
    error: paymentError,
  } = useMutation({
    mutationFn: createAuthorization,
    onSuccess: (result) => {
      if (result.success) {
        markBillAsPaid(billId);
        setPaymentSuccess(true);
      } else {
        throw new Error(result.message);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!bill || !effectiveCardId || !account) return;

    processPayment({
      amount: bill.amount,
      cardId: effectiveCardId,
      currency: bill.currency,
      merchantName: bill.supplierName,
      accountId: account.id,
      stripeSecretKey,
    });
  };

  const handleCardNumberChange = (value: string) => {
    setCardNumber(value);
    // Clear dropdown selection when typing card number
    if (value && selectedCardId) {
      setSelectedCardId('');
    }
  };

  const handleDropdownChange = (value: string) => {
    setSelectedCardId(value);
    // Clear manual entry when selecting from dropdown
    if (value && cardNumber) {
      setCardNumber('');
      setExpiry('');
      setCvv('');
    }
  };

  const handleExpiryChange = (value: string) => {
    // Remove any non-digit characters except /
    let formatted = value.replace(/[^\d]/g, '');

    // Add slash after MM
    if (formatted.length >= 2) {
      formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
    }

    // Limit to MM/YY format (5 chars max)
    if (formatted.length <= 5) {
      setExpiry(formatted);
    }
  };

  // Loading state while account/bills load
  if (!account) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <LoadingSpinner className='size-8' />
      </div>
    );
  }

  // Bill not found
  if (!bill) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
        <Card className='max-w-md w-full text-center'>
          <ExclamationTriangleIcon className='size-16 text-yellow-500 mx-auto mb-4' />
          <h2 className='text-xl font-bold text-gray-900 mb-2'>Bill not found</h2>
          <p className='text-gray-500'>
            The bill you&apos;re looking for doesn&apos;t exist or has already been processed.
          </p>
        </Card>
      </div>
    );
  }

  // Bill already paid - show invoice details with paid status
  if (bill.status === 'paid') {
    return (
      <div className='min-h-screen bg-gray-50 py-12'>
        <div className='max-w-2xl mx-auto px-4'>
          <Card className='mb-6'>
            <div className='flex items-center gap-4 mb-4'>
              <button
                onClick={() => router.push(`/${language}/dashboard/bills`)}
                className='p-2 hover:bg-gray-100 rounded-md transition-colors'
              >
                <ArrowLeftIcon className='size-5' />
              </button>
              <h1 className='text-2xl font-bold text-gray-900'>Pay invoice</h1>
            </div>
            <div className='border-t border-gray-200 pt-4'>
              <div className='flex justify-between mb-2'>
                <span className='text-gray-500'>Supplier</span>
                <span className='font-medium'>{bill.supplierName}</span>
              </div>
              <div className='flex justify-between mb-2'>
                <span className='text-gray-500'>Invoice #</span>
                <span className='font-medium'>{bill.invoiceNumber}</span>
              </div>
              <div className='flex justify-between mb-4'>
                <span className='text-gray-500'>Due date</span>
                <span className='font-medium'>
                  {new Date(bill.dueDate * 1000).toLocaleDateString(language)}
                </span>
              </div>

              <div className='border-t border-gray-200 pt-4 mb-4'>
                <h3 className='text-sm font-medium text-gray-700 mb-2'>Items</h3>
                {bill.lineItems.map((item, idx) => (
                  <div
                    key={idx}
                    className='flex justify-between text-sm text-gray-500 mb-1'
                  >
                    <span>
                      {item.description} x{item.quantity}
                    </span>
                    <span>
                      {formatPrice(
                        item.quantity * item.unitAmount,
                        language,
                        bill.currency as CurrencyCode,
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <div className='flex justify-between text-lg font-bold border-t border-gray-200 pt-4'>
                <span>Total</span>
                <span>
                  {formatPrice(bill.amount, language, bill.currency as CurrencyCode)}
                </span>
              </div>
            </div>
          </Card>

          <Card className='text-center'>
            <CheckCircleIcon className='size-12 text-green-500 mx-auto mb-3' />
            <h2 className='text-xl font-bold text-gray-900 mb-1'>Paid</h2>
            <p className='text-sm text-gray-500'>This invoice has been paid.</p>
          </Card>
        </div>
      </div>
    );
  }

  // Payment success
  if (paymentSuccess) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
        <Card className='max-w-md w-full text-center'>
          <CheckCircleIcon className='size-16 text-green-500 mx-auto mb-4' />
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>Payment successful</h2>
          <p className='text-gray-500 mb-4'>
            Your payment of{' '}
            {formatPrice(bill.amount, language, bill.currency as CurrencyCode)} has
            been processed.
          </p>
          <p className='text-sm text-gray-400'>You can close this tab.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='max-w-2xl mx-auto px-4'>
        {/* Bill summary */}
        <Card className='mb-6'>
          <div className='flex items-center gap-4 mb-4'>
            <button
              onClick={() => router.push(`/${language}/dashboard/bills`)}
              className='p-2 hover:bg-gray-100 rounded-md transition-colors'
            >
              <ArrowLeftIcon className='size-5' />
            </button>
            <h1 className='text-2xl font-bold text-gray-900'>Pay invoice</h1>
          </div>
          <div className='border-t border-gray-200 pt-4'>
            <div className='flex justify-between mb-2'>
              <span className='text-gray-500'>Supplier</span>
              <span className='font-medium'>{bill.supplierName}</span>
            </div>
            <div className='flex justify-between mb-2'>
              <span className='text-gray-500'>Invoice #</span>
              <span className='font-medium'>{bill.invoiceNumber}</span>
            </div>
            <div className='flex justify-between mb-4'>
              <span className='text-gray-500'>Due date</span>
              <span className='font-medium'>
                {new Date(bill.dueDate * 1000).toLocaleDateString(language)}
              </span>
            </div>

            {/* Line items */}
            <div className='border-t border-gray-200 pt-4 mb-4'>
              <h3 className='text-sm font-medium text-gray-700 mb-2'>Items</h3>
              {bill.lineItems.map((item, idx) => (
                <div
                  key={idx}
                  className='flex justify-between text-sm text-gray-500 mb-1'
                >
                  <span>
                    {item.description} x{item.quantity}
                  </span>
                  <span>
                    {formatPrice(
                      item.quantity * item.unitAmount,
                      language,
                      bill.currency as CurrencyCode,
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className='flex justify-between text-lg font-bold border-t border-gray-200 pt-4'>
              <span>Total</span>
              <span>
                {formatPrice(bill.amount, language, bill.currency as CurrencyCode)}
              </span>
            </div>
          </div>
        </Card>

        {/* Payment form */}
        <Card>
          <h2 className='text-lg font-semibold mb-4'>Payment details</h2>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Card selection dropdown - only show when signed in */}
            {account && (
              <>
                <div className='grow w-full'>
                  <label
                    htmlFor='card-select'
                    className='block mb-2 text-sm font-medium text-gray-700'
                  >
                    Select card
                  </label>
                  {isLoadingCards ? (
                    <select
                      id='card-select'
                      disabled
                      className='w-full p-2 border border-gray-300 rounded-md text-gray-400 bg-gray-50 cursor-not-allowed'
                    >
                      <option>Loading cards...</option>
                    </select>
                  ) : cards && cards.length > 0 ? (
                    <select
                      id='card-select'
                      value={selectedCardId}
                      onChange={(e) => handleDropdownChange(e.target.value)}
                      disabled={isUsingManualEntry}
                      className={`w-full p-2 border border-gray-300 rounded-md text-gray-700 bg-white focus:ring-2 focus:ring-brand-primary focus:border-brand-primary ${
                        isUsingManualEntry ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <option value=''>Select a card...</option>
                      {cards.map((card) => (
                        <option key={card.id} value={card.id}>
                          {card.cardholder?.name || 'Unknown'} - ****{card.last4} (
                          {card.brand})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className='text-sm text-gray-500'>
                      No active cards available. Please create a card first.
                    </p>
                  )}
                </div>

                {/* Or separator */}
                <div className='relative'>
                  <div className='absolute inset-0 flex items-center'>
                    <div className='w-full border-t border-gray-300' />
                  </div>
                  <div className='relative flex justify-center text-sm'>
                    <span className='px-2 bg-white text-gray-500'>or</span>
                  </div>
                </div>
              </>
            )}

            {/* Manual card entry */}
            <div className={isUsingDropdown ? 'opacity-50' : ''}>
              <Input
                label='Card number'
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder='4242 4242 4242 4242'
                disabled={isUsingDropdown}
              />
            </div>

            <div className={`grid grid-cols-2 gap-4 ${isUsingDropdown ? 'opacity-50' : ''}`}>
              <Input
                label='Expiry (MM/YY)'
                value={expiry}
                onChange={handleExpiryChange}
                placeholder='12/25'
                disabled={isUsingDropdown}
              />
              <Input
                label='CVV'
                value={cvv}
                onChange={setCvv}
                placeholder='123'
                type='password'
                disabled={isUsingDropdown}
              />
            </div>

            {paymentError && (
              <div className='text-red-500 text-sm bg-red-50 p-3 rounded-md'>
                {paymentError instanceof Error
                  ? paymentError.message
                  : 'Payment failed. Please try again.'}
              </div>
            )}

            <Button
              type='submit'
              disabled={isProcessing || !effectiveCardId}
              className='w-full'
            >
              {isProcessing ? (
                <span className='flex items-center gap-2'>
                  <LoadingSpinner className='size-4' />
                  Processing...
                </span>
              ) : (
                `Pay ${formatPrice(bill.amount, language, bill.currency as CurrencyCode)}`
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default PayBillPage;
