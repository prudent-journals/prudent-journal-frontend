'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

// Bank-app style session policy: sign out after this long with no
// mouse/keyboard/touch activity anywhere on the page, warning shortly before
// it happens so someone who is idle but still there can stay signed in with
// one click. Tune these two if the client wants a longer or shorter window.
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const WARNING_MS = 60 * 1000;
const CHECK_INTERVAL_MS = 5 * 1000;
const ACTIVITY_THROTTLE_MS = 2 * 1000;

// Shared across tabs via localStorage: activity in one tab resets the timer
// in every other open tab, the way a real banking site behaves, instead of
// each tab quietly signing itself out on its own clock.
const ACTIVITY_STORAGE_KEY = 'pj_last_activity';
const LOGOUT_REASON_KEY = 'pj_logout_reason';

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'] as const;

export default function IdleLogoutGuard() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const lastActivityRef = useRef(Date.now());

  const recordActivity = useCallback((broadcast: boolean) => {
    lastActivityRef.current = Date.now();
    setSecondsLeft(null);
    if (broadcast) {
      try {
        localStorage.setItem(ACTIVITY_STORAGE_KEY, String(lastActivityRef.current));
      } catch {
        // Private browsing / storage disabled - this tab still tracks its
        // own activity via lastActivityRef, it just won't sync to others.
      }
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    recordActivity(true);
    let lastRecorded = Date.now();

    const onActivity = () => {
      const now = Date.now();
      if (now - lastRecorded < ACTIVITY_THROTTLE_MS) return;
      lastRecorded = now;
      recordActivity(true);
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key !== ACTIVITY_STORAGE_KEY || !e.newValue) return;
      const ts = Number(e.newValue);
      if (ts > lastActivityRef.current) {
        lastActivityRef.current = ts;
        setSecondsLeft(null);
      }
    };

    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));
    window.addEventListener('storage', onStorage);

    // A poll rather than one long setTimeout - background tabs throttle
    // timers, but comparing wall-clock time on each tick stays correct
    // regardless of how late a given tick actually fires.
    const interval = setInterval(() => {
      const remaining = IDLE_TIMEOUT_MS - (Date.now() - lastActivityRef.current);

      if (remaining <= 0) {
        try {
          sessionStorage.setItem(LOGOUT_REASON_KEY, 'idle');
        } catch {
          // No session storage - the sign-out itself still happens, the
          // login page just won't have anything to explain it with.
        }
        logout();
        return;
      }

      setSecondsLeft(remaining <= WARNING_MS ? Math.ceil(remaining / 1000) : null);
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, onActivity));
      window.removeEventListener('storage', onStorage);
      clearInterval(interval);
    };
  }, [user, logout, recordActivity]);

  if (!user || secondsLeft === null) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-navy-950/60 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 text-center shadow-xl">
        <div className="w-12 h-12 rounded-full bg-gold-50 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-6 h-6 text-gold-600" />
        </div>
        <h2 className="font-serif text-lg text-navy-900 mb-2">Still there?</h2>
        <p className="text-sm text-navy-500 font-sans mb-5">
          You&apos;ve been inactive for a while. For your security you&apos;ll be signed out in{' '}
          <span className="font-semibold text-navy-800 tabular-nums">{secondsLeft}s</span>.
        </p>
        <button type="button" onClick={() => recordActivity(true)} className="btn-primary w-full justify-center">
          Stay signed in
        </button>
      </div>
    </div>
  );
}
