'use client';

import '@/styles/global.css';

import { DemoConfigProvider } from '@/context/DemoConfigContext';
import { DemoCustomerProvider } from '@/context/DemoCustomerContext';
import { ToolsPanelProvider } from '@/context/ToolsPanelContext';
import { CartProvider } from '@/context/CartContext';
import Script from 'next/script';
import { Suspense, type PropsWithChildren } from 'react';
import { QueryClientProvider } from '@/context/QueryClientContext';
import { UmamiProvider } from '@/context/UmamiContext';
import { DemoMerchantProvider } from '@/context/DemoMerchantContext';
import { HandleCallbacksProvider } from '@/components/checkout/HandleCallbacks';

const RootLayout = ({ children }: PropsWithChildren) => {
  return (
    <html>
      <head>
        <meta name='robots' content='noindex, nofollow' />

        {/* ANALYTICS - DO NOT REMOVE */}
        <Script
          src='https://analytics-hub.stripedemos.com/script.js'
          data-website-id='c6478f63-f260-4f70-b1ab-c6938c39426b'
          strategy='beforeInteractive'
        />
      </head>
      <body className='antialiased'>
        <QueryClientProvider>
          <Suspense>
            <UmamiProvider>
              <DemoConfigProvider>
                <DemoMerchantProvider>
                  <CartProvider>
                    <DemoCustomerProvider>
                      <ToolsPanelProvider>
                        <HandleCallbacksProvider>
                          {children}
                        </HandleCallbacksProvider>
                      </ToolsPanelProvider>
                    </DemoCustomerProvider>
                  </CartProvider>
                </DemoMerchantProvider>
              </DemoConfigProvider>
            </UmamiProvider>
          </Suspense>
        </QueryClientProvider>
      </body>
    </html>
  );
};

export default RootLayout;
