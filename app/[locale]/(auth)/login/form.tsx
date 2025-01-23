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
import {useTranslation} from 'react-i18next';
import Link from 'next/link';
import {useConfigContext} from '@/app/contexts/ConfigContext';

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export default function LoginForm() {
  const router = useRouter();
  const {t} = useTranslation();
  const {settings} = useConfigContext();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await signIn('login', {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      router.push(`/${settings?.language}`);
    } catch (error: any) {
      console.error('An error occurred when signing in', error);
    }
  };

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">{t('auth.login.login')}</h2>
        <div>
          {t('auth.login.dont_have_an_account')}{' '}
          <Link
            href={`/${settings?.language}/signup`}
            className="font-bold text-primary underline"
          >
            {t('auth.login.sign_up')}{' '}
            <ArrowRight className="mb-0.5 inline w-4" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-3 space-y-4">
          <div className="flex flex-col space-y-2">
            <FormField
              control={form.control}
              name="email"
              render={({field}) => (
                <FormItem>
                  <FormLabel className="font-bold">
                    {t('auth.login.email')}
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
            {!form.formState.isSubmitting && <>{t('auth.login.continue')}</>}
            {form.formState.isSubmitting && (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                {t('auth.login.loading')}
              </>
            )}
          </Button>
        </form>
      </Form>
    </>
  );
}
