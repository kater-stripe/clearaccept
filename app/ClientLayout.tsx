'use client';

import {useRef, useEffect, Suspense} from 'react';
import {ConfigProvider, useConfigContext} from '@/app/contexts/ConfigContext';
import ToolsPanel from './components/config/ToolsPanel';
import ThemeOverrides from './ThemeOverrides';
import UmamiTracker from './UmamiTracker';

interface AppContentProps {
  children: React.ReactNode;
}

interface CustomCSSProperties extends React.CSSProperties {
  '--transition-duration'?: string;
}

function AppContent({children}: AppContentProps) {
  const {isToolsPanelOpen} = useConfigContext();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isToolsPanelOpen) {
      window.scrollTo(0, 0);
      scrollContainerRef.current?.scrollTo(0, 0);
    }
  }, [isToolsPanelOpen]);

  const containerClasses = `
    flex-grow transition-all ease-in-out
    ${
      isToolsPanelOpen
        ? 'overflow-hidden shadow-xl md:translate-x-[calc(120px+2%)] md:translate-y-[2vh] md:scale-x-[0.68] md:scale-y-[0.72]  lg:scale-x-[0.73] lg:scale-y-[0.77]  xl:scale-x-[0.81] xl:scale-y-[0.85] md:border md:border-gray-200 md:rounded-xl'
        : ''
    }
  `;

  const containerStyle: CustomCSSProperties = {
    '--transition-duration': isToolsPanelOpen ? '700ms' : '300ms',
    transitionDuration: 'var(--transition-duration)',
  };

  return (
    <div
      className={`flex flex-col ${
        isToolsPanelOpen ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`}
    >
      <ToolsPanel />
      <UmamiTracker />
      <div
        id="app-container"
        className={containerClasses}
        style={containerStyle}
      >
        <div
          ref={scrollContainerRef}
          className={`flex flex-col ${
            isToolsPanelOpen ? 'h-screen overflow-y-auto' : 'min-h-full'
          }`}
        >
          <main className="w-full flex-grow">{children}</main>
        </div>
      </div>
    </div>
  );
}

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({children}: ClientLayoutProps) {
  return (
    <Suspense>
      <ConfigProvider>
        <ThemeOverrides />
        <AppContent>{children}</AppContent>
      </ConfigProvider>
    </Suspense>
  );
}
