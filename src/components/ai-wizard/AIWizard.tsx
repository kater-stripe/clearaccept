'use client';

import { createCapitalOffer } from '@/app/api/financing-offers/createCapitalOffer';
import { getLatestFinancingOffer } from '@/app/api/financing-offers/getLatestFinancingOffer';
import { useDemoConfig } from '@/context/DemoConfigContext';
import { useDemoMerchant } from '@/context/DemoMerchantContext';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useMutation, useQuery } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Suggestion = {
    id: string;
    message: string;
    actionLabel: string;
    action: () => Promise<void>;
};

const LoadingSpinner = () => (
    <svg
        className="animate-spin h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
    >
        <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
        />
        <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
    </svg>
);

export const AIWizard = () => {
    const { language, stripeSecretKey } = useDemoConfig();
    const { account, isSignedIn, isCapitalEligible } = useDemoMerchant();
    const router = useRouter();
    const pathname = usePathname();

    console.log('pathname', pathname);

    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(true);
    // Track which route we last showed the suggestion on
    const [lastShownOnRoute, setLastShownOnRoute] = useState<string | null>(null);

    const pathnameWithoutLanguage = pathname.replace(`/${language}`, '');

    // Get merchant country for capital offer creation
    const merchantCountry = (account?.identity?.country ?? 'US') as 'US' | 'GB';

    // Query for existing financing offer
    const { data: latestFinancingOffer, refetch: refetchFinancingOffer, isLoading: isLoadingFinancingOffer } =
        useQuery({
            queryKey: ['ai-wizard-financing-offer', account?.id, stripeSecretKey],
            queryFn: async () => {
                if (!account?.id) return null;
                return getLatestFinancingOffer({
                    accountId: account.id,
                    stripeSecretKey,
                });
            },
            enabled: isSignedIn && !!account && isCapitalEligible,
        });

    // Mutation for creating capital offer
    const {
        mutateAsync: createOffer,
        isPending: isCreatingOffer,
    } = useMutation({
        mutationKey: ['ai-wizard-create-capital-offer', account?.id],
        mutationFn: createCapitalOffer,
    });

    // Pages where we show the capital suggestion
    const capitalSuggestionPages = ['/dashboard/payments', '/dashboard'];
    const isOnCapitalSuggestionPage = capitalSuggestionPages.includes(pathnameWithoutLanguage);

    // Check if we should show a capital offer suggestion
    const shouldShowCapitalSuggestion = useMemo(() => {
        if (!isCapitalEligible) return false;
        if (!isSignedIn || !account) return false;

        // Only show on specific pages
        if (!isOnCapitalSuggestionPage) return false;

        // Wait for financing offer query to complete before deciding
        if (isLoadingFinancingOffer) return false;

        // Don't show if there's already an active financing offer
        if (
            latestFinancingOffer &&
            ['accepted', 'paid_out'].includes(latestFinancingOffer.status)
        ) {
            return false;
        }

        console.log('shouldShowCapitalSuggestion', true);

        return true;
    }, [
        isCapitalEligible,
        isSignedIn,
        account,
        isOnCapitalSuggestionPage,
        isLoadingFinancingOffer,
        latestFinancingOffer,
    ]);

    // Handle capital offer action
    const handleCapitalOfferAction = async () => {
        if (!account) return;

        // Create offer if one doesn't exist or isn't active
        if (
            !latestFinancingOffer ||
            !['delivered', 'accepted', 'paid_out'].includes(
                latestFinancingOffer.status,
            )
        ) {
            await createOffer({
                accountId: account.id,
                country: merchantCountry,
                stripeSecretKey,
            });
            // Wait a moment for the offer to be created
            await new Promise((resolve) => setTimeout(resolve, 500));
            await refetchFinancingOffer();
        }

        // Navigate to capital page
        router.push(`/${language}/dashboard/capital`);
        setIsOpen(false);
        setIsMinimized(true);
    };

    // Current suggestion based on route and state
    const currentSuggestion: Suggestion | null = useMemo(() => {
        if (shouldShowCapitalSuggestion) {
            return {
                id: 'capital-offer',
                message:
                    'Based on your data signals, it appears your cash flow may be constrained and you could use a loan.',
                actionLabel: 'Review capital offer',
                action: handleCapitalOfferAction,
            };
        }
        return null;
    }, [shouldShowCapitalSuggestion, account, merchantCountry]);

    // Auto-expand when there's a new suggestion on a new route
    useEffect(() => {
        // Only auto-show if we have a suggestion and haven't shown it on this route yet
        if (currentSuggestion && lastShownOnRoute !== pathnameWithoutLanguage) {
            setIsOpen(true);
            setIsMinimized(false);
            setLastShownOnRoute(pathnameWithoutLanguage);
        }
    }, [currentSuggestion, pathnameWithoutLanguage, lastShownOnRoute]);

    // Don't render if not signed in
    if (!isSignedIn || !account) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {/* Chat Panel */}
            {isOpen && !isMinimized && (
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-brand-primary to-brand-secondary px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <SparklesIcon className="h-5 w-5 text-white" />
                            <span className="font-semibold text-white text-sm">
                                AI Assistant
                            </span>
                        </div>
                        <button
                            onClick={() => {
                                setIsMinimized(true);
                            }}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        {currentSuggestion ? (
                            <div className="space-y-4">
                                {/* AI Message */}
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
                                        <SparklesIcon className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="flex-1 bg-gray-50 rounded-xl rounded-tl-none px-4 py-3">
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                            {currentSuggestion.message}
                                        </p>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={currentSuggestion.action}
                                    disabled={isCreatingOffer}
                                    className="w-full bg-brand-primary hover:bg-brand-primary/90 disabled:bg-brand-primary/70 text-brand-primary-contrasting font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    {isCreatingOffer ? (
                                        <LoadingSpinner />
                                    ) : (
                                        currentSuggestion.actionLabel
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                    <SparklesIcon className="h-6 w-6 text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-500">
                                    No suggestions right now.
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    I&apos;ll notify you when I have insights.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => {
                    if (isMinimized) {
                        setIsOpen(true);
                        setIsMinimized(false);
                    } else {
                        setIsMinimized(true);
                    }
                }}
                className={`group relative w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${currentSuggestion
                    ? 'bg-gradient-to-br from-brand-primary to-brand-secondary hover:scale-105'
                    : 'bg-white border border-gray-200 hover:border-brand-primary'
                    }`}
            >
                <SparklesIcon
                    className={`h-6 w-6 transition-colors ${currentSuggestion
                        ? 'text-white'
                        : 'text-gray-400 group-hover:text-brand-primary'
                        }`}
                />

                {/* Notification Badge */}
                {currentSuggestion && isMinimized && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-primary rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-[10px] text-white font-bold">1</span>
                    </span>
                )}
            </button>
        </div>
    );
};

