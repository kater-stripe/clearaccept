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
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import { Input } from '../common/Input';
import { Alert } from '../common/Alert';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { createRecipient as createRecipientAction } from '@/app/api/accounts/createRecipient';

type AddRecipientModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onRecipientCreated: (account: any) => void;
};

type EntityType = 'individual' | 'company';

// Supported countries for recipients - only US, GB, and IBAN (European) countries
// These are the countries supported by manual bank account entry
const SUPPORTED_COUNTRIES = [
  // US (routing number + account number)
  { value: 'us', label: 'United States' },
  // GB (sort code + account number)
  { value: 'gb', label: 'United Kingdom' },
  // IBAN countries (SEPA zone + other European countries)
  { value: 'at', label: 'Austria' },
  { value: 'be', label: 'Belgium' },
  { value: 'bg', label: 'Bulgaria' },
  { value: 'hr', label: 'Croatia' },
  { value: 'cy', label: 'Cyprus' },
  { value: 'cz', label: 'Czech Republic' },
  { value: 'dk', label: 'Denmark' },
  { value: 'ee', label: 'Estonia' },
  { value: 'fi', label: 'Finland' },
  { value: 'fr', label: 'France' },
  { value: 'de', label: 'Germany' },
  { value: 'gr', label: 'Greece' },
  { value: 'hu', label: 'Hungary' },
  { value: 'is', label: 'Iceland' },
  { value: 'ie', label: 'Ireland' },
  { value: 'it', label: 'Italy' },
  { value: 'lv', label: 'Latvia' },
  { value: 'li', label: 'Liechtenstein' },
  { value: 'lt', label: 'Lithuania' },
  { value: 'lu', label: 'Luxembourg' },
  { value: 'mt', label: 'Malta' },
  { value: 'mc', label: 'Monaco' },
  { value: 'nl', label: 'Netherlands' },
  { value: 'no', label: 'Norway' },
  { value: 'pl', label: 'Poland' },
  { value: 'pt', label: 'Portugal' },
  { value: 'ro', label: 'Romania' },
  { value: 'sm', label: 'San Marino' },
  { value: 'sk', label: 'Slovakia' },
  { value: 'si', label: 'Slovenia' },
  { value: 'es', label: 'Spain' },
  { value: 'se', label: 'Sweden' },
  { value: 'ch', label: 'Switzerland' },
];

export const AddRecipientModal = ({
  open,
  onClose,
  onSuccess,
  onRecipientCreated,
}: AddRecipientModalProps) => {
  const { t } = useTranslation();
  const { stripeSecretKey } = useDemoConfig();
  const { account } = useDemoMerchant();

  const [entityType, setEntityType] = useState<EntityType>('individual');
  const [country, setCountry] = useState<string>('us');
  const [contactEmail, setContactEmail] = useState<string>('');

  // Individual fields
  const [givenName, setGivenName] = useState<string>('');
  const [surname, setSurname] = useState<string>('');

  // Company fields
  const [registeredName, setRegisteredName] = useState<string>('');

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      const resetTimeout = setTimeout(() => {
        setEntityType('individual');
        setCountry('us');
        setContactEmail('');
        setGivenName('');
        setSurname('');
        setRegisteredName('');
      }, 300);
      return () => clearTimeout(resetTimeout);
    }
  }, [open]);

  // Create recipient mutation — after creation, parent opens AddPayoutMethodModal
  const {
    mutate: createRecipient,
    isPending: isCreatingRecipient,
    error: recipientError,
  } = useMutation({
    mutationFn: createRecipientAction,
    onSuccess: async (response) => {
      if ('message' in response) {
        throw new Error(response.message);
      }

      // Notify parent so it can open AddPayoutMethodModal for this recipient
      onRecipientCreated(response);

      onClose();
      onSuccess();
    },
  });

  const handleSubmitRecipient = (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) return;

    createRecipient({
      connectedAccountId: account.id,
      contactEmail,
      entityType,
      country,
      givenName: entityType === 'individual' ? givenName : undefined,
      surname: entityType === 'individual' ? surname : undefined,
      registeredName: entityType === 'company' ? registeredName : undefined,
      stripeSecretKey,
    });
  };

  const isFormValid =
    contactEmail &&
    country &&
    (entityType === 'individual'
      ? givenName && surname
      : registeredName);

  return (
    <Dialog open={open} onClose={onClose} className='relative z-20'>
      <DialogBackdrop
        transition
        className='fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in'
      />

      <form onSubmit={handleSubmitRecipient}>
        <div className='fixed inset-0 z-20 w-screen overflow-y-auto'>
          <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
            <DialogPanel
              transition
              className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in sm:my-8 sm:w-full sm:max-w-3xl sm:p-6 sm:data-closed:translate-y-0 sm:data-closed:scale-95'
            >
              <div>
                <DialogTitle
                  as='h3'
                  className='text-lg font-semibold text-gray-900'
                >
                  {t('modals.add-recipient.title')}
                </DialogTitle>
                <p className='mt-1 text-sm text-gray-500'>
                  {t('modals.add-recipient.description')}
                </p>
              </div>

              {!isCreatingRecipient && recipientError && (
                <div className='mt-4'>
                  <Alert>{t('modals.add-recipient.error')}</Alert>
                </div>
              )}

              <div className='mt-4 flex flex-col gap-y-4'>
                {/* Entity Type and Country - Row 1 */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <Select
                    label={t('modals.add-recipient.form.entity-type')}
                    value={entityType}
                    onChange={(value) => setEntityType(value as EntityType)}
                    options={[
                      {
                        value: 'individual',
                        label: t('modals.add-recipient.form.individual'),
                      },
                      {
                        value: 'company',
                        label: t('modals.add-recipient.form.company'),
                      },
                    ]}
                    required
                  />

                  <Select
                    label={t('modals.add-recipient.form.country')}
                    value={country}
                    onChange={setCountry}
                    options={SUPPORTED_COUNTRIES}
                    required
                  />
                </div>

                {/* Contact Email - Row 2 */}
                <Input
                  label={t('modals.add-recipient.form.contact-email')}
                  type='email'
                  value={contactEmail}
                  onChange={setContactEmail}
                  placeholder={t(
                    'modals.add-recipient.form.contact-email-placeholder',
                  )}
                  required
                />

                {/* Individual Fields - Row 3 */}
                {entityType === 'individual' && (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <Input
                      label={t('modals.add-recipient.form.given-name')}
                      value={givenName}
                      onChange={setGivenName}
                      placeholder={t(
                        'modals.add-recipient.form.given-name-placeholder',
                      )}
                      required
                    />
                    <Input
                      label={t('modals.add-recipient.form.surname')}
                      value={surname}
                      onChange={setSurname}
                      placeholder={t(
                        'modals.add-recipient.form.surname-placeholder',
                      )}
                      required
                    />
                  </div>
                )}

                {/* Company Fields */}
                {entityType === 'company' && (
                  <Input
                    label={t('modals.add-recipient.form.registered-name')}
                    value={registeredName}
                    onChange={setRegisteredName}
                    placeholder={t(
                      'modals.add-recipient.form.registered-name-placeholder',
                    )}
                    required
                  />
                )}

                <div className='mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md'>
                  <p className='text-sm text-blue-800'>
                    {t('modals.add-recipient.form.info-message')}
                  </p>
                </div>
              </div>

              <div className='flex flex-col md:flex-row gap-4 mt-5'>
                <Button
                  className='w-full bg-white border border-gray-500 text-gray-500 hover:bg-gray-100'
                  type='button'
                  onClick={onClose}
                >
                  {t('modals.add-recipient.form.cancel')}
                </Button>
                <Button
                  className='w-full'
                  disabled={isCreatingRecipient || !isFormValid}
                  type='submit'
                >
                  {isCreatingRecipient ? (
                    <LoadingSpinner className='size-4' strokeWidth={3} />
                  ) : (
                    t('modals.add-recipient.form.create')
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

