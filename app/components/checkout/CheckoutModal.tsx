'use client';

import {Dispatch, SetStateAction} from 'react';
import {Dialog, DialogBackdrop, DialogPanel} from '@headlessui/react';
import ElementsCheckoutContent from './ElementsCheckoutContent';
import {EmbeddedCheckoutContent} from './EmbeddedCheckoutContent';
import {HostedCheckoutContent} from './HostedCheckoutContent';
import {useConfigContext} from '@/app/contexts/ConfigContext';

interface CheckoutModalProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export default function CheckoutModal({open, setOpen}: CheckoutModalProps) {
  const {settings} = useConfigContext();

  return (
    <Dialog open={open} onClose={setOpen} className="relative z-50">
      <DialogBackdrop
        transition
        className="data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in fixed inset-0 bg-gray-500/75 transition-opacity"
      />

      <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className={`${!settings?.checkoutIntegration || settings?.checkoutIntegration === 'elements' ? 'sm:max-w-4xl' : 'sm:max-w-md'} data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in data-closed:sm:translate-y-0 data-closed:sm:scale-95 relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:p-6`}
          >
            {(!settings?.checkoutIntegration ||
              settings?.checkoutIntegration === 'elements') && (
              <ElementsCheckoutContent />
            )}
            {settings?.checkoutIntegration === 'hosted' && (
              <HostedCheckoutContent />
            )}
            {settings?.checkoutIntegration === 'embedded' && (
              <EmbeddedCheckoutContent />
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
