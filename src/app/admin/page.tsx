'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Users, BookOpen, Calendar, TrendingUp, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { papersApi, usersApi, publicationsApi, conferencesApi } from '@/lib/api';
import { Paper, User, Conference } from '@/types';
import { getStatusColor, getStatusLabel, formatDate, timeAgo } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';

export default function AdminPage() {
  const { user } = useAuthStore();
  // Each administrative role sees only the parts of the system it controls.
  const canJournal = user?.role === 'super_admin' || user?.role === 'journal_admin';
  const canUsers = user?.role === 'super_admin';
  const canConferences = user?.role === 'super_admin' || user?.role === 'conference_admin';

  const [papers, setPapers] = useState<Paper[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [stats, setStats] = useState({ total_publications: 0, total_views: 0, total_downloads: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.allSettled([
      canJournal ? papersApi.adminAll({ size: 10 }) : Promise.resolve(null),
      canUsers ? usersApi.adminList({ size: 100 }) : Promise.resolve(null),
      conferencesApi.list(),
      publicationsApi.stats(),
    ]).then(([p, u, c, s]) => {
      if (p.status === 'fulfilled' && p.value) setPapers(p.value.data);
      if (u.status === 'fulfilled' && u.value) setUsers(u.value.data.items);
      if (c.status === 'fulfilled' && c.value) setConferences(c.value.data);
      if (s.status === 'fulfilled' && s.value) setStats(s.value.data);
    }).finally(() => setLoading(false));
  }, [user, canJournal, canUsers]);

  const paperStats = {
    total: papers.length,
    pending: papers.filter(p => ['submitted', 'resubmitted'].includes(p.status)).length,
    under_review: papers.filter(p => p.status === 'under_review').length,
    published: papers.filter(p => p.status === 'published').length,
  };

  const statCards = [
    canJournal && { label: 'Total Papers', value: paperStats.total, icon: FileText, href: '/admin/papers', color: 'text-blue-600 bg-blue-50' },
    canJournal && { label: 'Pending Review', value: paperStats.pending, icon: Clock, href: '/admin/papers?status=submitted', color: 'text-orange-600 bg-orange-50' },
    canJournal && { label: 'Published', value: stats.total_publications, icon: BookOpen, href: '/admin/publications', color: 'text-gold-600 bg-gold-50' },
    canConferences && { label: 'Conferences', value: conferences.length, icon: Calendar, href: '/admin/conferences', color: 'text-green-600 bg-green-50' },
    canUsers && { label: 'Total Users', value: users.length, icon: Users, href: '/admin/users', color: 'text-purple-600 bg-purple-50' },
  ].filter(Boolean) as { label: string; value: number; icon: typeof FileText; href: string; color: string }[];

  if (loading) {
    return (
      <div className="p-8 animate-pulse space-y-6">
        <div className="h-8 bg-parchment-200 rounded w-1/4" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-parchment-200 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-navy-900 mb-1">Admin Dashboard</h1>
        <p className="text-navy-500 font-sans text-sm">
          {canUsers
            ? 'Manage submissions, publications, conferences and users.'
            : canJournal
              ? 'Manage submissions and publications.'
              : 'Manage conferences and registrations.'}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        {statCards.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href} className="card p-5 hover:shadow-card-hover transition-all group animate-fade-up">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="font-serif text-2xl text-navy-900 font-semibold">{value}</div>
            <div className="text-navy-500 text-sm font-sans mt-0.5 flex items-center gap-1">
              {label}
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>

      {/* Extra stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Views', value: stats.total_views.toLocaleString(), icon: TrendingUp },
          { label: 'Downloads', value: stats.total_downloads.toLocaleString(), icon: CheckCircle },
          { label: 'Conferences', value: conferences.length, icon: Calendar },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-parchment-200 p-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-navy-100 flex items-center justify-center">
              <Icon className="w-4 h-4 text-navy-600" />
            </div>
            <div>
              <div className="font-serif text-xl text-navy-900 font-semibold">{value}</div>
              <div className="text-xs text-navy-400 font-sans">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent submissions */}
        {canJournal && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-parchment-200">
            <h2 className="font-serif text-lg text-navy-900">Recent Submissions</h2>
            <Link href="/admin/papers" className="text-sm text-gold-600 hover:text-gold-700 flex items-center gap-1">
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-parchment-100">
            {papers.slice(0, 6).map(paper => (
              <Link key={paper.id} href={`/admin/papers/${paper.id}`}
                className="flex items-start gap-3 px-6 py-3.5 hover:bg-parchment-50 transition-colors group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-900 group-hover:text-gold-700 transition-colors truncate">
                    {paper.title}
                  </p>
                  <p className="text-xs text-navy-400 mt-0.5">
                    {paper.author?.full_name} · {timeAgo(paper.created_at)}
                  </p>
                </div>
                <span className={`badge flex-shrink-0 ${getStatusColor(paper.status)}`}>
                  {getStatusLabel(paper.status)}
                </span>
              </Link>
            ))}
          </div>
        </div>
        )}

        {/* Recent users and quick actions */}
        <div className="space-y-6">
          {canUsers && (
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-parchment-200">
              <h2 className="font-serif text-lg text-navy-900">Recent Users</h2>
              <Link href="/admin/users" className="text-sm text-gold-600 hover:text-gold-700 flex items-center gap-1">
                Manage <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-parchment-100">
              {users.slice(0, 5).map(user => (
                <div key={user.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-navy-100 text-navy-600 flex items-center justify-center text-xs font-semibold">
                      {user.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy-800">{user.full_name}</p>
                      <p className="text-xs text-navy-400">{user.institution || user.email}</p>
                    </div>
                  </div>
                  <span className="badge bg-parchment-200 text-navy-600">{user.role.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
          )}

          <div className="card p-5">
            <h3 className="font-serif text-base text-navy-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {([
                canJournal && { href: '/admin/papers?status=submitted', label: 'Review Pending Submissions', badge: paperStats.pending },
                canJournal && { href: '/admin/papers?status=reviewed', label: 'Papers Awaiting Decision' },
                canConferences && { href: '/admin/conferences', label: 'Manage Conferences' },
              ].filter(Boolean) as { href: string; label: string; badge?: number }[]).map(({ href, label, badge }) => (
                <Link key={href} href={href}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-parchment-100 transition-colors text-sm text-navy-700 font-medium">
                  {label}
                  {badge !== undefined && badge > 0 && (
                    <span className="badge bg-orange-100 text-orange-700">{badge}</span>
                  )}
                  <ArrowRight className="w-3.5 h-3.5 text-navy-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
