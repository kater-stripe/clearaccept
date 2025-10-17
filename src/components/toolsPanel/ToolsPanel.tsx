'use client';

import { useState } from 'react';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useCart } from '@/context/CartContext';
import { useToolsPanel } from '@/context/ToolsPanelContext';
import { TabSelector } from './TabSelector';
import { AppearanceTab } from './AppearenceTab';
import { AccountTab } from './AccountTab';
import { useUmami } from '@/context/UmamiContext';
import { useDemoCustomer } from '@/context/DemoCustomerContext';
import { useRouter } from 'next/navigation';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { generateRandomEmail } from '@/utils/generateRandomEmail';
import { FinancingTab } from './FinancingTab';
import { SeedingTab } from './SeedingTab';

export const ToolsPanel = () => {
  const { resetDemoConfig, language } = useDemoConfig();
  const { clearCart } = useCart();
  const { signOut: signOutCustomer, updateCustomer } = useDemoCustomer();
  const {
    signOut: signOutMerchant,
    updateMerchant,
    isCapitalEligible,
    account,
  } = useDemoMerchant();
  const [isResetConfirming, setIsResetConfirming] = useState(false);
  const { track } = useUmami();
  const { activeTab } = useToolsPanel();
  const router = useRouter();
  const { isSignedIn } = useDemoMerchant();

  const handleResetClick = () => {
    if (isResetConfirming) {
      resetDemoConfig();

      clearCart();
      signOutCustomer();
      signOutMerchant();
      updateMerchant('email', generateRandomEmail());
      updateCustomer('email', generateRandomEmail());
      setIsResetConfirming(false);

      track('settings_reset');

      return;
    }

    router.push(`/${language}`);

    setIsResetConfirming(true);
  };

  return (
    <div>
      <h2 className='text-xl font-bold mb-3 text-gray-800'>Settings</h2>

      {/* Panel tabs */}
      <TabSelector />

      {/* By mounting early, we allow requests in the background. */}
      <AppearanceTab className={activeTab !== 'Appearance' ? 'hidden' : ''} />
      <AccountTab className={activeTab !== 'Account' ? 'hidden' : ''} />

      {isSignedIn && (
        <SeedingTab className={activeTab !== 'Seeding' ? 'hidden' : ''} />
      )}

      {isSignedIn &&
        isCapitalEligible &&
        (account?.object === 'account'
          ? account.country
          : account?.identity?.country) === 'US' && (
          <FinancingTab className={activeTab !== 'Financing' ? 'hidden' : ''} />
        )}

      <button
        onClick={handleResetClick}
        className={`w-full mt-4 py-2 px-6 rounded-md ${
          isResetConfirming
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-black hover:bg-black1'
        } text-white transition-colors duration-300`}
        onBlur={() => setIsResetConfirming(false)}
      >
        {isResetConfirming ? 'Confirm Reset' : 'Reset Settings'}
      </button>
    </div>
  );
};
