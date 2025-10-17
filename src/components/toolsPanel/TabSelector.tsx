'use client';

import {
  TOOLS_PANEL_TABS,
  type ToolsPanelTab,
} from '@/constants/toolsPanelTabs';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { useToolsPanel } from '@/context/ToolsPanelContext';
import {
  Cog6ToothIcon,
  BuildingLibraryIcon,
  KeyIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const TABS_TO_ICON_MAPPING = {
  Appearance: Cog6ToothIcon,
  Account: KeyIcon,
  Seeding: SparklesIcon,
  Financing: BuildingLibraryIcon,
} as const satisfies Record<ToolsPanelTab, any>;

export const TabSelector = () => {
  const { setActiveTab, activeTab } = useToolsPanel();
  const { isSignedIn, account, isCapitalEligible } = useDemoMerchant();

  const eligibleToolsPanelTabs = TOOLS_PANEL_TABS.filter((tab) => {
    if (tab === 'Financing') {
      return (
        isSignedIn &&
        isCapitalEligible &&
        (account?.object === 'account'
          ? account.country
          : account?.identity?.country) === 'US'
      );
    }

    if (tab === 'Seeding') {
      return isSignedIn;
    }

    return true;
  });

  return (
    <div className='block mb-4'>
      <div className='border-b border-gray-200'>
        <nav aria-label='Tabs' className='-mb-px flex space-x-2'>
          {eligibleToolsPanelTabs.map((tab) => {
            const Icon = TABS_TO_ICON_MAPPING[tab];

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                aria-current={activeTab === tab ? 'page' : undefined}
                className={`
                    ${
                      activeTab === tab
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } 
                    group inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium`}
              >
                <Icon
                  title={tab}
                  aria-hidden='true'
                  className={`
                      ${
                        activeTab === tab
                          ? 'text-indigo-500'
                          : 'text-gray-400 group-hover:text-gray-500'
                      } 
                      '-ml-0.5 h-5 w-5',
                    `}
                />
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
