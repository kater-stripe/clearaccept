'use client';

import { Card } from '../common/Card';
import { ConnectAccountOnboarding } from '@stripe/react-connect-js';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useState } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { useTranslation } from 'react-i18next';
import { Alert } from '../common/Alert';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { createHostedOnboardingLink as createHostedOnboardingLinkAction } from '@/app/api/accounts/createHostedOnboardingLink';
import Link from 'next/link';

export const SignInCard = () => {
  const { stripeSecretKey, language, onboardingType, onboardCollectionFields } =
    useDemoConfig();

  const router = useRouter();

  const {
    getAccountByEmail,
    isGettingAccountByEmail,
    getAccountByEmailError,
    email: merchantEmail,
    isSignedIn,
    account,
  } = useDemoMerchant();

  const { t } = useTranslation();

  const [email, setEmail] = useState(merchantEmail);

  const {
    mutateAsync: createHostedOnboardingLink,
    isPending: isCreatingHostedOnboardingLink,
    data: hostedOnboardingLink,
  } = useMutation({
    mutationFn: createHostedOnboardingLinkAction,
    onSuccess: ({ url }) => {
      /**
       * As soon as a hosted onboarding link is created, we open it in the current tab.
       */
      window.open(url, '_self');
    },
  });

  return (
    <Card>
      {isSignedIn &&
      onboardingType === 'embedded' &&
      account &&
      ((account.object === 'v2.core.account' &&
        account.requirements?.summary?.minimum_deadline?.status ===
          'past_due') ||
        (account.object !== 'v2.core.account' &&
          !account.details_submitted)) ? (
        <div id='connect-account-onboarding'>
          <ConnectAccountOnboarding
            onExit={async () => {
              /**
               * Refreshes the account data from Stripe, which is good practice after onboarding is completed.
               */
              await getAccountByEmail({
                email:
                  account?.object === 'v2.core.account'
                    ? account?.contact_email!
                    : account?.email!,
                stripeSecretKey,
              });

              router.push(`/${language}/dashboard`);
            }}
            collectionOptions={{
              fields: onboardCollectionFields,
              futureRequirements: 'include',
            }}
          />
        </div>
      ) : (
        <form
          className='flex flex-col gap-6'
          onSubmit={async (e) => {
            e.preventDefault();

            if (!email) {
              return;
            }

            const account = await getAccountByEmail({
              email,
              stripeSecretKey,
            });

            if (onboardingType === 'hosted') {
              if ('message' in account) {
                return;
              }

              if (account.object === 'v2.core.account') {
                if (
                  account.requirements?.summary?.minimum_deadline?.status !==
                  'past_due'
                ) {
                  router.push(`/${language}/dashboard`);
                  return;
                }
              } else {
                if (account.details_submitted) {
                  router.push(`/${language}/dashboard`);
                  return;
                }
              }

              createHostedOnboardingLink({
                accountId: account!.id,
                stripeSecretKey,
                returnRefreshUrl: `${window.location.origin}${window.location.pathname}`,
                onboardCollectionFields,
              });
            }
          }}
        >
          <div>
            <p className='text-xl font-semibold text-brand-secondary'>
              {t('sign-in.heading')}
            </p>
            <p>
              {t('sign-in.no-account')}{' '}
              <Link
                href={`/${language}/sign-up`}
                className='inline-flex items-center gap-x-1 font-bold underline text-brand-primary'
              >
                <span>{t('sign-in.sign-up')}</span>
                <ArrowRightIcon
                  className='size-4 flex-shrink-0'
                  strokeWidth={2.5}
                />
              </Link>
            </p>
          </div>
          {getAccountByEmailError && (
            <Alert>{t(getAccountByEmailError.message)}</Alert>
          )}
          <Input
            label={t('sign-in.email.label')}
            value={email ?? ''}
            onChange={(value) => setEmail(value)}
            placeholder='jenny@example.com'
            required={true}
          />
          <Input
            label={t('sign-in.password.label')}
            value='abcdefghi'
            type='password'
            required={true}
          />
          <Button
            type='submit'
            disabled={
              isGettingAccountByEmail ||
              isCreatingHostedOnboardingLink ||
              !!hostedOnboardingLink
            }
            className='w-32 h-10'
          >
            {isGettingAccountByEmail ||
            isCreatingHostedOnboardingLink ||
            !!hostedOnboardingLink ? (
              <LoadingSpinner className='size-4' strokeWidth={3} />
            ) : (
              <>
                {t('sign-in.button.text')}
                <ArrowRightIcon className='size-4' strokeWidth={2.5} />
              </>
            )}
          </Button>
        </form>
      )}
    </Card>
  );
};
