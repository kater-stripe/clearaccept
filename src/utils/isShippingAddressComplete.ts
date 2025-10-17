import type { ShippingAddress } from '@stripe/stripe-js';

export const isShippingAddressComplete = (
  shippingAddress: ShippingAddress | undefined,
) => {
  if (shippingAddress === undefined) {
    return false;
  }

  const { address } = shippingAddress;

  if (!address.country) {
    return false;
  }

  if (!address.city) {
    return false;
  }

  if (!address.line1) {
    return false;
  }

  if (!address.state) {
    return false;
  }

  if (!address.postal_code) {
    return false;
  }

  return true;
};
