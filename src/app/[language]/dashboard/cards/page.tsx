'use client';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { CardsList } from '@/components/issuing/CardsList';
import { CardholdersList } from '@/components/issuing/CardholdersList';
import { CreateCardModal } from '@/components/issuing/CreateCardModal';
import { CreateCardholderModal } from '@/components/issuing/CreateCardholderModal';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { PlusIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import type Stripe from 'stripe';

const CardsPage = () => {
  const { isCapabilityActive } = useDemoMerchant();
  const { language } = useDemoConfig();
  const { t } = useTranslation();
  const router = useRouter();

  const [isCreateCardModalOpen, setIsCreateCardModalOpen] = useState(false);
  const [isCreateCardholderModalOpen, setIsCreateCardholderModalOpen] =
    useState(false);

  if (!isCapabilityActive('commercial.stripe.charge_card')) {
    return (
      <Card>
        <p className='text-gray-500 text-sm'>
          {t('dashboard.issuing.capability-required')}
        </p>
      </Card>
    );
  }

  return (
    <div>
      <CreateCardModal
        open={isCreateCardModalOpen}
        onClose={() => setIsCreateCardModalOpen(false)}
      />
      <CreateCardholderModal
        open={isCreateCardholderModalOpen}
        onClose={() => setIsCreateCardholderModalOpen(false)}
      />

      <Card>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold'>
            {t('dashboard.issuing.cardholders.title')}
          </h2>
          <Button
            onClick={() => setIsCreateCardholderModalOpen(true)}
          >
            <UserPlusIcon className='size-4' />
            {t('dashboard.issuing.create-cardholder.button')}
          </Button>
        </div>

        <CardholdersList />
      </Card>

      <Card className='mt-4'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold'>
            {t('dashboard.expenses.issuing-cards')}
          </h2>
          <Button onClick={() => setIsCreateCardModalOpen(true)}>
            <PlusIcon className='size-4' />
            {t('dashboard.issuing.create-card.button')}
          </Button>
        </div>

        <CardsList
          onCardClick={(card: Stripe.Issuing.Card) =>
            router.push(`/${language}/dashboard/cards/${card.id}`)
          }
        />
      </Card>
    </div>
  );
};

export default CardsPage;
