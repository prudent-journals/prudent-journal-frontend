'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, Users, Calendar, BookOpen,
  Settings, LogOut, ChevronRight, Star, Award, Activity, Menu, X
} from 'lucide-react';
import { useAuthStore, isAdmin } from '@/lib/auth-store';
import { cn, getInitials, getRoleLabel } from '@/lib/utils';

// One administrator role sees the whole system, so this list is flat: there is
// nothing to filter it by. If narrower roles are ever reintroduced, this and
// the guards in the backend are the two places that need to know.
const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/papers', label: 'Submissions', icon: FileText },
  { href: '/admin/reviews', label: 'Review Queue', icon: Star },
  { href: '/admin/publications', label: 'Publications', icon: BookOpen },
  { href: '/admin/conferences', label: 'Conferences', icon: Calendar },
  { href: '/admin/certificates', label: 'Certificates', icon: Award },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/system', label: 'System', icon: Activity },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, hasHydrated } = useAuthStore();

  // The sidebar is a permanent column from md up and an off-canvas drawer below
  // it. Eight nav items are too many for a bottom bar, so admin gets a drawer
  // rather than the tab strip the reviewer area uses.
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace('/auth/login'); return; }
    if (!isAdmin(user)) { router.replace('/dashboard'); }
  }, [user, hasHydrated, router]);

  // Navigating is the usual way out of the drawer.
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    // Stop the page behind the drawer from scrolling with it.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  if (!hasHydrated || !user || !isAdmin(user)) return null;

  // Rendered into both the desktop column and the mobile drawer.
  const sidebarContent = (
    <>
      <div className="p-6 border-b border-navy-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold-500/20 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4 text-gold-400" />
          </div>
          <span className="font-serif text-lg text-parchment-100">
            Prudent<span className="text-gold-400"> Journals</span>
          </span>
        </Link>
        <div className="mt-1 ml-10">
          <span className="text-xs font-mono text-navy-400 uppercase tracking-widest">
            Administration
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
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={cn(
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
    </>
  );

  return (
    <div className="min-h-screen flex bg-navy-950">
      {/* Permanent sidebar, tablet and up */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-navy-900 border-r border-navy-800 flex-col sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-navy-900 border-b border-navy-800 px-2 flex items-center gap-1">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
          aria-controls="admin-sidebar"
          className="p-3 rounded-xl text-parchment-100 hover:bg-navy-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/admin" className="font-serif text-parchment-100 truncate">
          Prudent<span className="text-gold-400"> Journals</span>
        </Link>
        <span className="ml-auto mr-2 text-xs font-mono text-navy-400 uppercase tracking-widest truncate">
          Administration
        </span>
      </header>

      {/* Drawer backdrop */}
      <div
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
        className={cn(
          'md:hidden fixed inset-0 z-40 bg-navy-950/70 transition-opacity duration-200',
          drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      />

      {/* Off-canvas sidebar, below md */}
      <aside
        id="admin-sidebar"
        className={cn(
          'md:hidden fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] bg-navy-900 border-r border-navy-800 flex flex-col transition-transform duration-200 ease-out',
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close navigation menu"
          className="absolute top-3 right-2 p-3 rounded-xl text-navy-400 hover:bg-navy-800 hover:text-parchment-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-auto bg-parchment-50 pt-14 md:pt-0">{children}</main>
    </div>
  );
}
