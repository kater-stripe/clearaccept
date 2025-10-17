'use client';

import { useDebounceCallback } from '@/hooks/useDebounceCallback';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
} from 'react';

type UmamiContext = {
  track: (event: string, data?: any) => void;
  debounceTrack: (event: string, data?: any) => void;
};

const UmamiContext = createContext<UmamiContext>({
  track: () => {},
  debounceTrack: () => {},
});

export const UmamiProvider = ({ children }: PropsWithChildren) => {
  const isUmamiAvailable =
    typeof window !== 'undefined' && window.umami !== undefined;

  const track = (event: string, data?: any) => {
    if (!isUmamiAvailable) {
      return;
    }

    window?.umami!.track(event, data);
  };

  const debounceTrack = useDebounceCallback(track, 500);

  useEffect(() => {
    if (!isUmamiAvailable) {
      return;
    }

    const email = document?.cookie
      ?.split(';')
      .find((pair) => pair.trim().split('=')[0] === 'demoeng_email')
      ?.split('=')[1];

    if (!email) {
      return;
    }

    window.umami!.identify({ email });
  }, [isUmamiAvailable]);

  return (
    <UmamiContext.Provider
      value={{
        track,
        debounceTrack,
      }}
    >
      {children}
    </UmamiContext.Provider>
  );
};

export const useUmami = () => useContext(UmamiContext);
