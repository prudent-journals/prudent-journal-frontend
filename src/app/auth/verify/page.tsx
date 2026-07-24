'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BadgeCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

type State = 'checking' | 'verified' | 'failed';

function VerifyEmail() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState<State>('checking');
  const [message, setMessage] = useState('');
  // React runs effects twice in development; the token is single use, so
  // verifying twice would report a false failure on the second call.
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    if (!token) {
      setState('failed');
      setMessage('This link is missing its token. It may have been broken across lines by your email client.');
      return;
    }

    authApi
      .verifyEmail(token)
      .then(() => setState('verified'))
      .catch((err) => {
        setState('failed');
        setMessage(getErrorMessage(err));
      });
  }, [token]);

  if (state === 'checking') {
    return (
      <div className="card p-10 text-center">
        <Loader2 className="w-8 h-8 mx-auto mb-4 text-navy-400 animate-spin" />
        <p className="font-sans text-navy-600">Verifying your email address</p>
      </div>
    );
  }

  if (state === 'verified') {
    return (
      <div className="card p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-5">
          <BadgeCheck className="w-7 h-7 text-green-600" />
        </div>
        <h1 className="font-serif text-2xl text-navy-900 mb-3">Email verified</h1>
        <p className="font-sans text-navy-600 leading-relaxed">
          Your account is now active. You can sign in and start submitting work.
        </p>
        <Link href="/auth/login" className="btn-primary mt-6 w-full justify-center">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
        <ShieldAlert className="w-7 h-7 text-red-600" />
      </div>
      <h1 className="font-serif text-2xl text-navy-900 mb-3">We could not verify that link</h1>
      <p className="font-sans text-navy-600 leading-relaxed">{message}</p>
      <p className="font-sans text-sm text-navy-400 mt-4">
        Verification links can only be used once. If you have already verified, simply sign in.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Link href="/auth/login" className="btn-primary flex-1 justify-center">Sign in</Link>
        <Link href="/auth/register" className="btn-outline flex-1 justify-center">Create an account</Link>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment-50 px-6 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center font-serif text-2xl text-navy-900 mb-8">
          Prudent<span className="text-gold-600"> Journals</span>
        </Link>
        <Suspense fallback={<div className="card p-10 text-center text-navy-400 font-sans text-sm">Loading</div>}>
          <VerifyEmail />
        </Suspense>
      </div>
    </div>
  );
}
