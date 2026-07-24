'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, Users, Calendar, BookOpen,
  Settings, LogOut, ChevronRight, Star, Award, Activity
} from 'lucide-react';
import { useAuthStore, isAdmin } from '@/lib/auth-store';
import { cn, getInitials, getRoleLabel } from '@/lib/utils';

// Navigation is scoped to what each administrative role can actually do.
// A conference admin has no business in journal submissions or user management.
const ALL_NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true, roles: ['super_admin', 'journal_admin', 'conference_admin'] },
  { href: '/admin/papers', label: 'Submissions', icon: FileText, roles: ['super_admin', 'journal_admin'] },
  { href: '/admin/reviews', label: 'Review Queue', icon: Star, roles: ['super_admin', 'journal_admin'] },
  { href: '/admin/publications', label: 'Publications', icon: BookOpen, roles: ['super_admin', 'journal_admin'] },
  { href: '/admin/conferences', label: 'Conferences', icon: Calendar, roles: ['super_admin', 'conference_admin'] },
  { href: '/admin/certificates', label: 'Certificates', icon: Award, roles: ['super_admin', 'journal_admin', 'conference_admin'] },
  { href: '/admin/users', label: 'Users', icon: Users, roles: ['super_admin'] },
  { href: '/admin/system', label: 'System', icon: Activity, roles: ['super_admin', 'journal_admin', 'conference_admin'] },
];

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Administration',
  journal_admin: 'Journal',
  conference_admin: 'Conferences',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace('/auth/login'); return; }
    if (!isAdmin(user)) { router.replace('/dashboard'); }
  }, [user, hasHydrated, router]);

  if (!hasHydrated || !user || !isAdmin(user)) return null;

  const nav = ALL_NAV.filter((item) => item.roles.includes(user.role));

  return (
    <div className="min-h-screen flex bg-navy-950">
      {/* Dark sidebar */}
      <aside className="w-64 bg-navy-900 border-r border-navy-800 flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-navy-800">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold-500/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-gold-400" />
            </div>
            <span className="font-serif text-lg text-parchment-100">
              Prudent<span className="text-gold-400"> Journals</span>
            </span>
          </Link>
          <div className="mt-1 ml-10">
            <span className="text-xs font-mono text-navy-400 uppercase tracking-widest">
              {ROLE_LABEL[user.role] || 'Admin'}
            </span>
          </div>
        </div>

        <div className="p-4 border-b border-navy-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gold-500/20 text-gold-400 flex items-center justify-center font-semibold text-sm flex-shrink-0 border border-gold-500/30">
              {getInitials(user.full_name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-parchment-100 truncate">{user.full_name.split(' ')[0]}</p>
              <p className="text-xs text-navy-400">{getRoleLabel(user.role)}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-gold-500/15 text-gold-400 border border-gold-500/20'
                  : 'text-navy-400 hover:bg-navy-800 hover:text-parchment-200'
              )}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-navy-800 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-navy-400 hover:bg-navy-800 transition-colors">
            <Settings className="w-4 h-4" /> My Dashboard
          </Link>
          <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-900/20 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-parchment-50">{children}</main>
    </div>
  );
}
