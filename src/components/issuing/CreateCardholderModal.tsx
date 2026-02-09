'use client';

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useEffect, useState } from 'react';
import { createCardholder as createCardholderAction } from '@/app/api/issuing/createCardholder';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type CreateCardholderModalProps = {
  open: boolean;
  onClose: () => void;
};

export const CreateCardholderModal = ({
  open,
  onClose,
}: CreateCardholderModalProps) => {
  const { t } = useTranslation();
  const { account } = useDemoMerchant();
  const { stripeSecretKey } = useDemoConfig();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [type, setType] = useState<'individual' | 'company'>('individual');
  const [city, setCity] = useState('');
  const [line1, setLine1] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [state, setState] = useState('');

  const country = account?.identity?.country?.toUpperCase() ?? 'GB';

  /**
   * Formats a phone number as the user types.
   * Accepts digits and a leading +, groups digits for readability.
   * e.g. "+44 7911 123 456" or "+1 555 123 4567"
   */
  const formatPhoneDisplay = (raw: string): string => {
    // Keep only digits and a leading +
    let cleaned = raw.replace(/[^\d+]/g, '');
    // Ensure + only appears at the start
    if (cleaned.includes('+')) {
      cleaned = '+' + cleaned.replace(/\+/g, '');
    }

    // Cap at 12 digits (covers UK +44 + 10 digits, US +1 + 10, etc.)
    const digitsOnly = cleaned.replace(/\+/, '');
    if (digitsOnly.length > 12) {
      cleaned = (cleaned.startsWith('+') ? '+' : '') + digitsOnly.slice(0, 12);
    }

    // If no content, return empty
    if (!cleaned) return '';

    // Split into country code part and rest
    if (cleaned.startsWith('+')) {
      const digits = cleaned.slice(1);
      if (digits.length === 0) return '+';

      // Group digits: country code (1-3 digits) then groups of 3-4
      // Simple approach: put a space every 3-4 digits after the first few
      const groups: string[] = [];
      let i = 0;

      // Country code: take 1-3 digits based on common lengths
      let ccLen = 1;
      if (digits.length > 1) {
        const first = digits[0];
        // Single digit country codes: 1 (US/CA), 7 (RU)
        if (first === '1' || first === '7') {
          ccLen = 1;
        }
        // Two digit: most countries (44, 49, 33, etc.)
        else if (digits.length >= 2) {
          ccLen = 2;
          // Three digit codes: 353, 852, 420, 358, 351, etc.
          if (digits.length >= 3) {
            const twoDigit = parseInt(digits.slice(0, 2));
            if (
              twoDigit >= 21 &&
              twoDigit <= 29 // Africa 2xx
            ) {
              ccLen = 3;
            }
            const threeDigitPrefixes = [
              '35', '42', '85', '88', '96', '97', '98',
            ];
            if (threeDigitPrefixes.includes(digits.slice(0, 2))) {
              ccLen = 3;
            }
          }
        }
      }

      groups.push(digits.slice(0, ccLen));
      i = ccLen;

      // Remaining digits in groups of 3-4
      while (i < digits.length) {
        const remaining = digits.length - i;
        // Use groups of 4 if it divides evenly, otherwise 3
        const groupSize = remaining > 4 ? 3 : remaining;
        groups.push(digits.slice(i, i + groupSize));
        i += groupSize;
      }

      return '+' + groups.join(' ');
    }

    // No +: just group digits
    const groups: string[] = [];
    let i = 0;
    while (i < cleaned.length) {
      const remaining = cleaned.length - i;
      const groupSize = remaining > 4 ? 3 : remaining;
      groups.push(cleaned.slice(i, i + groupSize));
      i += groupSize;
    }
    return groups.join(' ');
  };

  /** Strips formatting, returns raw E.164-like string for the API */
  const stripPhoneFormatting = (formatted: string): string => {
    return formatted.replace(/\s/g, '');
  };

  useEffect(() => {
    if (open) return;

    const resetTimeout = setTimeout(() => {
      setName('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhoneNumber('');
      setType('individual');
      setCity('');
      setLine1('');
      setPostalCode('');
      setState('');
    }, 1000);

    return () => clearTimeout(resetTimeout);
  }, [open]);

  const {
    mutate: createCardholder,
    isPending: isCreating,
    error: createError,
  } = useMutation({
    mutationFn: createCardholderAction,
    onSuccess: (response) => {
      if ('message' in response) {
        throw new Error(response.message);
      }

      onClose();

      queryClient.invalidateQueries({
        queryKey: ['issuing-cardholders'],
      });
    },
  });

  return (
    <Dialog open={open} onClose={onClose} className='relative z-10'>
      <DialogBackdrop
        transition
        className='fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in'
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();

          createCardholder({
            name: name || `${firstName} ${lastName}`,
            firstName,
            lastName,
            email,
            phoneNumber: stripPhoneFormatting(phoneNumber),
            type,
            billing: {
              city,
              country,
              line1,
              postalCode,
              state,
            },
            accountId: account!.id,
            stripeSecretKey,
          });
        }}
      >
        <div className='fixed inset-0 z-10 w-screen overflow-y-auto'>
          <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
            <DialogPanel
              transition
              className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:data-closed:translate-y-0 sm:data-closed:scale-95'
            >
              <div>
                <DialogTitle
                  as='h3'
                  className='text-base font-semibold text-gray-900'
                >
                  {t('dashboard.issuing.create-cardholder.title')}
                </DialogTitle>
                <p className='mt-1 text-sm text-gray-500'>
                  {t('dashboard.issuing.create-cardholder.description')}
                </p>
              </div>

              {!isCreating && createError && (
                <div className='mt-4'>
                  <Alert>{createError.message}</Alert>
                </div>
              )}

              <div className='mt-4 flex flex-col gap-y-4'>
                <Select
                  label={t('dashboard.issuing.create-cardholder.type')}
                  value={type}
                  onChange={setType}
                  options={[
                    { value: 'individual', label: 'Individual' },
                    { value: 'company', label: 'Company' },
                  ]}
                  required
                />
                <div className='flex gap-4'>
                  <Input
                    label={t('dashboard.issuing.create-cardholder.first-name')}
                    value={firstName}
                    onChange={setFirstName}
                    required
                  />
                  <Input
                    label={t('dashboard.issuing.create-cardholder.last-name')}
                    value={lastName}
                    onChange={setLastName}
                    required
                  />
                </div>
                <Input
                  label={t('dashboard.issuing.create-cardholder.email')}
                  value={email}
                  onChange={setEmail}
                  type='email'
                  required
                />
                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-700'>
                    {t('dashboard.issuing.create-cardholder.phone')}
                    <span className='text-red-500'> *</span>
                  </label>
                  <input
                    type='tel'
                    value={phoneNumber}
                    onChange={(e) =>
                      setPhoneNumber(formatPhoneDisplay(e.target.value))
                    }
                    placeholder='+44 7911 123 456'
                    required
                    className='w-full p-2 border border-gray-300 rounded-md text-gray-700 bg-white focus:ring-2 focus:ring-brand-primary focus:border-brand-primary'
                  />
                </div>
                <Input
                  label={t('dashboard.issuing.create-cardholder.address-line1')}
                  value={line1}
                  onChange={setLine1}
                  required
                />
                <div className='flex gap-4'>
                  <Input
                    label={t('dashboard.issuing.create-cardholder.city')}
                    value={city}
                    onChange={setCity}
                    required
                  />
                  <Input
                    label={t('dashboard.issuing.create-cardholder.postal-code')}
                    value={postalCode}
                    onChange={setPostalCode}
                    required
                  />
                </div>
                <Input
                  label={t('dashboard.issuing.create-cardholder.state')}
                  value={state}
                  onChange={setState}
                  required
                />
              </div>

              <div className='flex flex-col md:flex-row gap-4 mt-5'>
                <Button
                  className='w-full bg-white border border-gray-500 text-gray-500 hover:bg-gray-100'
                  type='button'
                  onClick={onClose}
                >
                  {t('dashboard.issuing.create-cardholder.cancel')}
                </Button>
                <Button
                  className='w-full'
                  disabled={isCreating}
                  type='submit'
                >
                  {isCreating ? (
                    <LoadingSpinner className='size-4' strokeWidth={3} />
                  ) : (
                    t('dashboard.issuing.create-cardholder.create')
                  )}
                </Button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </form>
    </Dialog>
  );
};

