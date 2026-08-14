'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { usersApi } from '@/lib/api';
import { Notification } from '@/types';
import { timeAgo, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const TYPE_COLORS: Record<string, string> = {
  submission: 'bg-blue-100 text-blue-600',
  feedback: 'bg-purple-100 text-purple-600',
  accepted: 'bg-green-100 text-green-600',
  rejected: 'bg-red-100 text-red-600',
  published: 'bg-gold-100 text-gold-600',
  revision_request: 'bg-orange-100 text-orange-600',
  review_assigned: 'bg-navy-100 text-navy-600',
  conference: 'bg-cyan-100 text-cyan-600',
  general: 'bg-gray-100 text-gray-600',
};

const PANEL_WIDTH = 320;

// Handoffs between reviewer, chief editor and admin happen here: this bell is
// the one thing all three staff dashboards share, so a document or decision
// that moves shows up without anyone needing to be told where to look for it.
//
// The panel is portalled to document.body and positioned with measured
// coordinates rather than an absolute + z-index. The bell lives inside a
// sticky sidebar, and sticky (like fixed) always opens its own stacking
// context - so no z-index inside it can ever out-rank a later sibling in
// the page, such as a stat card whose entrance animation leaves a lingering
// transform: translateY(0), which does the same thing. A portal sidesteps
// that class of bug entirely instead of chasing z-index numbers.
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = () => {
    usersApi.notifications().then((r) => setNotifications(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // A minute is frequent enough to feel live without hammering the API -
    // nobody in this audience wants to babysit a manual refresh button.
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const updatePosition = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const left = Math.max(8, Math.min(rect.right - PANEL_WIDTH, window.innerWidth - PANEL_WIDTH - 8));
    setCoords({ top: rect.bottom + 8, left });
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const onReposition = () => updatePosition();
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };

    // Capture phase so scrolling inside the sidebar's own nav or the main
    // content area (neither of which bubbles a scroll event) still repositions it.
    window.addEventListener('scroll', onReposition, true);
    window.addEventListener('resize', onReposition);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', onReposition, true);
      window.removeEventListener('resize', onReposition);
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const unread = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    await usersApi.markAllRead();
    toast.success('All marked as read');
    load();
  };

  // Attending to one notification - opening it - resolves just that one,
  // rather than leaving it sitting there unread until a separate bulk action.
  const markRead = (id: number) => {
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    usersApi.markRead(id).catch(() => {});
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        className="relative p-2.5 rounded-xl text-navy-300 hover:text-gold-400 hover:bg-navy-800 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-gold-500 text-navy-900 text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && coords && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          style={{ top: coords.top, left: coords.left, width: PANEL_WIDTH }}
          className="fixed max-w-[85vw] card p-0 z-[100] overflow-hidden animate-fade-in"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-parchment-200">
            <p className="font-serif text-navy-900">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-gold-600 hover:text-gold-700 font-medium">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-parchment-100">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-navy-400 font-sans">Loading</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-navy-400 font-sans">Nothing yet.</p>
            ) : notifications.slice(0, 15).map((n) => {
              const row = (
                <div className={cn(
                  'flex items-start gap-3 px-4 py-3 hover:bg-parchment-50 transition-colors',
                  !n.is_read && 'bg-gold-50/40'
                )}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[n.type] || 'bg-gray-100 text-gray-600'}`}>
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy-900 truncate">{n.title}</p>
                    <p className="text-xs text-navy-600 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[11px] text-navy-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              );
              const onOpen = () => { if (!n.is_read) markRead(n.id); setOpen(false); };
              return n.link ? (
                <Link key={n.id} href={n.link} onClick={onOpen}>{row}</Link>
              ) : (
                <button key={n.id} type="button" onClick={onOpen} className="w-full text-left">{row}</button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
