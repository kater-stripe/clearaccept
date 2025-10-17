'use client';

import { ConnectNotificationBanner } from '@stripe/react-connect-js';
import { useState } from 'react';

export const ConnectNotificationsBannerWrapper = () => {
  const [hasNotifications, setHasNotifications] = useState(false);

  return (
    <div className={`${hasNotifications ? 'mt-4' : 'invisible'}`}>
      <div id='connect-notification-banner'>
        <ConnectNotificationBanner
          onNotificationsChange={({ total }) => {
            setHasNotifications(total > 0);
          }}
        />
      </div>
    </div>
  );
};
