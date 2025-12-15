'use client';

import { ToolsPanel } from '@/components/toolsPanel/ToolsPanel';
import Image from 'next/image';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from 'react';
import { useBoolean } from 'usehooks-ts';
import { X } from 'lucide-react';
import type { ToolsPanelTab } from '@/constants/toolsPanelTabs';
import { ElementsAndEmbeddedComponentsHighlight } from '@/components/toolsPanel/ElementsAndEmbeddedComponentsHighlight';

const ToolsPanelContext = createContext<{
  isToolsPanelOpen: boolean;
  toggleToolsPanelOpen: () => void;
  activeTab: string;
  setActiveTab: (tab: ToolsPanelTab) => void;
}>({
  isToolsPanelOpen: false,
  toggleToolsPanelOpen: () => {},
  activeTab: 'Appearance',
  setActiveTab: () => {},
});

export const ToolsPanelProvider = ({ children }: PropsWithChildren) => {
  const { value: isToolsPanelOpen, toggle: toggleToolsPanelOpen } =
    useBoolean(false);
  const [activeTab, setActiveTab] = useState<ToolsPanelTab>('Appearance');

  return (
    <ToolsPanelContext.Provider
      value={{
        isToolsPanelOpen,
        toggleToolsPanelOpen,
        activeTab,
        setActiveTab,
      }}
    >
      <ElementsAndEmbeddedComponentsHighlight />
      <div
        className={`flex flex-col ${
          isToolsPanelOpen ? 'h-screen overflow-hidden' : 'min-h-screen'
        } bg-pattern`}
      >
        <div
          className={`fixed left-0 top-0 h-full w-64 bg-white shadow-xl p-4 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
            isToolsPanelOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{
            zIndex: 100,
          }}
        >
          <ToolsPanel />
        </div>
        <button
          onClick={toggleToolsPanelOpen}
          className='p-2 fixed left-0 bottom-[12rem] bg-blurple transition-all z-200 duration-300 rounded-r-lg'
          aria-label={isToolsPanelOpen ? 'Close settings' : 'Open settings'}
        >
          {isToolsPanelOpen ? (
            <X className='h-8 w-8 text-white' />
          ) : (
            <Image
              src='/img/icon/stripe.svg'
              alt='Stripe icon'
              width={32}
              height={32}
              className='opacity-60 hover:opacity-100 transition-opacity duration-300'
            />
          )}
        </button>
        <div
          className={`flex flex-col grow transition-all ease-in-out font-[Sohne] ${
            isToolsPanelOpen
              ? 'overflow-scroll shadow-xl md:translate-x-[calc(120px+18%)] md:translate-y-[5vh] md:scale-x-[0.68] md:scale-y-[0.72] lg:translate-x-[calc(108px+15%)] lg:scale-x-[0.73] lg:scale-y-[0.77] xl:translate-x-[calc(105px+11%)] xl:scale-x-[0.81] xl:scale-y-[0.85] md:border md:border-gray-200 md:rounded-xl'
              : 'md:translate-x-0 md:translate-y-0 md:scale-100 lg:translate-x-0 lg:scale-100 xl:translate-x-0 xl:scale-100'
          } transform origin-top-left duration-${isToolsPanelOpen ? '300' : '700'}
        `}
        >
          {children}
        </div>
      </div>
    </ToolsPanelContext.Provider>
  );
};

export const useToolsPanel = () => useContext(ToolsPanelContext);
