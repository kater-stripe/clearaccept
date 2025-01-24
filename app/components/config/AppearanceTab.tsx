/* eslint-disable i18next/no-literal-string */
import {useState} from 'react';
import ExternalElementsComboBox from './ExternalElementsCombobox';
import {useConfigContext} from '@/app/contexts/ConfigContext';
import {defaultDemoSettings} from '@/app/config/config';

const AppearanceTab = () => {
  const {
    settings,
    updateSetting,
    customer,
    updateCustomer,
    triggerElementsRefresh,
  } = useConfigContext();

  const [localExternalPaymentMethod, setLocalExternalPaymentMethod] = useState(
    settings?.externalPaymentMethod !==
      defaultDemoSettings.externalPaymentMethod
      ? settings?.externalPaymentMethod
      : ''
  );

  return (
    <>
      <div className="space-y-4">
        {[
          {
            label: 'Transaction Currency',
            key: 'currency',
            options: [
              {value: 'usd', label: 'USD'},
              {value: 'cad', label: 'CAD'},
              {value: 'gbp', label: 'GBP'},
              {value: 'eur', label: 'EUR'},
              {value: 'aud', label: 'AUD'},
              {value: 'sgd', label: 'SGD'},
              {value: 'jpy', label: 'JPY'},
            ],
          },
          {
            label: 'Language',
            key: 'language',
            options: [
              {value: 'en', label: 'English'},
              {value: 'en-GB', label: 'English (UK)'},
              {value: 'fr', label: 'French'},
              {value: 'es', label: 'Spanish'},
              {value: 'de', label: 'German'},
              {value: 'it', label: 'Italian'},
              {value: 'ja', label: 'Japanese'},
            ],
          },
          {
            label: 'Checkout Integration',
            key: 'checkoutIntegration',
            options: [
              {value: 'elements', label: 'Elements'},
              {value: 'embedded', label: 'Embedded'},
              {value: 'hosted', label: 'Hosted'},
            ],
          },
          {
            label: 'Elements Style',
            key: 'elementsStyle',
            options: [
              {value: 'accordion', label: 'Accordion'},
              {value: 'tabs', label: 'Tabs'},
            ],
          },
        ].map(({label, key, options}) => (
          <div key={key}>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {label}
            </label>
            <select
              value={settings ? settings[key] : null}
              onChange={(e) => updateSetting(key, e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              {options.map(({value, label}) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </>
  );
};

export default AppearanceTab;
