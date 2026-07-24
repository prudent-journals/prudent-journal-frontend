'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, FileText, Bell, User, Upload,
  BookOpen, Calendar, LogOut, ChevronRight
} from 'lucide-react';
import { useAuthStore, isAdmin, isReviewer } from '@/lib/auth-store';
import { cn, getInitials } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/papers', label: 'My Papers', icon: FileText },
  { href: '/dashboard/conferences', label: 'Conferences', icon: Calendar },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) router.replace('/auth/login');
  }, [user, hasHydrated, router]);

  if (!hasHydrated || !user) return null;

  return (
    <div className="min-h-screen flex bg-parchment-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-parchment-200 flex flex-col sticky top-0 h-screen">
        {/* Logo */}
        <div className="p-6 border-b border-parchment-200">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-navy-900 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-gold-400" />
            </div>
            <span className="font-serif text-lg text-navy-900">Prudent<span className="text-gold-600"> Journals</span></span>
          </Link>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-parchment-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-navy-800 text-parchment-50 flex items-center justify-center font-semibold text-sm flex-shrink-0">
              {getInitials(user.full_name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy-900 truncate">{user.full_name}</p>
              <p className="text-xs text-navy-500 truncate">{user.institution || 'Prudent Journals'}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <Link
            href="/submit"
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-gold-500 text-navy-900 font-medium text-sm mb-3 hover:bg-gold-400 transition-colors"
          >
            <Upload className="w-4 h-4" /> Submit Paper
          </Link>

          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-navy-900 text-parchment-50'
                    : 'text-navy-600 hover:bg-parchment-100 hover:text-navy-900'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        {(isAdmin(user) || isReviewer(user)) && (
          <div className="px-3 pb-2 space-y-1">
            {isAdmin(user) && (
              <Link href="/admin" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-navy-600 bg-parchment-100 hover:bg-parchment-200 transition-colors">
                <LayoutDashboard className="w-4 h-4" /> Admin Area
              </Link>
            )}
            {isReviewer(user) && (
              <Link href="/reviewer" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-navy-600 bg-parchment-100 hover:bg-parchment-200 transition-colors">
                <FileText className="w-4 h-4" /> Reviewer Area
              </Link>
            )}
          </div>
        )}

        <div className="p-3 border-t border-parchment-200">
          <button
            onClick={logout}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
