'use client';

import * as React from 'react';
import {signIn} from 'next-auth/react';
import {useRouter} from 'next/navigation';
import {ArrowRight, Loader2} from 'lucide-react';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {Button} from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import CountrySelector from '@/app/components/CountrySelector';
import Link from 'next/link';
import {useTranslation} from 'react-i18next';
import {useConfigContext} from '@/app/contexts/ConfigContext';
import {generateRandomCustomerEmail} from '@/app/utils/helpers';

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  country: z.any(),
});

export default function SignupForm() {
  const router = useRouter();
  const {t} = useTranslation();
  const {settings} = useConfigContext();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      country: 'US',
      email: generateRandomCustomerEmail(),
      password: 'wej90@j902ji',
    },
  });

  const onSubmit = React.useCallback(
    async (values: z.infer<typeof formSchema>) => {
      try {
        setError(null);

        const signInOptions = {
          country: values.country,
          email: values.email,
          password: values.password,
          redirect: false,
          stripe_sk: undefined,
        };

        if (settings?.stripeSecretKey) {
          signInOptions.stripe_sk = settings.stripeSecretKey;
        }

        const res = await signIn('signup', signInOptions);
        if (res && res.ok) {
          router.push(
            `/${settings?.language || 'en'}/onboarding${window.location.search}`
          );
        } else {
          setError(t('errors.unable_to_create'));
        }
      } catch (error: any) {
        setError(t('errors.unable_to_create'));
        console.error('An error occurred when signing in', error);
      }
    },
    [settings, router, t]
  );

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">{t('auth.signup.sign_up')}</h2>
        <div>
          {t('auth.signup.already_have_account')}{' '}
          <Link
            href={`/${settings?.language}/login`}
            className="font-bold text-primary underline"
          >
            {t('auth.signup.login')}{' '}
            <ArrowRight className="mb-0.5 inline w-4" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
      <Form {...form}>
        {error && <span className="text-red-500">{error}</span>}
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-3 space-y-4">
          <div className="flex flex-col space-y-2">
            <FormField
              control={form.control}
              name="country"
              render={({field}) => (
                <FormItem>
                  <FormLabel className="font-bold">
                    {t('auth.signup.country')}
                  </FormLabel>
                  <FormControl>
                    <CountrySelector
                      className="rounded-md border border-gray-300 p-2 placeholder:text-gray-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <FormField
              control={form.control}
              name="email"
              render={({field}) => (
                <FormItem>
                  <FormLabel className="font-bold">
                    {t('auth.signup.email')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-md border border-gray-300 p-2 placeholder:text-gray-400"
                      placeholder={t('auth.login.sample_email')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-col space-y-2 pb-3">
            <FormField
              control={form.control}
              name="password"
              render={({field}) => (
                <FormItem>
                  <FormLabel className="font-bold">
                    {t('auth.login.password')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-md border border-gray-300 p-2 placeholder:text-gray-400"
                      placeholder="••••••••"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className={'w-full rounded-md bg-primary p-2 font-bold text-white'}
          >
            {form.formState.isSubmitting ||
            form.formState.isSubmitSuccessful ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                {t('auth.login.loading')}
              </>
            ) : (
              <>{t('auth.login.continue')}</>
            )}
          </Button>
        </form>
      </Form>
    </>
  );
}
