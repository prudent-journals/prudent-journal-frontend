'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Calendar, Upload, User, LayoutDashboard } from 'lucide-react';
import { useAuthStore, isAdmin, isReviewer } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

/**
 * Bottom navigation for the public site on small screens.
 *
 * This is the main thing that makes the installed app stop feeling like a web
 * page. It sits above the home indicator, keeps touch targets comfortably
 * large, and its last item changes depending on who is signed in.
 */
export default function MobileNav() {
  const pathname = usePathname();
  const { user, hasHydrated } = useAuthStore();

  // Areas that carry their own navigation must not get a second bar.
  const ownsNavigation = ['/dashboard', '/admin', '/reviewer', '/auth'];
  if (ownsNavigation.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  interface NavItem {
    href: string;
    label: string;
    icon: typeof Home;
    exact?: boolean;
  }

  const accountItem: NavItem = !hasHydrated
    ? { href: '/auth/login', label: 'Account', icon: User }
    : isAdmin(user)
      ? { href: '/admin', label: 'Admin', icon: LayoutDashboard }
      : isReviewer(user)
        ? { href: '/reviewer', label: 'Reviews', icon: LayoutDashboard }
        : user
          ? { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }
          : { href: '/auth/login', label: 'Sign in', icon: User };

  const items: NavItem[] = [
    { href: '/', label: 'Home', icon: Home, exact: true },
    { href: '/publications', label: 'Read', icon: BookOpen },
    { href: '/conferences', label: 'Events', icon: Calendar },
    { href: '/submit', label: 'Submit', icon: Upload },
    accountItem,
  ];

  return (
    <>
      {/* Keeps page content clear of the fixed bar. */}
      <div className="md:hidden h-[calc(env(safe-area-inset-bottom)+4rem)]" aria-hidden="true" />

      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-parchment-200 pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="grid grid-cols-5">
          {items.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <li key={label}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 min-h-[3.5rem] px-1 transition-colors',
                    active ? 'text-gold-700' : 'text-navy-500 active:text-navy-800',
                  )}
                >
                  <span className="relative">
                    <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.4 : 1.9} />
                    {active && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold-600" />
                    )}
                  </span>
                  <span className="text-[10.5px] font-sans font-medium leading-none">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
