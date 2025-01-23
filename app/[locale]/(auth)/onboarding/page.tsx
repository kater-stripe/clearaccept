'use client';

import {ConnectAccountOnboarding} from '@stripe/react-connect-js';
import EmbeddedComponentContainer from '@/app/components/EmbeddedComponentContainer';
import React from 'react';
import {useConfigContext} from '@/app/contexts/ConfigContext';

export default function Onboarding() {
  const {settings} = useConfigContext();

  return (
    <EmbeddedComponentContainer>
      <ConnectAccountOnboarding
        onExit={() => {
          window.location.href = `/${settings?.language || 'en'}`;
        }}
      />
    </EmbeddedComponentContainer>
  );
}
