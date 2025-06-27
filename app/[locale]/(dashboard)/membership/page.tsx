'use client';

import {useConfigContext} from '@/app/contexts/ConfigContext';
import {useProductTranslation} from '@/app/hooks/useProductTranslation';
import fetchClient from '@/app/utils/fetchClient';
import {formatPrice} from '@/app/utils/helpers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {CreditCardIcon} from '@heroicons/react/24/solid';
import {useSession} from 'next-auth/react';
import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import type {Stripe} from 'stripe';

const MembershipPage = () => {
  const {t} = useTranslation();
  const {tp} = useProductTranslation();

  const [membershipPrice, setMembershipPrice] = useState<
    (Omit<Stripe.Price, 'product'> & {product: Stripe.Product}) | null
  >(null);

  const [subscription, setSubscription] = useState<
    Stripe.Subscription | null | undefined
  >(undefined);

  const isLoading = membershipPrice === null || subscription === undefined;

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembershipPrice = async () => {
      const response = await fetchClient('/api/prices/membership');

      if (response.status === 200) {
        setMembershipPrice(response.data);
      } else {
        if ('error' in response.data) {
          setError(response.data.error);
        } else {
          setError(
            'An unknown error occurred while fetching the membership price.'
          );
        }
      }
    };

    const fetchSubscription = async () => {
      const response = await fetchClient('/api/customers/membership');

      if (response.status === 200) {
        setSubscription(response.data);
      }
    };

    fetchMembershipPrice();
    fetchSubscription();
  }, []);

  const isEnrolled = subscription !== null;

  const [isEnrolling, setIsEnrolling] = useState(false);

  const enroll = async () => {
    setIsEnrolling(true);

    try {
      const response = await fetchClient(
        '/api/subscriptions/enroll-in-membership',
        {
          method: 'POST',
        }
      );

      if (response.status === 200) {
        setSubscription(response.data);
      } else {
        if ('error' in response.data) {
          setError(response.data.error);
        } else {
          setError(
            'An unknown error occurred while enrolling in the membership.'
          );
        }
      }
    } catch (error) {
      console.error(
        'An error occurred while enrolling in the membership.',
        error
      );
    } finally {
      setIsEnrolling(false);
    }
  };

  const {data: session} = useSession();

  const availableBalance = session?.user.availableBalance ?? 0;

  const hasSufficientBalance =
    availableBalance >= (membershipPrice?.unit_amount ?? 0);

  const {settings} = useConfigContext();

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <div className="rounded-md border border-red-600 bg-red-100 p-4">
          {error}
        </div>
      ) : (
        <>
          {!isLoading ? (
            <div className="grid gap-y-4">
              <h1 className="text-3xl font-bold">
                {tp(membershipPrice.product).name}
              </h1>
              <h3 className="text-lg font-medium">
                {t('dashboard.membership.enroll')}
              </h3>
              <div>
                <div className="grid w-full grid-cols-12 gap-5 rounded-md bg-white px-4 py-6">
                  <div className="col-span-2">
                    <p className="font-medium text-secondary">
                      {t('dashboard.membership.price')}
                    </p>
                  </div>
                  <div className="col-span-10">
                    <p className="font-bold">
                      {formatPrice(
                        membershipPrice.unit_amount ?? 0,
                        settings?.language,
                        session?.user.stripeAccount.default_currency ?? 'usd'
                      )}{' '}
                      {t(
                        `dashboard.membership.perTimeUnits.${membershipPrice.recurring?.interval}`
                      )}
                    </p>
                  </div>
                  <div className="col-span-2 flex flex-col justify-center">
                    <p className="font-medium text-secondary">
                      {t('dashboard.membership.features')}
                    </p>
                  </div>
                  <div className="col-span-10">
                    <ul className="list-disc pl-5">
                      {tp(membershipPrice.product).marketing_features.map(
                        (feature) => (
                          <li key={feature}>{feature}</li>
                        )
                      )}
                    </ul>
                  </div>
                  <div className="col-span-2 flex flex-col justify-center">
                    <p className="font-medium text-secondary">
                      {t('dashboard.membership.payment_method')}
                    </p>
                  </div>
                  <div className="col-span-10">
                    <div className="max-w-xs">
                      <Select defaultValue="stripe_balance" disabled={true}>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'dashboard.membership.payment_method'
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stripe_balance">
                            {t('dashboard.membership.stripe_balance')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {t('dashboard.membership.disclaimer', {
                    enroll_now: t('dashboard.membership.enroll_now'),
                    amount: formatPrice(
                      membershipPrice.unit_amount ?? 0,
                      settings?.language,
                      session?.user.stripeAccount.default_currency ?? 'usd'
                    ),
                    interval: t(
                      `dashboard.membership.perTimeUnits.${membershipPrice.recurring?.interval}`
                    ),
                  })}
                </p>
              </div>
              <div>
                <button
                  disabled={isEnrolled || isEnrolling || !hasSufficientBalance}
                  className="hover:bg-primary/90 inline-flex h-10 w-fit items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#312356] px-4 py-2 text-base font-bold text-primary-foreground shadow ring-[#D3D1D7] ring-offset-background transition hover:shadow-md focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50"
                  onClick={enroll}
                >
                  <CreditCardIcon className="size-5 text-white" />
                  {isEnrolling
                    ? t('dashboard.membership.enrolling')
                    : isEnrolled
                      ? t('dashboard.membership.enrolled')
                      : t('dashboard.membership.enroll_now')}
                </button>
                {!hasSufficientBalance && (
                  <p className="mt-1 text-sm text-red-500">
                    {t('dashboard.membership.insufficient_balance', {
                      balance: formatPrice(
                        availableBalance,
                        settings?.language,
                        session?.user.stripeAccount.default_currency ?? 'usd'
                      ),
                    })}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="animate h-16 animate-pulse rounded-md bg-gray-200" />
              <div className="animate h-48 animate-pulse rounded-md bg-gray-200" />
              <div className="animate h-16 animate-pulse rounded-md bg-gray-200" />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MembershipPage;
