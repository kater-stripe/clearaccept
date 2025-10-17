'use server';

import { plain } from '@/utils/plain';
import Stripe from 'stripe';

type CreateProductParams = {
  stripeSecretKey?: string;
  image: ArrayBuffer;
};

export const createProductImageWithFileLink = async ({
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  image,
}: CreateProductParams) => {
  if (!stripeSecretKey) {
    throw new Error(
      'Unable to create product because neither a secret key was provided nor one was found in the environment variables.',
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const arrayBufferLike = new Uint8Array(image);

  const file = await stripe.files.create({
    // @ts-expect-error
    purpose: 'product_image',
    file: {
      data: arrayBufferLike,
    },
  });

  const fileLink = await stripe.fileLinks.create({
    file: file.id,
  });

  return plain(fileLink);
};
