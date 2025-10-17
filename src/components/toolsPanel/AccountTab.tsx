'use client';

import { useDemoConfig } from '@/context/DemoConfigContext';
import { DEFAULT_DEMO_CONFIG } from '@/constants/demoConfig';
import { useCart } from '@/context/CartContext';
import { type ComponentProps } from 'react';
import { DebouncedInput } from './DebouncedInput';
import { useQuery } from '@tanstack/react-query';
import { getDemoConfigFromServer } from '@/app/api/demo/getDemoConfigFromServer';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { Alert } from './Alert';
import { Checkbox } from './Checkbox';

type AccountTabProps = Omit<ComponentProps<'div'>, 'children'>;

export const AccountTab = ({ className, ...rest }: AccountTabProps) => {
  const demoConfig = useDemoConfig();
  const { isSignedIn, signOut } = useDemoMerchant();
  const {
    stripePublishableKey,
    stripeSecretKey,
    configure,
    useV2Accounts,
    checkoutMethod,
    customPaymentMethods,
  } = demoConfig;
  const { clearCart } = useCart();

  const { data: defaultDemoConfig } = useQuery({
    queryKey: ['demoConfigFromServer'],
    queryFn: async () => {
      const defaultDemoConfigFromServer = await getDemoConfigFromServer();

      return {
        ...DEFAULT_DEMO_CONFIG,
        ...defaultDemoConfigFromServer,
      };
    },
    initialData: DEFAULT_DEMO_CONFIG,
  });

  return (
    <div {...rest} className={`space-y-4 ${className}`}>
      {isSignedIn && (
        <Alert
          text='You are signed in. To edit these settings, please sign out first.'
          buttonText='Sign Out'
          onClick={() => {
            signOut();
          }}
        />
      )}
      <Checkbox
        label='Use V2 Accounts'
        checked={useV2Accounts}
        disabled={isSignedIn}
        onChange={(useV2Accounts) => {
          configure('useV2Accounts', useV2Accounts);
          clearCart();
        }}
        tooltip='If enabled, new accounts will be created using the V2 Accounts API.'
      />
      <DebouncedInput
        label='Platform Stripe Publishable Key'
        value={
          stripePublishableKey !== defaultDemoConfig?.stripePublishableKey
            ? stripePublishableKey
            : undefined
        }
        onChange={(stripePublishableKey) => {
          configure('stripePublishableKey', stripePublishableKey);
          clearCart();
        }}
        disabled={isSignedIn}
        debounce={500}
      />
      <DebouncedInput
        label='Platform Stripe Secret Key'
        value={stripeSecretKey}
        onChange={(stripeSecretKey) => {
          configure('stripeSecretKey', stripeSecretKey);
          clearCart();
        }}
        disabled={isSignedIn}
        debounce={500}
      />
      {checkoutMethod === 'elements-checkout' && (
        <DebouncedInput
          label='Custom Payment Methods'
          value={customPaymentMethods.join(',')}
          tooltip='Enter a comma separated list of custom payment method IDs'
          onChange={(customPaymentMethods) =>
            configure(
              'customPaymentMethods',
              customPaymentMethods
                .split(',')
                .filter((method) => method.trim() !== '')
                .filter((method) => method.startsWith('cpmt_')),
            )
          }
          debounce={500}
        />
      )}
    </div>
  );
};
