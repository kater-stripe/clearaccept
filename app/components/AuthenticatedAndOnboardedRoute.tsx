'use client';

import {useSession} from 'next-auth/react';
import {useRouter} from 'next/navigation';
import {useEffect} from 'react';
import {useConfigContext} from '../contexts/ConfigContext';
import LoadingOverlay from './LoadingOverlay';

export default function AuthenticatedAndOnboardedRoute({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const {data: session, status} = useSession();
  const {settings} = useConfigContext();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/${settings?.language}/signup${window.location.search}`);
    } else if (
      status === 'authenticated' &&
      session.user?.stripeAccount?.charges_enabled === false
    ) {
      router.replace(`/${settings?.language}/onboarding`);
    }
  }, [status, session, router, settings?.language]);

  if (status === 'loading' || status === 'unauthenticated') {
    return <LoadingOverlay />;
  }

  // Only render children if authenticated and onboarded
  return status === 'authenticated' &&
    session.user?.stripeAccount?.charges_enabled !== false ? (
    <>{children}</>
  ) : null;
}
