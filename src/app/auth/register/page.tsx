'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, BookOpen, Loader2, CheckCircle } from 'lucide-react';
import { authApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import toast from 'react-hot-toast';

const schema = z.object({
  full_name: z.string().min(2, 'Full name required'),
  email: z.string().email('Invalid email'),
  institution: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.register({
        full_name: data.full_name,
        email: data.email,
        institution: data.institution,
        password: data.password,
      });
      setDone(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment-50 px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-serif text-2xl text-navy-900 mb-3">Account Created!</h2>
          <p className="text-navy-500 font-sans text-sm mb-6">
            We've sent a verification email to your inbox. Please verify your email before signing in.
          </p>
          <Link href="/auth/login" className="btn-primary">Go to Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left decorative */}
      <div className="hidden lg:flex lg:w-5/12 bg-hero-gradient hero-pattern relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="relative text-center">
          <div className="w-16 h-16 rounded-2xl bg-gold-500/20 flex items-center justify-center mx-auto mb-6 border border-gold-500/30">
            <BookOpen className="w-8 h-8 text-gold-400" />
          </div>
          <h2 className="font-display text-4xl text-parchment-50 mb-4">Join Prudent Journals</h2>
          <p className="text-parchment-400 font-sans text-sm max-w-xs leading-relaxed">
            Create your account to submit papers, track your research, and join the Prudent Journals academic community.
          </p>
          <ul className="mt-10 space-y-3 text-left">
            {[
              'Submit journal & conference papers',
              'Track review status in real-time',
              'Receive reviewer feedback by email',
              'Register for academic conferences',
              'Build your research profile',
            ].map(item => (
              <li key={item} className="flex items-center gap-3 text-sm text-parchment-300">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-parchment-50 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-navy-900 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-gold-400" />
            </div>
            <span className="font-serif text-xl text-navy-900">Prudent<span className="text-gold-600"> Journals</span></span>
          </div>

          <div className="mb-8">
            <h1 className="font-serif text-3xl text-navy-900 mb-2">Create Account</h1>
            <p className="text-navy-500 font-sans text-sm">Join the Prudent Journals research community.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Full Name *</label>
              <input {...register('full_name')} placeholder="Dr. Jane Doe" className="input-base" />
              {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Email Address *</label>
              <input {...register('email')} type="email" placeholder="you@institution.edu" className="input-base" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Institution / Department</label>
              <input {...register('institution')} placeholder="Your institution and department" className="input-base" />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Password *</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  className="input-base pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Confirm Password *</label>
              <input
                {...register('confirm_password')}
                type="password"
                placeholder="Re-enter your password"
                className="input-base"
              />
              {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3 text-base mt-2">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-navy-500 font-sans mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-gold-600 hover:text-gold-700 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
