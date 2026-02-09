'use client';

import {
    Dialog,
    DialogBackdrop,
    DialogPanel,
    DialogTitle,
} from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';

type ConfirmationModalProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
    destructive?: boolean;
};

export const ConfirmationModal = ({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel,
    cancelLabel,
    destructive = false,
}: ConfirmationModalProps) => {
    return (
        <Dialog open={open} onClose={onClose} className='relative z-50'>
            <DialogBackdrop
                transition
                className='fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in'
            />

            <div className='fixed inset-0 z-50 w-screen overflow-y-auto'>
                <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
                    <DialogPanel
                        transition
                        className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200 data-enter:ease-out data-leave:ease-in sm:my-8 sm:w-full sm:max-w-sm sm:p-6 sm:data-closed:translate-y-0 sm:data-closed:scale-95'
                    >
                        <div className='flex items-start gap-4'>
                            <div
                                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${destructive ? 'bg-red-100' : 'bg-blue-100'
                                    }`}
                            >
                                <ExclamationTriangleIcon
                                    className={`size-5 ${destructive ? 'text-red-600' : 'text-blue-600'}`}
                                />
                            </div>
                            <div>
                                <DialogTitle
                                    as='h3'
                                    className='text-base font-semibold text-gray-900'
                                >
                                    {title}
                                </DialogTitle>
                                <p className='mt-2 text-sm text-gray-500'>{description}</p>
                            </div>
                        </div>

                        <div className='flex gap-3 mt-5 justify-end'>
                            <Button
                                className='bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                type='button'
                                onClick={onClose}
                            >
                                {cancelLabel}
                            </Button>
                            <Button
                                className={
                                    destructive
                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                        : undefined
                                }
                                type='button'
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                            >
                                {confirmLabel}
                            </Button>
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
};

