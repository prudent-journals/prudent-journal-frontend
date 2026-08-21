'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, BookOpen, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { getErrorMessage } from '@/lib/utils';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Set by IdleLogoutGuard right before it signs an inactive session out -
  // sessionStorage survives the redirect that follows, a query param would
  // work too but this keeps the URL clean.
  useEffect(() => {
    if (sessionStorage.getItem('pj_logout_reason') === 'idle') {
      sessionStorage.removeItem('pj_logout_reason');
      toast('You were signed out after a period of inactivity.');
    }
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      toast.success('Welcome back');
      // Send people to the area that matches what they actually do here.
      const role = useAuthStore.getState().user?.role;
      if (role === 'admin') {
        router.push('/admin');
      } else if (role === 'chief_editor') {
        router.push('/chief-editor');
      } else if (role === 'reviewer') {
        router.push('/reviewer');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-hero-gradient hero-pattern relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-gold-500/5 blur-3xl animate-float" />
        <div className="relative text-center">
          <div className="w-16 h-16 rounded-2xl bg-gold-500/20 flex items-center justify-center mx-auto mb-6 border border-gold-500/30">
            <BookOpen className="w-8 h-8 text-gold-400" />
          </div>
          <h2 className="font-display text-4xl text-parchment-50 mb-4">Prudent Journals</h2>
          <p className="font-display text-xl text-gold-400 italic mb-8">
            "Knowledge is the light that guides generations"
          </p>
          <p className="text-parchment-400 font-sans text-sm max-w-sm leading-relaxed">
            An independent academic publishing platform. Access peer reviewed research,
            submit your work, and grow as a scholar.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            {[['Open Access', 'All papers free'], ['Peer Reviewed', 'Quality assured'], ['Indexed', 'Google Scholar']].map(([t, s]) => (
              <div key={t} className="glass-dark rounded-xl p-3">
                <div className="text-gold-400 font-serif text-sm font-semibold">{t}</div>
                <div className="text-parchment-500 text-xs mt-1">{s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-parchment-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-navy-900 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-gold-400" />
            </div>
            <span className="font-serif text-xl text-navy-900">Prudent<span className="text-gold-600"> Journals</span></span>
          </div>

          <div className="mb-8">
            <h1 className="font-serif text-3xl text-navy-900 mb-2">Welcome back</h1>
            <p className="text-navy-500 font-sans text-sm">Sign in to access your dashboard and submissions.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Email Address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@institution.edu"
                className="input-base"
                autoComplete="email"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-navy-700">Password</label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-gold-600 hover:text-gold-700 transition-colors inline-flex items-center min-h-[40px] px-1 -mx-1"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-base pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-lg text-navy-400 hover:text-navy-600 hover:bg-parchment-100 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full justify-center py-3 text-base mt-2"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-navy-500 font-sans mt-6">
            New to Prudent Journals?{' '}
            <Link href="/auth/register" className="text-gold-600 hover:text-gold-700 font-medium transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
