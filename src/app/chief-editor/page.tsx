'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText, Clock, Star, CheckCircle, ArrowRight, Users, TrendingUp,
} from 'lucide-react';
import { papersApi } from '@/lib/api';
import { EditorStats, Paper, PaperStatus } from '@/types';
import { getStatusColor, getStatusLabel, timeAgo } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';

const STATUS_ORDER: PaperStatus[] = [
  'submitted', 'resubmitted', 'under_review', 'reviewed',
  'revision_requested', 'accepted', 'rejected', 'published',
];

const BAR_COLOR: Record<PaperStatus, string> = {
  submitted: 'bg-blue-500',
  resubmitted: 'bg-cyan-500',
  under_review: 'bg-yellow-500',
  reviewed: 'bg-purple-500',
  revision_requested: 'bg-orange-500',
  accepted: 'bg-green-500',
  rejected: 'bg-red-500',
  published: 'bg-emerald-500',
};

function monthLabel(ym: string): string {
  const [year, month] = ym.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short' });
}

export default function ChiefEditorOverviewPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<EditorStats | null>(null);
  const [recent, setRecent] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.allSettled([
      papersApi.editorStats(),
      papersApi.adminAll({ size: 6 }),
    ]).then(([s, p]) => {
      if (s.status === 'fulfilled') setStats(s.value.data);
      if (p.status === 'fulfilled') setRecent(p.value.data);
    }).finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="p-8 animate-pulse space-y-6">
        <div className="h-8 bg-parchment-200 rounded w-1/4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-parchment-200 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const counts = stats?.status_counts || {};
  const needsAssignment = (counts.submitted || 0) + (counts.resubmitted || 0);
  const awaitingDecision = counts.reviewed || 0;
  const underReview = counts.under_review || 0;
  const acceptedNotPublished = counts.accepted || 0;
  const totalPapers = Object.values(counts).reduce((a, b) => a + b, 0);
  const maxStatus = Math.max(1, ...STATUS_ORDER.map((s) => counts[s] || 0));
  const maxMonth = Math.max(1, ...(stats?.monthly_submissions || []).map((m) => m.count));

  const statCards = [
    { label: 'Needs a Reviewer', value: needsAssignment, icon: Clock, href: '/chief-editor/papers?status=submitted', color: 'text-blue-600 bg-blue-50' },
    { label: 'Under Review', value: underReview, icon: FileText, href: '/chief-editor/papers?status=under_review', color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Awaiting Your Decision', value: awaitingDecision, icon: Star, href: '/chief-editor/papers?status=reviewed', color: 'text-purple-600 bg-purple-50' },
    { label: 'Accepted, Not Yet Published', value: acceptedNotPublished, icon: CheckCircle, href: '/chief-editor/papers?status=accepted', color: 'text-green-600 bg-green-50' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-navy-900 mb-1">Chief Editor Dashboard</h1>
        <p className="text-navy-500 font-sans text-sm">
          Assign reviewers, weigh their feedback and authorize papers for publication.
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

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Status breakdown */}
        <div className="card p-6">
          <h2 className="font-serif text-lg text-navy-900 mb-1">Submissions by Status</h2>
          <p className="text-xs text-navy-400 font-sans mb-5">{totalPapers} papers in the system</p>
          <div className="space-y-3">
            {STATUS_ORDER.map((status) => {
              const value = counts[status] || 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className={`badge w-[9.5rem] flex-shrink-0 justify-center ${getStatusColor(status)}`}>
                    {getStatusLabel(status)}
                  </span>
                  <div className="flex-1 h-2.5 bg-parchment-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${BAR_COLOR[status]} transition-all`}
                      style={{ width: `${(value / maxStatus) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-navy-700 w-6 text-right tabular-figures">{value}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submissions trend */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-serif text-lg text-navy-900">Submissions Trend</h2>
            <TrendingUp className="w-4 h-4 text-navy-400" />
          </div>
          <p className="text-xs text-navy-400 font-sans mb-5">Last six months</p>
          <div className="flex items-end justify-between gap-3 h-40">
            {(stats?.monthly_submissions || []).map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-xs font-semibold text-navy-700">{m.count}</span>
                <div
                  className="w-full max-w-10 rounded-t-lg bg-gold-500 transition-all"
                  style={{ height: `${Math.max(4, (m.count / maxMonth) * 100)}%` }}
                />
                <span className="text-[11px] text-navy-400 font-sans">{monthLabel(m.month)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent submissions */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-parchment-200">
            <h2 className="font-serif text-lg text-navy-900">Recent Submissions</h2>
            <Link href="/chief-editor/papers" className="text-sm text-gold-600 hover:text-gold-700 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-parchment-100">
            {recent.length === 0 ? (
              <p className="px-6 py-8 text-center text-navy-400 text-sm font-sans">No submissions yet.</p>
            ) : recent.map((paper) => (
              <Link key={paper.id} href={`/chief-editor/papers/${paper.id}`}
                className="flex items-start gap-3 px-6 py-3.5 hover:bg-parchment-50 transition-colors group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-900 group-hover:text-gold-700 transition-colors truncate">
                    {paper.title}
                  </p>
                  <p className="text-xs text-navy-400 mt-0.5">
                    {paper.author?.full_name} &middot; {timeAgo(paper.created_at)}
                  </p>
                </div>
                <span className={`badge flex-shrink-0 ${getStatusColor(paper.status)}`}>
                  {getStatusLabel(paper.status)}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Reviewer workload */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-parchment-200">
            <h2 className="font-serif text-lg text-navy-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-navy-500" /> Reviewer Workload
            </h2>
            <Link href="/chief-editor/reviewers" className="text-sm text-gold-600 hover:text-gold-700 flex items-center gap-1">
              Details <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-parchment-100">
            {(stats?.reviewer_workload || []).length === 0 ? (
              <p className="px-6 py-8 text-center text-navy-400 text-sm font-sans">No reviewers on the roster yet.</p>
            ) : stats!.reviewer_workload.slice(0, 6).map((r) => (
              <div key={r.reviewer_id} className="flex items-center justify-between px-6 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-navy-800 truncate">{r.reviewer_name}</p>
                  <p className="text-xs text-navy-400">{r.completed_reviews} reviews completed</p>
                </div>
                <span className={`badge flex-shrink-0 ${r.active_assignments > 2 ? 'bg-orange-100 text-orange-700' : 'bg-parchment-200 text-navy-600'}`}>
                  {r.active_assignments} active
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
