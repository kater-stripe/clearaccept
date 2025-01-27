import {useConfigContext} from '@/app/contexts/ConfigContext';
import {PaymentElement} from '@stripe/react-stripe-js';
import {useTranslation} from 'react-i18next';

export default function PaymentElementWrapper() {
  const {t} = useTranslation();
  const {settings} = useConfigContext();

  const options = {
    layout: settings?.elementsStyle,
    defaultValues: {
      billingDetails: {
        name: 'Joseph Marough',
        phone: '2015550123',
        email: 'joseph.marough@example.com',
      },
    },
  };

  return (
    <div>
      <fieldset>
        <legend className="mb-4 text-lg font-bold text-gray-900">
          {t('checkout.payments_header')}
        </legend>

        <PaymentElement id="payment-element" options={options} />
      </fieldset>
    </div>
  );
}
