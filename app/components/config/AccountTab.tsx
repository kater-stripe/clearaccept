import {defaultDemoSettings} from '@/app/config/config';
import {getEnv} from '@/app/config/customizationConfig';
import {useConfigContext} from '@/app/contexts/ConfigContext';
import {useEffect, useState} from 'react';

const AccountTab = () => {
  const {settings, updateSetting} = useConfigContext();
  const [defaultPk, setDefaultPk] = useState('');

  useEffect(() => {
    getEnv().then((env) => {
      setDefaultPk(env.stripePublishableKey || settings?.stripePublishableKey);
    });
  }, [settings]);

  return (
    <div className="space-y-4">
      {[
        {label: 'Stripe Publishable Key', key: 'stripePublishableKey'},
        {label: 'Stripe Secret Key', key: 'stripeSecretKey'},
      ].map(({label, key}) => (
        <div key={key}>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {label}
          </label>
          <input
            type="text"
            value={
              settings &&
              defaultDemoSettings &&
              settings[key] !== defaultDemoSettings[key] &&
              settings[key] !== defaultPk
                ? settings[key]
                : ''
            }
            onChange={(e) => {
              updateSetting(key, e.target.value);
            }}
            placeholder="Enter to override .env value"
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      ))}
    </div>
  );
};

export default AccountTab;
