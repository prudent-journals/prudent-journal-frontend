'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { papersApi } from '@/lib/api';
import { Review } from '@/types';
import { formatDate } from '@/lib/utils';

const DECISION_STYLE: Record<string, string> = {
  accept: 'bg-green-100 text-green-700',
  reject: 'bg-red-100 text-red-700',
  revision: 'bg-gold-100 text-gold-700',
};

export default function CompletedReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    papersApi.myReviews()
      .then((r) => setReviews(r.data))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 lg:p-10 max-w-5xl">
      <header className="mb-8">
        <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-2">Reviewer</p>
        <h1 className="font-serif text-3xl text-navy-900">Completed Reviews</h1>
        <p className="text-navy-500 font-sans mt-2">
          Every assessment you have submitted, with whether it has been shared with the author.
        </p>
      </header>

      {loading ? (
        <div className="card p-10 text-center text-navy-400 font-sans text-sm">Loading</div>
      ) : reviews.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-navy-200" />
          <p className="font-sans text-navy-600">No completed reviews yet.</p>
          <Link href="/reviewer/queue" className="btn-outline mt-5 inline-flex">Go to review queue</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <article key={review.id} className="card p-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`badge ${DECISION_STYLE[review.decision] || 'bg-parchment-200 text-navy-600'}`}>
                  {review.decision === 'revision' ? 'Revision requested' : review.decision}
                </span>
                <span className={`badge inline-flex items-center gap-1 ${
                  review.is_visible_to_author ? 'bg-navy-100 text-navy-700' : 'bg-parchment-200 text-navy-500'
                }`}>
                  {review.is_visible_to_author
                    ? <><Eye className="w-3 h-3" /> Shared with author</>
                    : <><EyeOff className="w-3 h-3" /> Not yet shared</>}
                </span>
                <span className="text-xs text-navy-400 font-sans ml-auto">{formatDate(review.created_at)}</span>
              </div>

              <h2 className="font-serif text-lg text-navy-900 leading-snug mb-3">
                {review.paper_title || `Paper #${review.paper_id}`}
              </h2>

              <p className="font-sans text-sm text-navy-600 leading-relaxed whitespace-pre-wrap">
                {review.content}
              </p>

              <div className="grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-parchment-200">
                {([
                  ['originality_score', 'Originality'],
                  ['methodology_score', 'Methodology'],
                  ['clarity_score', 'Clarity'],
                  ['relevance_score', 'Relevance'],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <p className="font-sans text-xs text-navy-400">{label}</p>
                    <p className="font-display text-lg text-navy-900 tabular-figures">
                      {(review[key] as number | undefined) ?? '-'}
                      <span className="text-xs text-navy-400">/10</span>
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
