'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, CheckCircle2, Clock, ArrowRight, Star } from 'lucide-react';
import { papersApi } from '@/lib/api';
import { Paper, Review } from '@/types';
import { formatDate, getStatusLabel, getStatusColor } from '@/lib/utils';

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

  const stats = [
    { label: 'Awaiting your review', value: awaiting.length, icon: Clock, tone: 'text-gold-700 bg-gold-50' },
    { label: 'Assigned to you', value: queue.length, icon: ClipboardList, tone: 'text-navy-700 bg-navy-50' },
    { label: 'Reviews completed', value: reviews.length, icon: CheckCircle2, tone: 'text-green-700 bg-green-50' },
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

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tone}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="font-display text-3xl text-navy-900 tabular-figures">{loading ? '' : value}</p>
            <p className="text-sm text-navy-500 font-sans mt-1">{label}</p>
          </div>
        ))}
      </div>

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
              You will be notified by email when a paper is assigned.
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
