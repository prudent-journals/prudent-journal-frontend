'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Clock, CheckCircle, XCircle, Upload, Bell, ArrowRight, BookOpen } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { papersApi, usersApi } from '@/lib/api';
import { Paper, Notification } from '@/types';
import { getStatusColor, getStatusLabel, formatDate, timeAgo } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      papersApi.myPapers(),
      usersApi.notifications(),
    ]).then(([papersRes, notifsRes]) => {
      setPapers(papersRes.data.slice(0, 10));
      setNotifications(notifsRes.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const stats = {
    total: papers.length,
    submitted: papers.filter(p => ['submitted', 'under_review', 'reviewed', 'resubmitted'].includes(p.status)).length,
    accepted: papers.filter(p => p.status === 'accepted').length,
    published: papers.filter(p => p.status === 'published').length,
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-parchment-200 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-parchment-200 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <h1 className="font-serif text-3xl text-navy-900 mb-1">
          Welcome back, {user?.full_name.split(' ')[0]}
        </h1>
        <p className="text-navy-500 font-sans text-sm">
          Here's an overview of your research activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        {[
          { label: 'Total Submissions', value: stats.total, icon: FileText, color: 'bg-blue-50 text-blue-600' },
          { label: 'Under Review', value: stats.submitted, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Accepted', value: stats.accepted, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
          { label: 'Published', value: stats.published, icon: BookOpen, color: 'bg-gold-50 text-gold-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5 animate-fade-up">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="font-serif text-2xl text-navy-900 font-semibold">{value}</div>
            <div className="text-navy-500 text-sm font-sans mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Papers list */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-parchment-200">
            <h2 className="font-serif text-lg text-navy-900">Recent Submissions</h2>
            <Link href="/dashboard/papers" className="text-sm text-gold-600 hover:text-gold-700 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {papers.length === 0 ? (
            <div className="text-center py-16 px-6">
              <FileText className="w-12 h-12 text-navy-200 mx-auto mb-3" />
              <p className="text-navy-500 font-sans text-sm mb-4">No submissions yet.</p>
              <Link href="/submit" className="btn-gold text-sm">Submit Your First Paper</Link>
            </div>
          ) : (
            <div className="divide-y divide-parchment-100">
              {papers.map(paper => (
                <Link key={paper.id} href={`/dashboard/papers/${paper.id}`}
                  className="flex items-start gap-4 px-6 py-4 hover:bg-parchment-50 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-navy-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-navy-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-900 group-hover:text-gold-700 transition-colors truncate">
                      {paper.title}
                    </p>
                    <p className="text-xs text-navy-400 mt-0.5">{formatDate(paper.created_at)}</p>
                  </div>
                  <span className={`badge flex-shrink-0 ${getStatusColor(paper.status)}`}>
                    {getStatusLabel(paper.status)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Notifications + Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card p-5">
            <h2 className="font-serif text-base text-navy-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/submit" className="flex items-center gap-3 p-3 rounded-xl hover:bg-parchment-100 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-gold-100 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-gold-600" />
                </div>
                <span className="text-sm font-medium text-navy-700 group-hover:text-navy-900">Submit Paper</span>
                <ArrowRight className="w-3.5 h-3.5 text-navy-400 ml-auto" />
              </Link>
              <Link href="/conferences" className="flex items-center gap-3 p-3 rounded-xl hover:bg-parchment-100 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-navy-100 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-navy-600" />
                </div>
                <span className="text-sm font-medium text-navy-700 group-hover:text-navy-900">Browse Conferences</span>
                <ArrowRight className="w-3.5 h-3.5 text-navy-400 ml-auto" />
              </Link>
            </div>
          </div>

          {/* Recent notifications */}
          <div className="card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-parchment-200">
              <h2 className="font-serif text-base text-navy-900">Notifications</h2>
              <Link href="/dashboard/notifications" className="text-xs text-gold-600 hover:text-gold-700">View all</Link>
            </div>
            {notifications.length === 0 ? (
              <p className="text-center py-8 text-sm text-navy-400 font-sans">No notifications yet.</p>
            ) : (
              <div className="divide-y divide-parchment-100">
                {notifications.map(notif => (
                  <div key={notif.id} className={`px-5 py-3 ${!notif.is_read ? 'bg-gold-50/50' : ''}`}>
                    <p className="text-sm font-medium text-navy-800">{notif.title}</p>
                    <p className="text-xs text-navy-500 mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-xs text-navy-400 mt-1">{timeAgo(notif.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
