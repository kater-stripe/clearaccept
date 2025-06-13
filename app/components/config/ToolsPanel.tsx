/* eslint-disable i18next/no-literal-string */
'use client';

import {useConfigContext} from '@/app/contexts/ConfigContext';
import Image from 'next/image';
import {XMarkIcon} from '@heroicons/react/24/solid';
import {useState} from 'react';
import TabSelector from './TabSelector';
import AppearanceTab from './AppearanceTab';
import AccountTab from './AccountTab';
import {useRouter} from 'next/navigation';
import {SeedAccountTab} from './SeedAccountTab';

export default function ToolsPanel() {
  const {
    settings,
    isToolsPanelOpen,
    toggleToolsPanel,
    isLoading,
    resetSettings,
  } = useConfigContext();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Appearance');
  const [isResetConfirming, setIsResetConfirming] = useState(false);

  if (!settings) return null;

  if (isLoading) {
    return (
      <div className="mb-4 animate-pulse rounded-lg bg-gray-100 p-4 text-sm">
        Loading...
      </div>
    );
  }

  const handleResetClick = () => {
    if (isResetConfirming) {
      window.umami?.track('settings_reset');
      resetSettings();
      setIsResetConfirming(false);
      router.push(`/${settings.language}/signup`);
    } else {
      setIsResetConfirming(true);
    }
  };

  return (
    <>
      <div
        className={`fixed left-0 top-0 h-full w-64 transform overflow-y-auto bg-white p-4 shadow-xl transition-transform duration-300 ease-in-out ${
          isToolsPanelOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <h2 className="mb-3 text-xl font-bold text-gray-800">Settings</h2>

        {/* Panel tabs */}
        <TabSelector activeTab={activeTab} setActiveTab={setActiveTab} />
        {activeTab === 'Appearance' && <AppearanceTab />}
        {activeTab === 'Account' && <AccountTab />}
        {activeTab === 'SeedAccount' && <SeedAccountTab />}

        <button
          onClick={handleResetClick}
          className={`mt-4 w-full rounded-md px-6 py-2 ${
            isResetConfirming
              ? 'bg-red-500 hover:bg-red-600'
              : 'hover:bg-black1 bg-black'
          } text-white transition-colors duration-300`}
          onBlur={() => setIsResetConfirming(false)}
        >
          {isResetConfirming ? 'Confirm Reset' : 'Reset Settings'}
        </button>
      </div>

      {/* Tools panel toggle button */}
      <button
        onClick={() => toggleToolsPanel('isToolsPanelOpen')}
        className="fixed bottom-16 left-0 z-50 rounded-r-lg bg-blurple p-2 transition-all duration-300"
        aria-label={isToolsPanelOpen ? 'Close settings' : 'Open settings'}
      >
        {isToolsPanelOpen ? (
          <XMarkIcon className="h-8 w-8 text-white" />
        ) : (
          <Image
            src="/img/icon/stripe.svg"
            alt="Stripe icon"
            width={32}
            height={32}
            className="opacity-60 transition-opacity duration-300 hover:opacity-100"
          />
        )}
      </button>
    </>
  );
}
