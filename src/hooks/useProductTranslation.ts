import { useTranslation } from 'react-i18next';
import type { Stripe } from 'stripe';

const generateProductTranslationKey = (productName: string) => {
  return productName
    .toLowerCase()
    .replace(/[']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

export const useProductTranslation = () => {
  const { t } = useTranslation();

  return {
    tp: (
      product: Pick<
        Stripe.Product,
        'name' | 'description' | 'marketing_features'
      >,
    ) => {
      const productTranslationKey = generateProductTranslationKey(product.name);

      return {
        name: t(`products.${productTranslationKey}.name`, {
          defaultValue: product.name,
        }),
        description: t(`products.${productTranslationKey}.description`, {
          defaultValue: product.description,
        }),
        marketing_features: product.marketing_features?.map((feature) => {
          const marketingFeatureTranslationKey = generateProductTranslationKey(
            feature.name ?? '',
          );

          return t(
            `products.${productTranslationKey}.marketing_feature_list.${marketingFeatureTranslationKey}`,
            {
              defaultValue: feature.name,
            },
          );
        }),
      };
    },
  };
};
