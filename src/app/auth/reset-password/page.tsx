'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, KeyRound, ShieldAlert } from 'lucide-react';
import { authApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

const schema = z
  .object({
    new_password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Za-z]/, 'Include at least one letter')
      .regex(/[0-9]/, 'Include at least one number'),
    confirm_password: z.string(),
  })
  .refine((v) => v.new_password === v.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type FormValues = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ new_password }: FormValues) => {
    setError('');
    try {
      await authApi.resetPassword({ token, new_password });
      toast.success('Password updated. Please sign in.');
      router.push('/auth/login');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (!token) {
    return (
      <div className="card p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
          <ShieldAlert className="w-7 h-7 text-red-600" />
        </div>
        <h1 className="font-serif text-2xl text-navy-900 mb-3">This link is not valid</h1>
        <p className="font-sans text-navy-600 leading-relaxed">
          The reset link is missing its token. It may have been truncated by your email client.
          Request a new one and open it directly from the email.
        </p>
        <Link href="/auth/forgot-password" className="btn-primary mt-6 w-full justify-center">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <div className="w-12 h-12 rounded-2xl bg-navy-900 flex items-center justify-center mb-5">
        <KeyRound className="w-6 h-6 text-gold-400" />
      </div>
      <h1 className="font-serif text-2xl text-navy-900 mb-2">Choose a new password</h1>
      <p className="font-sans text-navy-500 text-sm leading-relaxed mb-6">
        Once saved, your previous password stops working everywhere.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block font-sans text-sm font-medium text-navy-800 mb-1.5">New password</label>
          <input
            {...register('new_password')}
            type="password"
            autoComplete="new-password"
            className="input-base"
          />
          {errors.new_password && (
            <p className="text-red-600 text-sm font-sans mt-1">{errors.new_password.message}</p>
          )}
        </div>

        <div>
          <label className="block font-sans text-sm font-medium text-navy-800 mb-1.5">Confirm password</label>
          <input
            {...register('confirm_password')}
            type="password"
            autoComplete="new-password"
            className="input-base"
          />
          {errors.confirm_password && (
            <p className="text-red-600 text-sm font-sans mt-1">{errors.confirm_password.message}</p>
          )}
        </div>

        {error && (
          <p className="text-red-600 text-sm font-sans bg-red-50 border border-red-200 rounded-xl p-3">
            {error}
          </p>
        )}

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3 disabled:opacity-60">
          {isSubmitting ? 'Saving' : 'Save new password'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment-50 px-6 py-16">
      <div className="w-full max-w-md">
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-navy-500 hover:text-navy-800 font-sans mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
        <Suspense fallback={<div className="card p-8 text-navy-400 font-sans text-sm">Loading</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
