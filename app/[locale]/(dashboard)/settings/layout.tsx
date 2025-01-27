'use client';

import {signOut} from 'next-auth/react';
import SubNav from '@/app/components/SubNav';
import {Button} from '@/components/ui/button';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {useTranslation} from 'react-i18next';
import {useConfigContext} from '@/app/contexts/ConfigContext';

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const {t} = useTranslation();
  const {settings} = useConfigContext();

  return (
    <>
      <header className="flex flex-row justify-between">
        <div className="flex flex-row">
          <Avatar className="mr-5 h-10 w-10">
            <AvatarImage src="/avatar.png" alt="profile" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>{' '}
          <h1 className="text-3xl font-bold">
            {t('dashboard.settings.my_studio')}
          </h1>
        </div>
        <div className="flex flex-row justify-between">
          <SubNav
            base={`/${settings?.language}/settings`}
            routes={[
              {
                path: `/${settings?.language}/settings`,
                label: t('dashboard.settings.settings'),
              },
              {
                path: `/${settings?.language}/settings/paymentmethods`,
                label: t('dashboard.settings.payment_methods'),
              },
            ]}
          />
          <div>
            <Button
              className="text-md ml-2 self-end p-2 hover:bg-white/80"
              variant="ghost"
              onClick={() =>
                signOut({
                  callbackUrl: `${new URL(window.location.href).origin}/default/login`,
                })
              }
            >
              {t('dashboard.settings.sign_out')}
            </Button>
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
