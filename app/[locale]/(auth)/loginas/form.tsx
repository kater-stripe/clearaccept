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
import Link from 'next/link';
import {useTranslation} from 'react-i18next';
import {useConfigContext} from '@/app/contexts/ConfigContext';

const formSchema = z.object({
  accountId: z.string().startsWith('acct_'),
});

export default function LoginAsForm() {
  const router = useRouter();
  const {t} = useTranslation();
  const {settings} = useConfigContext();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountId: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await signIn('loginas', {
        accountId: values.accountId,
        stripe_sk: settings?.stripeSecretKey,
        redirect: false,
      });

      router.push('/default');
    } catch (error: any) {
      console.error('An error occurred when selecting the account', error);
    }
  };

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">{t('auth.loginas.select')}</h2>
        <div>
          {t('auth.loginas.dont_have_account')}{' '}
          <Link
            href={`/${settings?.language}/signup`}
            className="font-bold text-primary"
          >
            {t('auth.loginas.register')}{' '}
            <ArrowRight className="mb-0.5 inline w-4" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex flex-col space-y-2">
            <FormField
              control={form.control}
              name="accountId"
              render={({field}) => (
                <FormItem>
                  <FormLabel className="font-bold">
                    {t('auth.loginas.acct_id')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-md border border-gray-300 p-2 placeholder:text-gray-400"
                      placeholder={t('auth.loginas.sample_acct_id')}
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
            className={'w-full rounded-md bg-primary p-2 font-bold text-white'}
          >
            {!form.formState.isSubmitting && <>{t('auth.loginas.continue')}</>}
            {form.formState.isSubmitting && (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                {t('auth.loginas.loading')}
              </>
            )}
          </Button>
        </form>
      </Form>
    </>
  );
}
