'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, Users, BookOpen,
  Settings, LogOut, ChevronRight, Menu, X, User,
} from 'lucide-react';
import { useAuthStore, isChiefEditor } from '@/lib/auth-store';
import { cn, getInitials, getRoleLabel } from '@/lib/utils';
import NotificationBell from '@/components/layout/NotificationBell';

// The chief editor's own turf: assignment and editorial decisions. No users,
// conferences, certificates, publications or system administration - those
// stay behind /admin. Publishing itself also stays behind /admin; this zone
// never gets a nav item for it.
const NAV = [
  { href: '/chief-editor', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/chief-editor/papers', label: 'Submissions', icon: FileText },
  { href: '/chief-editor/reviewers', label: 'Reviewers', icon: Users },
];

export default function ChiefEditorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, hasHydrated } = useAuthStore();

  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace('/auth/login'); return; }
    if (!isChiefEditor(user)) { router.replace('/dashboard'); }
  }, [user, hasHydrated, router]);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  if (!hasHydrated || !user || !isChiefEditor(user)) return null;

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
            Chief Editor
          </span>
        </div>
      </div>

      <div className="p-4 border-b border-navy-800">
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gold-500/20 text-gold-400 flex items-center justify-center font-semibold text-sm flex-shrink-0 border border-gold-500/30">
              {getInitials(user.full_name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-parchment-100 truncate">{user.full_name.split(' ')[0]}</p>
              <p className="text-xs text-navy-400">{getRoleLabel(user.role)}</p>
            </div>
          </div>
          <NotificationBell />
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
        <Link href="/dashboard/profile" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-navy-400 hover:bg-navy-800 transition-colors">
          <User className="w-4 h-4" /> Profile
        </Link>
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
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-navy-900 border-r border-navy-800 flex-col sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-navy-900 border-b border-navy-800 px-2 flex items-center gap-1">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
          aria-controls="chief-editor-sidebar"
          className="p-3 rounded-xl text-parchment-100 hover:bg-navy-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/chief-editor" className="font-serif text-parchment-100 truncate">
          Prudent<span className="text-gold-400"> Journals</span>
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <NotificationBell />
          <span className="mr-1 text-xs font-mono text-navy-400 uppercase tracking-widest truncate">
            Chief Editor
          </span>
        </div>
      </header>

      <div
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
        className={cn(
          'md:hidden fixed inset-0 z-40 bg-navy-950/70 transition-opacity duration-200',
          drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      />

      <aside
        id="chief-editor-sidebar"
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

      <main className="flex-1 min-w-0 overflow-auto bg-parchment-50 pt-14 md:pt-0">{children}</main>
    </div>
  );
}
