'use client';

import { Card } from '@/components/common/Card';
import { ConnectPayouts } from '@stripe/react-connect-js';

const PayoutsPage = () => {
  return (
    <div>
      <Card>
        <div id='connect-payouts'>
          <ConnectPayouts />
        </div>
      </Card>
    </div>
  );
};

export default PayoutsPage;
