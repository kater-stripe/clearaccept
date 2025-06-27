import {defaultDemoSettings} from '@/app/config/config';
import {getEnv} from '@/app/config/customizationConfig';
import {useConfigContext} from '@/app/contexts/ConfigContext';
import {useEffect, useState} from 'react';
import {useSession, signOut} from 'next-auth/react';

const AccountTab = () => {
  const {data: session} = useSession();
  const {settings, updateSetting} = useConfigContext();
  const [defaultPk, setDefaultPk] = useState('');

  useEffect(() => {
    getEnv().then((env) => {
      setDefaultPk(env.stripePublishableKey || settings?.stripePublishableKey);
    });
  }, [settings]);

  const handleLogout = () => {
    signOut({
      callbackUrl: `${new URL(window.location.href).origin}/${settings?.language}/signup`,
      redirect: false,
    });
  };

  return (
    <div className="space-y-4">
      {session && (
        <div
          className="mb-4 rounded-md p-3"
          style={{backgroundColor: '#fff9d1'}}
        >
          <p>You are logged in. To edit these keys, please log out first.</p>
          <button
            onClick={handleLogout}
            className="mt-2 rounded-md bg-red-500 px-4 py-2 text-white"
          >
            Logout
          </button>
        </div>
      )}
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
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            disabled={session ? true : false}
          />
        </div>
      ))}
    </div>
  );
};

export default AccountTab;
