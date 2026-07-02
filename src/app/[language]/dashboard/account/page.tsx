'use client';

import { Card } from '@/components/common/Card';
import { ConnectAccountManagement } from '@stripe/react-connect-js';

const AccountPage = () => {
  return (
    <div>
      <Card accent='#77B32A'>
        <div id='connect-account-management'>
          <ConnectAccountManagement />
        </div>
      </Card>
    </div>
  );
};

export default AccountPage;
