'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, MailCheck, Send } from 'lucide-react';
import { authApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }: FormValues) => {
    setError('');
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      // The API deliberately does not reveal whether an address is registered.
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment-50 px-6 py-16">
      <div className="w-full max-w-md">
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-navy-500 hover:text-navy-800 font-sans mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>

        {sent ? (
          <div className="card p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-5">
              <MailCheck className="w-7 h-7 text-green-600" />
            </div>
            <h1 className="font-serif text-2xl text-navy-900 mb-3">Check your inbox</h1>
            <p className="font-sans text-navy-600 leading-relaxed">
              If an account exists for{' '}
              <span className="font-medium text-navy-900">{getValues('email')}</span>, a link to
              reset your password is on its way. The link is valid for one hour.
            </p>
            <p className="font-sans text-sm text-navy-400 mt-4">
              Nothing arrived? Check your spam folder before trying again.
            </p>
            <button onClick={() => setSent(false)} className="btn-outline mt-6 w-full justify-center">
              Use a different address
            </button>
          </div>
        ) : (
          <div className="card p-8">
            <h1 className="font-serif text-2xl text-navy-900 mb-2">Reset your password</h1>
            <p className="font-sans text-navy-500 text-sm leading-relaxed mb-6">
              Enter the email address on your account and we will send you a link to set a new password.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block font-sans text-sm font-medium text-navy-800 mb-1.5">
                  Email address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="you@institution.edu"
                  className="input-base"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm font-sans mt-1">{errors.email.message}</p>
                )}
              </div>

              {error && (
                <p className="text-red-600 text-sm font-sans bg-red-50 border border-red-200 rounded-xl p-3">
                  {error}
                </p>
              )}

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3 disabled:opacity-60">
                {isSubmitting ? 'Sending' : <>Send reset link <Send className="w-4 h-4" /></>}
              </button>
            </form>

            <p className="font-sans text-sm text-navy-500 text-center mt-6">
              Remembered it?{' '}
              <Link href="/auth/login" className="text-navy-900 font-medium hover:text-gold-700 animated-underline">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
