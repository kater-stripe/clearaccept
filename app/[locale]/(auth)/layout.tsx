'use client';

import Image from 'next/image';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import Container from '@/app/components/Container';
import {ArrowRight} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {useConfigContext} from '@/app/contexts/ConfigContext';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const {t} = useTranslation();
  const {settings} = useConfigContext();

  let header = t('auth.layout.manage');
  let subheader = t('auth.layout.pose_is_leading');

  if (pathname.includes('onboarding')) {
    header = t('auth.layout.sign_up');
    subheader = t('auth.layout.fill_form');
  }

  return (
    <div className="relative">
      <div className="flex min-h-screen min-w-[926px] justify-center space-x-20 px-6 py-[120px]">
        <div className="flex w-[900px]">
          <div className="fixed min-h-full max-w-sm space-y-4">
            <img
              className="mb-4 inline-block"
              src={settings?.customLogo || '/pose_red.svg'}
              alt="Pose"
              width={150}
              height={23}
            />
            <h1 className="text-4xl font-bold">{header}</h1>
            <p className="text-xl text-subdued">{subheader}</p>
            <Link
              href="mailto:support@pose.dev"
              className="flex flex-row items-center gap-x-1"
            >
              <div className="font-bold text-primary">
                {t('auth.layout.contact')}
              </div>
              <ArrowRight color="#221b35" size={18} className="mt-[1px]" />
            </Link>
            {/* Locale selector removed in favor of country-based localization */}
            {/* <p className="w-34 absolute bottom-20 left-0 h-24">
              <LocaleSelector />
            </p> */}
          </div>
          <div className="ml-auto min-w-[30rem]">
            <Container className="no-scrollbar overflow-scroll rounded-[16px] px-5 py-5">
              {children}
            </Container>
          </div>
        </div>
      </div>
      <img
        src={settings?.authImage || '/background.jpg'}
        alt="logo"
        sizes="100vw"
        className="fixed inset-0 z-[-1] h-full w-full min-w-[926px] overflow-hidden object-cover"
      />
    </div>
  );
}
