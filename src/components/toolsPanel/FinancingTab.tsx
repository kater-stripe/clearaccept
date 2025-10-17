'use client';

import { useDemoConfig } from '@/context/DemoConfigContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import { type ComponentProps, useState } from 'react';
import { getLatestFinancingOffer as getLatestFinancingOfferAction } from '@/app/api/financing-offers/getLatestFinancingOffer';
import { Button } from './Button';
import { createFlexLoan as createFlexLoanAction } from '@/app/api/financing-offers/createFlexLoan';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { expireFinancingOffer as expireFinancingOfferAction } from '@/app/api/financing-offers/expireFinancingOffer';
import { approveApplication as approveApplicationAction } from '@/app/api/financing-offers/approveApplication';
import { rejectApplication as rejectApplicationAction } from '@/app/api/financing-offers/rejectApplication';
import { fullyRepayFinancingOffer as fullyRepayFinancingOfferAction } from '@/app/api/financing-offers/fullyRepayFinancingOffer';

type FinancingTabProps = Omit<ComponentProps<'div'>, 'children'>;

export const FinancingTab = ({ className, ...rest }: FinancingTabProps) => {
  const { account } = useDemoMerchant();
  const { stripeSecretKey } = useDemoConfig();

  const [
    waitingForFinancingOfferToUpdate,
    setWaitingForFinancingOfferToUpdate,
  ] = useState(false);

  const { data: latestFinancingOffer } = useQuery({
    queryKey: ['latest-financing-offer', account?.id, stripeSecretKey],
    queryFn: async () => {
      const result = await getLatestFinancingOfferAction({
        accountId: account!.id,
        stripeSecretKey,
      });

      if (
        waitingForFinancingOfferToUpdate &&
        result.status !== latestFinancingOffer?.status
      ) {
        window.location.reload();

        // We wait for the page to reload. This is a bit of a hack to ensure we don't update the state before the page has reloaded.
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      return result;
    },
    refetchInterval: waitingForFinancingOfferToUpdate ? 1000 : false,
  });

  const { mutate: createFlexLoan, isPending: isCreatingFlexLoan } = useMutation(
    {
      mutationKey: ['create-flex-loan', account?.id, stripeSecretKey],
      mutationFn: createFlexLoanAction,
      onSuccess: () => {
        setWaitingForFinancingOfferToUpdate(true);
      },
    },
  );

  const { mutate: expireFinancingOffer, isPending: isExpiringFinancingOffer } =
    useMutation({
      mutationKey: ['expire-financing-offer', stripeSecretKey],
      mutationFn: expireFinancingOfferAction,
      onSuccess: () => {
        setWaitingForFinancingOfferToUpdate(true);
      },
    });

  const {
    mutate: approveApplication,
    isPending: isApprovingApplication,
    error: approveApplicationError,
  } = useMutation({
    mutationKey: ['approve-application', stripeSecretKey],
    mutationFn: approveApplicationAction,
    onSuccess: (result) => {
      if (result?.message) {
        throw new Error(result.message);
      }

      setWaitingForFinancingOfferToUpdate(true);
    },
  });

  const {
    mutate: rejectApplication,
    isPending: isRejectingApplication,
    error: rejectApplicationError,
  } = useMutation({
    mutationKey: ['reject-application', stripeSecretKey],
    mutationFn: rejectApplicationAction,
    onSuccess: (result) => {
      if (result?.message) {
        throw new Error(result.message);
      }

      setWaitingForFinancingOfferToUpdate(true);
    },
  });

  const {
    mutate: fullyRepayFinancingOffer,
    isPending: isFullyRepayingFinancingOffer,
  } = useMutation({
    mutationKey: ['fully-repay-financing-offer', stripeSecretKey],
    mutationFn: fullyRepayFinancingOfferAction,
    onSuccess: () => {
      setWaitingForFinancingOfferToUpdate(true);
    },
  });

  const shouldShowDeliverFlexLoanAction =
    latestFinancingOffer?.status !== 'delivered' &&
    latestFinancingOffer?.status !== 'completed' &&
    latestFinancingOffer?.status !== 'accepted' &&
    latestFinancingOffer?.status !== 'paid_out';

  const shouldShowApprovalAction = latestFinancingOffer?.status === 'accepted';

  const shouldShowRejectionAction = latestFinancingOffer?.status === 'accepted';

  const shouldShowExpireAction =
    latestFinancingOffer?.status === 'completed' ||
    latestFinancingOffer?.status === 'delivered';

  const shouldShowFullyRepayAction =
    latestFinancingOffer?.status === 'paid_out';

  return (
    <div {...rest} className={`space-y-4 ${className}`}>
      {shouldShowDeliverFlexLoanAction && (
        <Button
          className='w-full'
          onClick={() => {
            createFlexLoan({ accountId: account!.id, stripeSecretKey });
          }}
          disabled={isCreatingFlexLoan || waitingForFinancingOfferToUpdate}
        >
          {isCreatingFlexLoan || waitingForFinancingOfferToUpdate ? (
            <LoadingSpinner className='size-4 h-5' strokeWidth={3} />
          ) : (
            'Deliver Flex Loan Offer'
          )}
        </Button>
      )}

      {latestFinancingOffer && shouldShowExpireAction && (
        <Button
          className='w-full'
          onClick={() =>
            expireFinancingOffer({
              offerId: latestFinancingOffer.id,
              stripeSecretKey,
            })
          }
          disabled={
            isExpiringFinancingOffer || waitingForFinancingOfferToUpdate
          }
        >
          {isExpiringFinancingOffer || waitingForFinancingOfferToUpdate ? (
            <LoadingSpinner className='size-4 h-5' strokeWidth={3} />
          ) : (
            'Expire Offer'
          )}
        </Button>
      )}
      {latestFinancingOffer && shouldShowFullyRepayAction && (
        <Button
          className='w-full'
          onClick={() =>
            fullyRepayFinancingOffer({
              offerId: latestFinancingOffer.id,
              stripeSecretKey,
            })
          }
          disabled={
            isFullyRepayingFinancingOffer || waitingForFinancingOfferToUpdate
          }
        >
          {isFullyRepayingFinancingOffer || waitingForFinancingOfferToUpdate ? (
            <LoadingSpinner className='size-4 h-5' strokeWidth={3} />
          ) : (
            'Fully Repay Offer'
          )}
        </Button>
      )}
      {shouldShowApprovalAction && (
        <div>
          <Button
            className='w-full'
            onClick={() =>
              approveApplication({
                offerId: latestFinancingOffer.id,
                stripeSecretKey,
              })
            }
            disabled={
              isApprovingApplication || waitingForFinancingOfferToUpdate
            }
          >
            {isApprovingApplication || waitingForFinancingOfferToUpdate ? (
              <LoadingSpinner className='size-4 h-5' strokeWidth={3} />
            ) : (
              'Approve Application'
            )}
          </Button>
          {approveApplicationError && (
            <p className='text-red-500 text-sm mt-2'>
              {approveApplicationError.message}
            </p>
          )}
        </div>
      )}
      {shouldShowRejectionAction && (
        <div>
          <Button
            className='w-full'
            onClick={() =>
              rejectApplication({
                offerId: latestFinancingOffer.id,
                stripeSecretKey,
              })
            }
            disabled={
              isRejectingApplication || waitingForFinancingOfferToUpdate
            }
          >
            {isRejectingApplication || waitingForFinancingOfferToUpdate ? (
              <LoadingSpinner className='size-4 h-5' strokeWidth={3} />
            ) : (
              'Reject Application'
            )}
          </Button>
          {rejectApplicationError && (
            <p className='text-red-500 text-sm mt-2'>
              {rejectApplicationError.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
