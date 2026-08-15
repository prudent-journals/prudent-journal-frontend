'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, BookOpen, Bell, ChevronDown, LogOut, User, Settings, LayoutDashboard } from 'lucide-react';
import { useAuthStore, isAdmin, isChiefEditor, isReviewer } from '@/lib/auth-store';
import { usersApi } from '@/lib/api';
import { cn, getInitials } from '@/lib/utils';

const navLinks = [
  { href: '/publications', label: 'Publications' },
  { href: '/conferences', label: 'Conferences' },
  { href: '/proceedings', label: 'Proceedings' },
  { href: '/submit', label: 'Submit Paper' },
  { href: '/about', label: 'About' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, hasHydrated } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (user) {
      usersApi.notifications(true).then(r => setUnreadCount(r.data.length)).catch(() => {});
    }
  }, [user]);

  return (
    <header className={cn(
      'sticky top-0 z-50 transition-all duration-300',
      scrolled
        ? 'bg-white/95 backdrop-blur-md shadow-card border-b border-parchment-200'
        : 'bg-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group py-2 -my-2">
          <div className="w-8 h-8 rounded-lg bg-navy-900 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-gold-400" />
          </div>
          <span className="font-serif text-lg text-navy-900 group-hover:text-gold-700 transition-colors">
            Prudent<span className="text-gold-600"> Journals</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-sans font-medium transition-all duration-200',
                pathname === link.href
                  ? 'text-navy-900 bg-parchment-100'
                  : 'text-navy-600 hover:text-navy-900 hover:bg-parchment-100'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-3">
          {!hasHydrated ? null : user ? (
            <>
              {/* Notifications */}
              <Link href="/dashboard/notifications" className="relative p-2 rounded-lg hover:bg-parchment-100 transition-colors">
                <Bell className="w-5 h-5 text-navy-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-gold-500 text-navy-900 text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-parchment-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-navy-800 text-parchment-50 flex items-center justify-center text-xs font-semibold">
                    {getInitials(user.full_name)}
                  </div>
                  <span className="text-sm font-sans font-medium text-navy-700 max-w-[120px] truncate">{user.full_name.split(' ')[0]}</span>
                  <ChevronDown className={cn('w-4 h-4 text-navy-400 transition-transform', profileOpen && 'rotate-180')} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 card p-2 z-50 animate-fade-in">
                    <div className="px-3 py-2 border-b border-parchment-200 mb-1">
                      <p className="text-sm font-semibold text-navy-900 truncate">{user.full_name}</p>
                      <p className="text-xs text-navy-500 truncate">{user.email}</p>
                    </div>
                    <Link href="/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-parchment-100 text-sm text-navy-700 transition-colors">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    {isAdmin(user) && (
                      <Link href="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-parchment-100 text-sm text-navy-700 transition-colors">
                        <Settings className="w-4 h-4" /> Admin Panel
                      </Link>
                    )}
                    {isChiefEditor(user) && (
                      <Link href="/chief-editor" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-parchment-100 text-sm text-navy-700 transition-colors">
                        <LayoutDashboard className="w-4 h-4" /> Chief Editor
                      </Link>
                    )}
                    {isReviewer(user) && (
                      <Link href="/reviewer" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-parchment-100 text-sm text-navy-700 transition-colors">
                        <LayoutDashboard className="w-4 h-4" /> Reviewer Area
                      </Link>
                    )}
                    <Link href="/dashboard/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-parchment-100 text-sm text-navy-700 transition-colors">
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-sm text-red-600 transition-colors mt-1 border-t border-parchment-200 pt-2">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn-ghost text-sm">Sign In</Link>
              <Link href="/auth/register" className="btn-primary text-sm">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          className="md:hidden p-2 rounded-lg hover:bg-parchment-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-parchment-200 bg-white px-6 py-4 space-y-1 animate-fade-in">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
              className={cn(
                'block px-4 py-2.5 rounded-lg text-sm font-sans font-medium transition-colors',
                pathname === link.href ? 'bg-parchment-100 text-navy-900' : 'text-navy-600'
              )}>
              {link.label}
            </Link>
          ))}
          <div className="border-t border-parchment-200 pt-3 mt-3 flex flex-col gap-2">
            {!hasHydrated ? null : user ? (
              <>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="btn-outline text-center text-sm">Dashboard</Link>
                {isAdmin(user) && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)} className="btn-outline text-center text-sm">Admin Panel</Link>
                )}
                {isChiefEditor(user) && (
                  <Link href="/chief-editor" onClick={() => setMenuOpen(false)} className="btn-outline text-center text-sm">Chief Editor</Link>
                )}
                {isReviewer(user) && (
                  <Link href="/reviewer" onClick={() => setMenuOpen(false)} className="btn-outline text-center text-sm">Reviewer Area</Link>
                )}
                <button onClick={logout} className="btn-ghost text-sm text-red-600 text-center">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="btn-outline text-center text-sm">Sign In</Link>
                <Link href="/auth/register" onClick={() => setMenuOpen(false)} className="btn-primary text-center text-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
