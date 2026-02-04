'use client';

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Alert } from '../common/Alert';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { createOutboundSetupIntent as createOutboundSetupIntentAction } from '@/app/api/money-management/outbound-setup-intents/createOutboundSetupIntent';
import type { Stripe } from 'stripe';

// IBAN countries (SEPA zone + other European countries using IBAN)
const IBAN_COUNTRIES = [
  'at', 'be', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi', 'fr',
  'de', 'gr', 'hu', 'is', 'ie', 'it', 'lv', 'li', 'lt', 'lu',
  'mt', 'mc', 'nl', 'no', 'pl', 'pt', 'ro', 'sm', 'sk', 'si',
  'es', 'se', 'ch', 'va',
];

// Check if a country uses IBAN
const isIbanCountry = (country: string) => IBAN_COUNTRIES.includes(country.toLowerCase());

// Get the bank account type label for display
const getBankAccountTypeLabel = (country: string) => {
  if (country === 'us') return 'US';
  if (country === 'gb') return 'UK';
  if (isIbanCountry(country)) return 'IBAN';
  return country.toUpperCase();
};

type AddPayoutMethodModalProps = {
  open: boolean;
  onClose: () => void;
  connectedAccountId: string;
  recipientAccount: Stripe.V2.Core.Account;
  onSuccess: () => void;
};

export const AddPayoutMethodModal = ({
  open,
  onClose,
  connectedAccountId,
  recipientAccount,
  onSuccess,
}: AddPayoutMethodModalProps) => {
  const { t } = useTranslation();
  const { stripeSecretKey } = useDemoConfig();

  // Normalize country to lowercase for comparison (Stripe may return uppercase)
  const country = (recipientAccount.identity?.country || 'us').toLowerCase();
  const isIban = isIbanCountry(country);
  const bankTypeLabel = getBankAccountTypeLabel(country);

  const [accountNumber, setAccountNumber] = useState<string>('');
  const [iban, setIban] = useState<string>('');
  const [routingNumber, setRoutingNumber] = useState<string>('');
  const [sortCode, setSortCode] = useState<string>('');
  const [accountHolderName, setAccountHolderName] = useState<string>('');
  const [accountType, setAccountType] = useState<'checking' | 'savings'>(
    'checking',
  );

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      const resetTimeout = setTimeout(() => {
        setAccountNumber('');
        setIban('');
        setRoutingNumber('');
        setSortCode('');
        setAccountHolderName('');
        setAccountType('checking');
      }, 300);
      return () => clearTimeout(resetTimeout);
    }
  }, [open]);

  // Create outbound setup intent mutation
  const {
    mutate: createOutboundSetupIntent,
    isPending: isCreatingSetupIntent,
    error: setupIntentError,
  } = useMutation({
    mutationFn: createOutboundSetupIntentAction,
    onSuccess: (response) => {
      if ('message' in response) {
        throw new Error(response.message);
      }

      onSuccess();
      onClose();
    },
  });

  const handleSubmitBankAccount = (e: React.FormEvent) => {
    e.preventDefault();

    // For IBAN countries, the IBAN is sent as the account number
    const accountNumberToSend = isIban ? iban : accountNumber;

    createOutboundSetupIntent({
      connectedAccountId,
      recipientAccountId: recipientAccount.id,
      country,
      accountNumber: accountNumberToSend,
      routingNumber: country === 'us' ? routingNumber : undefined,
      sortCode: country === 'gb' ? sortCode : undefined,
      accountHolderName,
      accountType,
      stripeSecretKey,
    });
  };

  // Check if form is valid based on country type
  const isFormValid = (() => {
    if (!accountHolderName) return false;

    if (country === 'us') {
      return accountNumber && routingNumber;
    } else if (country === 'gb') {
      return accountNumber && sortCode;
    } else if (isIban) {
      return iban && iban.length >= 15; // Minimum IBAN length
    }
    return false;
  })();

  return (
    <Dialog open={open} onClose={onClose} className='relative z-30'>
      <DialogBackdrop
        transition
        className='fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in'
      />

      <form onSubmit={handleSubmitBankAccount}>
        <div className='fixed inset-0 z-30 w-screen overflow-y-auto'>
          <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
            <DialogPanel
              transition
              className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 sm:data-closed:translate-y-0 sm:data-closed:scale-95'
            >
              <div>
                <DialogTitle
                  as='h3'
                  className='text-lg font-semibold text-gray-900'
                >
                  {t('modals.add-payout-method.title')}
                </DialogTitle>
                <p className='mt-1 text-sm text-gray-500'>
                  {t('modals.add-payout-method.description', {
                    recipientName: recipientAccount.display_name,
                    country: country.toUpperCase(),
                    bankType: bankTypeLabel,
                  })}
                </p>
              </div>

              {!isCreatingSetupIntent && setupIntentError && (
                <div className='mt-4'>
                  <Alert>{t('modals.add-payout-method.error')}</Alert>
                </div>
              )}

              <div className='mt-4 flex flex-col gap-y-4'>
                {/* Account Type */}
                <Select
                  label={t('modals.add-payout-method.form.account-type')}
                  value={accountType}
                  onChange={(value) =>
                    setAccountType(value as 'checking' | 'savings')
                  }
                  options={[
                    {
                      value: 'checking',
                      label: t('modals.add-payout-method.form.checking'),
                    },
                    {
                      value: 'savings',
                      label: t('modals.add-payout-method.form.savings'),
                    },
                  ]}
                  required
                />

                {/* Account Holder Name */}
                <Input
                  label={t('modals.add-payout-method.form.account-holder-name')}
                  value={accountHolderName}
                  onChange={setAccountHolderName}
                  placeholder={t(
                    'modals.add-payout-method.form.account-holder-name-placeholder',
                  )}
                  required
                />

                {/* US Bank Account Fields */}
                {country === 'us' && (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <Input
                      label={t('modals.add-payout-method.form.account-number')}
                      value={accountNumber}
                      onChange={setAccountNumber}
                      placeholder={t(
                        'modals.add-payout-method.form.account-number-placeholder',
                      )}
                      required
                    />
                    <Input
                      label={t('modals.add-payout-method.form.routing-number')}
                      value={routingNumber}
                      onChange={setRoutingNumber}
                      placeholder={t(
                        'modals.add-payout-method.form.routing-number-placeholder',
                      )}
                      required
                    />
                  </div>
                )}

                {/* GB Bank Account Fields */}
                {country === 'gb' && (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <Input
                      label={t('modals.add-payout-method.form.account-number')}
                      value={accountNumber}
                      onChange={setAccountNumber}
                      placeholder={t(
                        'modals.add-payout-method.form.gb-account-number-placeholder',
                      )}
                      required
                    />
                    <Input
                      label={t('modals.add-payout-method.form.sort-code')}
                      value={sortCode}
                      onChange={setSortCode}
                      placeholder={t(
                        'modals.add-payout-method.form.sort-code-placeholder',
                      )}
                      required
                    />
                  </div>
                )}

                {/* IBAN Countries (European) */}
                {isIban && (
                  <Input
                    label={t('modals.add-payout-method.form.iban')}
                    value={iban}
                    onChange={setIban}
                    placeholder={t(
                      'modals.add-payout-method.form.iban-placeholder',
                    )}
                    required
                  />
                )}

                <div className='mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md'>
                  <p className='text-sm text-blue-800'>
                    {t('modals.add-payout-method.form.info-message')}
                  </p>
                </div>
              </div>

              <div className='flex flex-col md:flex-row gap-4 mt-5'>
                <Button
                  className='w-full bg-white border border-gray-500 text-gray-500 hover:bg-gray-100'
                  type='button'
                  onClick={onClose}
                >
                  {t('modals.add-payout-method.form.cancel')}
                </Button>
                <Button
                  className='w-full'
                  disabled={isCreatingSetupIntent || !isFormValid}
                  type='submit'
                >
                  {isCreatingSetupIntent ? (
                    <LoadingSpinner className='size-4' strokeWidth={3} />
                  ) : (
                    t('modals.add-payout-method.form.add')
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

