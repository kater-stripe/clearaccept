'use client';

import {
    Dialog,
    DialogBackdrop,
    DialogPanel,
    DialogTitle,
} from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Stripe } from 'stripe';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { updateBalanceSettings } from '@/app/api/balance-settings/updateBalanceSettings';
import { Button } from '@/components/common/Button';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import type { CurrencyCode } from '@/constants/currencyCodes';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

type UseForPayoutsModalProps = {
    open: boolean;
    onClose: () => void;
    financialAccount: Stripe.V2.MoneyManagement.FinancialAccount;
    isCurrentlyEnabled?: boolean;
};

type TransferMode = 'all' | 'target';

export const UseForPayoutsModal = ({
    open,
    onClose,
    financialAccount,
    isCurrentlyEnabled = false,
}: UseForPayoutsModalProps) => {
    const { t } = useTranslation();
    const { stripeSecretKey } = useDemoConfig();
    const { account } = useDemoMerchant();
    const queryClient = useQueryClient();

    const [transferMode, setTransferMode] = useState<TransferMode>('all');
    const [targetAmount, setTargetAmount] = useState<number>(0);
    const [showSuccess, setShowSuccess] = useState(false);

    // Get the primary currency from the FA
    const primaryCurrency = Object.keys(
        financialAccount.balance?.available || {},
    )[0] as CurrencyCode | undefined;

    const { mutate: enableAutoPayouts, isPending } = useMutation({
        mutationFn: async () => {
            if (!account || !primaryCurrency) {
                throw new Error('Missing required data');
            }

            return updateBalanceSettings({
                financialAccountId: financialAccount.id,
                currency: primaryCurrency,
                transferAllFunds: transferMode === 'all',
                targetAmount: transferMode === 'target' ? targetAmount : undefined,
                enabled: true,
                accountId: account.id,
                stripeSecretKey,
            });
        },
        onSuccess: (result) => {
            if (result.success) {
                setShowSuccess(true);
                queryClient.invalidateQueries({ queryKey: ['balance-settings'] });
                setTimeout(() => {
                    setShowSuccess(false);
                    onClose();
                }, 2000);
            }
        },
    });

    const { mutate: disableAutoPayouts, isPending: isDisabling } = useMutation({
        mutationFn: async () => {
            if (!account || !primaryCurrency) {
                throw new Error('Missing required data');
            }

            return updateBalanceSettings({
                financialAccountId: financialAccount.id,
                currency: primaryCurrency,
                enabled: false,
                accountId: account.id,
                stripeSecretKey,
            });
        },
        onSuccess: (result) => {
            if (result.success) {
                queryClient.invalidateQueries({ queryKey: ['balance-settings'] });
                onClose();
            }
        },
    });

    if (showSuccess) {
        return (
            <Dialog open={open} onClose={() => { }} className='relative z-10'>
                <DialogBackdrop
                    transition
                    className='fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in'
                />
                <div className='fixed inset-0 z-10 w-screen overflow-y-auto'>
                    <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
                        <DialogPanel className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl sm:my-8 sm:w-full sm:max-w-md sm:p-6'>
                            <div className='flex flex-col items-center justify-center py-8'>
                                <div className='w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4'>
                                    <CheckCircleIcon className='w-10 h-10 text-green-600' />
                                </div>
                                <h3 className='text-lg font-semibold text-gray-900'>
                                    {t('modals.use-for-payouts.success')}
                                </h3>
                                <p className='mt-2 text-sm text-gray-500 text-center'>
                                    {t('modals.use-for-payouts.success-description', {
                                        accountName: financialAccount.display_name,
                                    })}
                                </p>
                            </div>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={onClose} className='relative z-10'>
            <DialogBackdrop
                transition
                className='fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in'
            />

            <div className='fixed inset-0 z-10 w-screen overflow-y-auto'>
                <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
                    <DialogPanel
                        transition
                        className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in sm:my-8 sm:w-full sm:max-w-md sm:p-6 sm:data-closed:translate-y-0 sm:data-closed:scale-95'
                    >
                        <div>
                            <DialogTitle
                                as='h3'
                                className='text-lg font-semibold text-gray-900'
                            >
                                {isCurrentlyEnabled
                                    ? t('modals.use-for-payouts.title-manage')
                                    : t('modals.use-for-payouts.title')}
                            </DialogTitle>
                            <p className='mt-1 text-sm text-gray-500'>
                                {t('modals.use-for-payouts.description', {
                                    accountName: financialAccount.display_name,
                                })}
                            </p>
                        </div>

                        {!isCurrentlyEnabled && (
                            <div className='mt-6 space-y-4'>
                                {/* Transfer All Funds Option */}
                                <label className='flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-brand-primary transition-colors'>
                                    <input
                                        type='radio'
                                        name='transferMode'
                                        value='all'
                                        checked={transferMode === 'all'}
                                        onChange={() => setTransferMode('all')}
                                        className='mt-0.5 h-4 w-4 text-brand-primary focus:ring-brand-primary'
                                    />
                                    <div>
                                        <p className='text-sm font-medium text-gray-900'>
                                            {t('modals.use-for-payouts.transfer-all')}
                                        </p>
                                        <p className='text-sm text-gray-500'>
                                            {t('modals.use-for-payouts.transfer-all-description')}
                                        </p>
                                    </div>
                                </label>

                                {/* Target Amount Option */}
                                <label className='flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-brand-primary transition-colors'>
                                    <input
                                        type='radio'
                                        name='transferMode'
                                        value='target'
                                        checked={transferMode === 'target'}
                                        onChange={() => setTransferMode('target')}
                                        className='mt-0.5 h-4 w-4 text-brand-primary focus:ring-brand-primary'
                                    />
                                    <div className='flex-1'>
                                        <p className='text-sm font-medium text-gray-900'>
                                            {t('modals.use-for-payouts.target-amount')}
                                        </p>
                                        <p className='text-sm text-gray-500'>
                                            {t('modals.use-for-payouts.target-amount-description')}
                                        </p>
                                        {transferMode === 'target' && primaryCurrency && (
                                            <div className='mt-3'>
                                                <CurrencyInput
                                                    label={t('modals.use-for-payouts.target-amount-label')}
                                                    onChange={setTargetAmount}
                                                    currency={primaryCurrency}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </label>

                                {/* Info message */}
                                <div className='p-3 bg-blue-50 border border-blue-100 rounded-lg'>
                                    <p className='text-sm text-blue-800'>
                                        {t('modals.use-for-payouts.info')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {isCurrentlyEnabled && (
                            <div className='mt-6'>
                                <div className='p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-lg'>
                                    <p className='text-sm text-brand-900 font-medium'>
                                        {t('modals.use-for-payouts.currently-enabled')}
                                    </p>
                                    <p className='text-sm text-gray-500 mt-1'>
                                        {t('modals.use-for-payouts.currently-enabled-description', {
                                            accountName: financialAccount.display_name,
                                        })}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className='mt-6 flex gap-3'>
                            <button
                                type='button'
                                onClick={onClose}
                                disabled={isPending || isDisabling}
                                className='flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50'
                            >
                                {t('modals.use-for-payouts.cancel')}
                            </button>
                            {isCurrentlyEnabled ? (
                                <Button
                                    onClick={() => disableAutoPayouts()}
                                    disabled={isDisabling}
                                    className='flex-1'
                                    colorMode='dark'
                                >
                                    {isDisabling
                                        ? t('modals.use-for-payouts.disabling')
                                        : t('modals.use-for-payouts.disable')}
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => enableAutoPayouts()}
                                    disabled={isPending || !primaryCurrency}
                                    className='flex-1'
                                >
                                    {isPending
                                        ? t('modals.use-for-payouts.enabling')
                                        : t('modals.use-for-payouts.enable')}
                                </Button>
                            )}
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
};

