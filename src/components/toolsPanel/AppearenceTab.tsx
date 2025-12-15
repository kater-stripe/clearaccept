'use client';

import { useDemoConfig } from '@/context/DemoConfigContext';
import { CurrencyCombobox } from './CurrencyCombobox';
import { Select } from './Select';
import { Input } from './Input';
import type { SupportedLanguage } from '@/constants/languages';
import { type ComponentProps } from 'react';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { Checkbox } from './Checkbox';
import type { CheckoutMethod } from '@/constants/checkoutMethod';
import { useDemoCustomer } from '@/context/DemoCustomerContext';

type AppearenceTabProps = Omit<ComponentProps<'div'>, 'children'>;

export const AppearanceTab = ({ className, ...rest }: AppearenceTabProps) => {
  const demoConfig = useDemoConfig();
  const {
    currency,
    configure,
    language,
    capitalFinancingPromotionLayout,
    chargeType,
    onboardingType,
    treasuryCapabilityEnabled,
    issuingCapabilityEnabled,
    onboardCollectionFields,
    checkoutMethod,
    elementsStyle,
    elementsExpressCheckoutEnabled,
    elementsAddressFormEnabled,
    cryptoEnabled,
  } = demoConfig;
  const { updateMerchant, email: merchantEmail } = useDemoMerchant();
  const { updateCustomer, email: customerEmail } = useDemoCustomer();

  return (
    <div {...rest} className={`space-y-4 ${className}`}>
      <CurrencyCombobox
        selectedCurrencyCode={currency}
        setSelectedCurrencyCode={(currencyCode) =>
          configure('currency', currencyCode)
        }
      />
      <Select
        label='Language'
        options={
          [
            { value: 'en', label: 'English' },
            { value: 'en-GB', label: 'English (UK)' },
            { value: 'fr', label: 'French' },
            { value: 'es', label: 'Spanish' },
            { value: 'de', label: 'German' },
            { value: 'it', label: 'Italian' },
            { value: 'ja', label: 'Japanese' },
            { value: 'zh', label: 'Chinese (Simplified)' },
          ] as const satisfies {
            value: SupportedLanguage;
            label: string;
          }[]
        }
        value={language}
        onChange={(language) => {
          configure('language', language);
        }}
      />
      <Select
        label='Checkout Integration'
        options={
          [
            { value: 'elements-checkout', label: 'Elements w/ PI' },
            { value: 'stripe-checkout', label: 'Stripe-hosted page' },
            { value: 'embedded-checkout', label: 'Embedded form' },
            {
              value: 'elements-checkout-with-checkout-sessions',
              label: 'Elements w/ CS',
            },
          ] as const satisfies {
            value: CheckoutMethod;
            label: string;
          }[]
        }
        value={checkoutMethod}
        onChange={(checkoutMethod) =>
          configure('checkoutMethod', checkoutMethod)
        }
      />
      {(checkoutMethod === 'elements-checkout' ||
        checkoutMethod === 'elements-checkout-with-checkout-sessions') && (
        <Select
          label='Elements Style'
          options={
            [
              { value: 'accordion', label: 'Accordion' },
              { value: 'tabs', label: 'Tabs' },
            ] as const
          }
          value={elementsStyle}
          onChange={(elementsStyle) =>
            configure('elementsStyle', elementsStyle)
          }
        />
      )}
      <div className='space-y-2'>
        {(checkoutMethod === 'elements-checkout' ||
          checkoutMethod === 'elements-checkout-with-checkout-sessions') && (
          <Checkbox
            label='Express Checkout Element'
            checked={elementsExpressCheckoutEnabled}
            onChange={(checked) => {
              configure('elementsExpressCheckoutEnabled', checked);
            }}
          />
        )}
        {checkoutMethod === 'elements-checkout' && (
          <Checkbox
            label='Address Element'
            tooltip='Tax will not be calculated without address element'
            checked={elementsAddressFormEnabled}
            onChange={(checked) =>
              configure('elementsAddressFormEnabled', checked)
            }
          />
        )}
        {checkoutMethod === 'elements-checkout' && (
          <Checkbox
            label='Crypto'
            checked={cryptoEnabled}
            onChange={(checked) => configure('cryptoEnabled', checked)}
          />
        )}
      </div>
      <Input
        label='Customer email'
        type='email'
        placeholder='customer@example.com'
        value={customerEmail ?? ''}
        onChange={(email) => updateCustomer('email', email)}
      />
      <Select
        label='Onboarding type'
        options={
          [
            { value: 'embedded', label: 'Embedded' },
            { value: 'hosted', label: 'Hosted' },
          ] as const
        }
        value={onboardingType}
        onChange={(onboardingType) =>
          configure('onboardingType', onboardingType)
        }
      />
      <Select
        label='Charge type'
        options={
          [
            { value: 'destination', label: 'Destination' },
            {
              value: 'destination-on-behalf-of',
              label: 'Destination (on behalf of)',
            },
            { value: 'direct', label: 'Direct' },
          ] as const
        }
        value={chargeType}
        onChange={(chargeType) => configure('chargeType', chargeType)}
      />
      <div className='space-y-2'>
        <Checkbox
          label='Onboard with issuing'
          tooltip='When onboarding with the issuing capability enabled, a terms of service agreement will be collected.'
          checked={issuingCapabilityEnabled}
          onChange={(issuingCapabilityEnabled) =>
            configure('issuingCapabilityEnabled', issuingCapabilityEnabled)
          }
        />
        <Checkbox
          label='Onboard with treasury'
          tooltip='When onboarding with the treasury capability enabled, a payout bank account will not be collected.'
          checked={treasuryCapabilityEnabled}
          onChange={(treasuryCapabilityEnabled) =>
            configure('treasuryCapabilityEnabled', treasuryCapabilityEnabled)
          }
        />
      </div>
      <Select
        label='Onboarding collection fields'
        options={
          [
            { value: 'eventually_due', label: 'Eventually due' },
            { value: 'currently_due', label: 'Currently due' },
          ] as const
        }
        value={onboardCollectionFields}
        onChange={(onboardCollectionFields) =>
          configure('onboardCollectionFields', onboardCollectionFields)
        }
      />
      <Select
        label='Financing promotion layout'
        options={
          [
            { value: 'banner', label: 'Banner' },
            { value: 'full', label: 'Full' },
          ] as const
        }
        value={capitalFinancingPromotionLayout}
        onChange={(capitalFinancingPromotionLayout) =>
          configure(
            'capitalFinancingPromotionLayout',
            capitalFinancingPromotionLayout,
          )
        }
      />
      <Input
        label='Merchant email'
        type='email'
        placeholder='merchant@example.com'
        value={merchantEmail ?? ''}
        onChange={(email) => updateMerchant('email', email)}
      />
    </div>
  );
};
