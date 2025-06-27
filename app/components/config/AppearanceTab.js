/* eslint-disable i18next/no-literal-string */
import {useConfigContext} from '@/app/contexts/ConfigContext';
import {defaultDemoSettings} from '@/app/config/config';

const AppearanceTab = () => {
  const {settings, updateSetting} = useConfigContext();

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
              {value: 'sek', label: 'SEK'},
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
              {value: 'embedded', label: 'Embedded Checkout'},
              {value: 'hosted', label: 'Stripe Checkout'},
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
              className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            >
              {options.map(({value, label}) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {[{label: 'Application Fee', key: 'applicationFee'}].map(
          ({label, key}) => (
            <div key={key}>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {label}
              </label>
              <input
                type="text"
                value={
                  settings &&
                  defaultDemoSettings &&
                  settings[key] !== defaultDemoSettings[key]
                    ? settings[key]
                    : ''
                }
                onChange={(e) => {
                  updateSetting(key, e.target.value);
                }}
                placeholder="Enter to override .env value"
                className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )
        )}

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={settings?.useV2Accounts ?? false}
            onChange={(e) => {
              updateSetting('useV2Accounts', e.target.checked);
            }}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label className="ml-2 block flex items-center gap-x-1 text-sm text-gray-900">
            Enable Accounts v2 API
          </label>
        </div>
      </div>
    </>
  );
};

export default AppearanceTab;
