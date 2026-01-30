'use client';

import '@/styles/global.css';

import { DemoConfigProvider } from '@/context/DemoConfigContext';
import { DemoCustomerProvider } from '@/context/DemoCustomerContext';
import { CartProvider } from '@/context/CartContext';
import Script from 'next/script';
import { Suspense, type PropsWithChildren } from 'react';
import { QueryClientProvider } from '@/context/QueryClientContext';
import { UmamiProvider } from '@/context/UmamiContext';
import { DemoMerchantProvider } from '@/context/DemoMerchantContext';
import { HandleCallbacksProvider } from '@/components/checkout/HandleCallbacks';
import { ToolsPanelWrapper } from '@/components/toolsPanel/ToolsPanelWrapper';

const RootLayout = ({ children }: PropsWithChildren) => {
  const nodeEnv = process.env.NODE_ENV;
  const isDemogen = !!process.env.DEMOGEN;
  return (
    <html>
      <head>
        <meta name='robots' content='noindex, nofollow' />

        {/* POSTHOG & UMAMI - DO NOT REMOVE */}
        <Script id='environment' strategy='beforeInteractive'>
          {`
  function getEnvironment() {
    const hostname = window.location.hostname;
    const nodeEnv = '${nodeEnv}';
    const isDemogen = ${isDemogen};
    
    if (nodeEnv === 'development') {
      return 'dev';
      } else if (nodeEnv === 'production' && hostname === 'pose.stripedemos.com' || hostname === 'zenflow.stripedemos.com') {
        return 'prod';
      } else if (nodeEnv === 'production' && hostname === 'pose-uat.stripedemos.com' || hostname === 'zenflow-uat.stripedemos.com') {
        return 'uat';
      } else if (isDemogen) {
        return 'personalized';
      } else {
        return 'other'
      }
  }
  
  window.currentEnvironment = getEnvironment();
          `}
        </Script>
        <Script id='posthog' strategy='beforeInteractive'>
          {`!function(t,e){var o,n,p,r;e.__SV||(window.posthog && window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init hi Er $r ui br Sr capture Ri calculateEventProperties Tr register register_once register_for_session unregister unregister_for_session Or getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty Rr Pr createPersonProfile Cr mr Fr opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing kr debug L Ir getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init('phc_FMazirhWDLORv5hyeQ3vC7Tfk9iCUg3exMHRhGxYzBL', {
        api_host: 'https://analytics-hub-v2.stripedemos.com',
        defaults: '2025-05-24',
        person_profiles: 'always',
            loaded: function(posthog) {
        posthog.register({
            environment: window.currentEnvironment,
            app_type: 'zenflow'
        });
        console.log('PostHog properties registered successfully');
    }
    })
          `}
        </Script>
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
                      <ToolsPanelWrapper>
                        <HandleCallbacksProvider>
                          <div className='bg-white'>{children}</div>
                        </HandleCallbacksProvider>
                      </ToolsPanelWrapper>
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
