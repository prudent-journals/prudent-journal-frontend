'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, CheckCircle2, Clock, ArrowRight, Star, Eye, Gauge, TrendingUp } from 'lucide-react';
import { papersApi } from '@/lib/api';
import { Paper, Review, ReviewDecision } from '@/types';
import { formatDate, getStatusLabel, getStatusColor } from '@/lib/utils';

const DECISION_ORDER: ReviewDecision[] = ['accept', 'revision', 'reject'];

const DECISION_LABEL: Record<ReviewDecision, string> = {
  accept: 'Accept',
  revision: 'Revision',
  reject: 'Reject',
};

const DECISION_BAR: Record<ReviewDecision, string> = {
  accept: 'bg-green-500',
  revision: 'bg-orange-500',
  reject: 'bg-red-500',
};

type ScoreKey = 'originality_score' | 'methodology_score' | 'clarity_score' | 'relevance_score';

const CRITERIA: [ScoreKey, string][] = [
  ['originality_score', 'Originality'],
  ['methodology_score', 'Methodology'],
  ['clarity_score', 'Clarity'],
  ['relevance_score', 'Relevance'],
];

function monthlyTrend(reviews: Review[]): { key: string; label: string; count: number }[] {
  const now = new Date();
  const buckets = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      count: 0,
    };
  });
  reviews.forEach((r) => {
    const d = new Date(r.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) bucket.count += 1;
  });
  return buckets;
}

function average(reviews: Review[], key: ScoreKey): number {
  const values = reviews.map((r) => r[key]).filter((v): v is number => typeof v === 'number');
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export default function ReviewerOverviewPage() {
  const [queue, setQueue] = useState<Paper[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([papersApi.reviewQueue(), papersApi.myReviews()])
      .then(([q, r]) => {
        if (q.status === 'fulfilled') setQueue(q.value.data);
        if (r.status === 'fulfilled') setReviews(r.value.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const reviewedIds = new Set(reviews.map((r) => r.paper_id));
  const awaiting = queue.filter((p) => !reviewedIds.has(p.id));
  const shared = reviews.filter((r) => r.is_visible_to_author).length;

  const decisionCounts: Record<ReviewDecision, number> = { accept: 0, revision: 0, reject: 0 };
  reviews.forEach((r) => { decisionCounts[r.decision] = (decisionCounts[r.decision] || 0) + 1; });
  const maxDecision = Math.max(1, ...DECISION_ORDER.map((d) => decisionCounts[d]));

  const trend = monthlyTrend(reviews);
  const maxTrend = Math.max(1, ...trend.map((t) => t.count));

  const statCards = [
    { label: 'Awaiting Your Review', value: awaiting.length, icon: Clock, tone: 'text-gold-700 bg-gold-50', href: '/reviewer/queue' },
    { label: 'Assigned to You', value: queue.length, icon: ClipboardList, tone: 'text-navy-700 bg-navy-50', href: '/reviewer/queue' },
    { label: 'Reviews Completed', value: reviews.length, icon: CheckCircle2, tone: 'text-green-700 bg-green-50', href: '/reviewer/completed' },
    { label: 'Shared with Author', value: shared, icon: Eye, tone: 'text-purple-700 bg-purple-50', href: '/reviewer/completed' },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <header className="mb-8">
        <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-2">Reviewer</p>
        <h1 className="font-serif text-3xl text-navy-900">Overview</h1>
        <p className="text-navy-500 font-sans mt-2">
          Papers assigned to you, and the reviews you have already submitted.
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        {statCards.map(({ label, value, icon: Icon, tone, href }) => (
          <Link key={label} href={href} className="card p-5 hover:shadow-card-hover transition-all group animate-fade-up">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tone}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="font-display text-2xl text-navy-900 tabular-figures">{loading ? '' : value}</p>
            <div className="text-navy-500 text-sm font-sans mt-0.5 flex items-center gap-1">
              {label}
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>

      {reviews.length > 0 && (
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Decision breakdown */}
          <div className="card p-6">
            <h2 className="font-serif text-lg text-navy-900 mb-1">Your Recommendations</h2>
            <p className="text-xs text-navy-400 font-sans mb-5">{reviews.length} reviews submitted</p>
            <div className="space-y-3">
              {DECISION_ORDER.map((d) => {
                const value = decisionCounts[d];
                return (
                  <div key={d} className="flex items-center gap-3">
                    <span className="w-20 flex-shrink-0 text-sm font-sans text-navy-600">{DECISION_LABEL[d]}</span>
                    <div className="flex-1 h-2.5 bg-parchment-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${DECISION_BAR[d]} transition-all`}
                        style={{ width: `${(value / maxDecision) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-navy-700 w-6 text-right tabular-figures">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Average scores */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-serif text-lg text-navy-900">Your Average Scoring</h2>
              <Gauge className="w-4 h-4 text-navy-400" />
            </div>
            <p className="text-xs text-navy-400 font-sans mb-5">Across every criterion you have scored</p>
            <div className="space-y-3">
              {CRITERIA.map(([key, label]) => {
                const value = average(reviews, key);
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-28 flex-shrink-0 text-sm font-sans text-navy-600">{label}</span>
                    <div className="flex-1 h-2.5 bg-parchment-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gold-500 transition-all"
                        style={{ width: `${(value / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-navy-700 w-10 text-right tabular-figures">
                      {value.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews trend */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-serif text-lg text-navy-900">Reviews Trend</h2>
              <TrendingUp className="w-4 h-4 text-navy-400" />
            </div>
            <p className="text-xs text-navy-400 font-sans mb-5">Last six months</p>
            <div className="flex items-end justify-between gap-2 h-40">
              {trend.map((m) => (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-xs font-semibold text-navy-700">{m.count}</span>
                  <div
                    className="w-full max-w-10 rounded-t-lg bg-gold-500 transition-all"
                    style={{ height: `${Math.max(4, (m.count / maxTrend) * 100)}%` }}
                  />
                  <span className="text-[11px] text-navy-400 font-sans">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <section className="mb-10">
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-serif text-xl text-navy-900">Needs your attention</h2>
          <Link href="/reviewer/queue" className="text-sm font-sans text-navy-600 hover:text-gold-700 inline-flex items-center gap-1.5 animated-underline">
            Full queue <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="card p-8 text-center text-navy-400 font-sans text-sm">Loading</div>
        ) : awaiting.length === 0 ? (
          <div className="card p-10 text-center">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-600/40" />
            <p className="font-sans text-navy-600">Nothing waiting on you right now.</p>
            <p className="font-sans text-sm text-navy-400 mt-1">
              You will be notified when a paper is assigned.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {awaiting.slice(0, 5).map((paper) => (
              <Link key={paper.id} href={`/reviewer/queue/${paper.id}`} className="card p-5 flex items-start gap-4 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`badge ${getStatusColor(paper.status)}`}>{getStatusLabel(paper.status)}</span>
                    <span className="badge bg-parchment-200 text-navy-600 capitalize">{paper.paper_type}</span>
                  </div>
                  <h3 className="font-serif text-navy-900 group-hover:text-gold-700 transition-colors leading-snug">
                    {paper.title}
                  </h3>
                  <p className="text-xs text-navy-400 font-sans mt-1.5">
                    Submitted {formatDate(paper.created_at)}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-navy-300 group-hover:text-gold-600 transition-colors mt-1 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-serif text-xl text-navy-900">Recent reviews</h2>
          <Link href="/reviewer/completed" className="text-sm font-sans text-navy-600 hover:text-gold-700 inline-flex items-center gap-1.5 animated-underline">
            All reviews <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="card p-8 text-center text-navy-400 font-sans text-sm">Loading</div>
        ) : reviews.length === 0 ? (
          <div className="card p-10 text-center text-navy-500 font-sans">
            <Star className="w-10 h-10 mx-auto mb-3 text-navy-200" />
            You have not submitted any reviews yet.
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.slice(0, 4).map((review) => (
              <div key={review.id} className="card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`badge ${
                    review.decision === 'accept' ? 'bg-green-100 text-green-700'
                    : review.decision === 'reject' ? 'bg-red-100 text-red-700'
                    : 'bg-gold-100 text-gold-700'}`}>
                    {review.decision === 'revision' ? 'Revision requested' : review.decision}
                  </span>
                  <span className="text-xs text-navy-400 font-sans">{formatDate(review.created_at)}</span>
                </div>
                <p className="font-serif text-navy-900 leading-snug">{review.paper_title || `Paper #${review.paper_id}`}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
