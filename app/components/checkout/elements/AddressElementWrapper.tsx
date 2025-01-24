import {AddressElement} from '@stripe/react-stripe-js';
import {useTranslation} from 'react-i18next';

interface AddressElementWrapperProps {
  addressChanged: (event: any) => any;
}

export default function AddressElementWrapper({
  addressChanged,
}: AddressElementWrapperProps) {
  const {t} = useTranslation();

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900">
        {t('checkout.address_header')}
      </h2>
      <div id="address-element" className="content-element mt-4">
        <AddressElement
          onChange={addressChanged}
          options={{mode: 'shipping'}}
        />
      </div>
    </div>
  );
}
