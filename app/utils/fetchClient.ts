'use client';

import axios from 'axios';
import {loadFromStorage} from './clientStorage';
import {defaultDemoSettings} from '../config/config';

const defaultOptions = {
  method: 'get',
  headers: {
    'Content-Type': 'application/json',
  },
};
const fetchClient = axios.create(defaultOptions);

fetchClient.interceptors.request.use(function (config) {
  const {stripeSecretKey, stripePublishableKey, currency, language} =
    loadFromStorage('settings', defaultDemoSettings);
  const {id} = loadFromStorage('customer', {});

  config.headers['demo-stripesecretkey'] = stripeSecretKey;
  config.headers['demo-stripepublishablekey'] = stripePublishableKey;
  config.headers['demo-currency'] = currency;
  config.headers['demo-customer'] = id;
  config.headers['demo-language'] = language;

  return config;
});

export default fetchClient;
