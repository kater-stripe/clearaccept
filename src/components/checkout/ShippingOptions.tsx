'use client';

import { useTranslation } from 'react-i18next';
import { ShippingOption } from './ShippingOption';
import { useState } from 'react';
import { useAgnosticElements } from './AgnosticElementsProvider';

export const ShippingOptions = () => {
  const { shippingOptions, shippingOptionId, updateShippingOption } =
    useAgnosticElements();
  const { t } = useTranslation();

  /**
   * Because the new Checkout Provider isn't optimistic about the shipping option selection, we need to
   * proactively track the shipping option id to display the chosen shipping option in the UI. If we don't do this,
   * the experience feels very clunky and slow when switching between shipping options.
   */
  const [optimisticShippingOptionId, setOptimisticShippingOptionId] = useState<
    string | undefined
  >(shippingOptionId);

  return shippingOptions.map(
    ({ id, amount, displayName, deliveryEstimate }) => {
      let description = undefined;

      if (deliveryEstimate !== null) {
        const { minimum, maximum } = deliveryEstimate;

        if (minimum !== null) {
          description = t(
            `timeUnits.${minimum.unit}${minimum.value > 1 ? 's' : ''}`,
            {
              value: minimum.value,
            },
          );
        }

        if (maximum !== null) {
          description = `${description ?? ''}${description ? ' - ' : ''}${t(
            `timeUnits.${maximum.unit}${maximum.value > 1 ? 's' : ''}`,
            {
              value: maximum.value,
            },
          )}`;
        }
      }

      return (
        <ShippingOption
          key={id}
          title={displayName}
          description={description}
          price={amount}
          selected={id === optimisticShippingOptionId}
          onSelect={() => {
            setOptimisticShippingOptionId(id);
            updateShippingOption(id);
          }}
          value={id}
        />
      );
    },
  );
};
