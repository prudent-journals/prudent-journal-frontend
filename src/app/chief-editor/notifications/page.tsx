'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { usersApi } from '@/lib/api';
import { Notification } from '@/types';
import { timeAgo, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const typeColors: Record<string, string> = {
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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    usersApi.notifications().then(r => setNotifications(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    await usersApi.markAllRead();
    toast.success('All marked as read');
    load();
  };

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-navy-900 mb-1">Notifications</h1>
          {unread > 0 && <p className="text-sm text-navy-500">{unread} unread</p>}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 text-sm text-navy-600 hover:text-navy-900 font-medium">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse flex gap-3">
              <div className="w-8 h-8 rounded-full bg-parchment-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-parchment-200 rounded w-1/2" />
                <div className="h-3 bg-parchment-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-14 h-14 text-navy-200 mx-auto mb-4" />
          <p className="text-navy-500 font-sans">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={cn(
                'card p-4 flex items-start gap-3 transition-all',
                !notif.is_read ? 'border-l-4 border-l-gold-400 bg-gold-50/30' : ''
              )}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${typeColors[notif.type] || 'bg-gray-100 text-gray-600'}`}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-navy-900">{notif.title}</p>
                <p className="text-sm text-navy-600 mt-0.5 leading-relaxed">{notif.message}</p>
                <p className="text-xs text-navy-400 mt-1">{timeAgo(notif.created_at)}</p>
              </div>
              {notif.link && (
                <Link href={notif.link} className="text-gold-500 hover:text-gold-600 flex-shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
