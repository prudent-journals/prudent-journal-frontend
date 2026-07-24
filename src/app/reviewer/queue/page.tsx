'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, ArrowRight, Search } from 'lucide-react';
import { papersApi } from '@/lib/api';
import { Paper, Review } from '@/types';
import { formatDate, getStatusLabel, getStatusColor } from '@/lib/utils';

type Filter = 'awaiting' | 'reviewed' | 'all';

export default function ReviewerQueuePage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('awaiting');
  const [query, setQuery] = useState('');

  useEffect(() => {
    Promise.allSettled([papersApi.reviewQueue(), papersApi.myReviews()])
      .then(([q, r]) => {
        if (q.status === 'fulfilled') setPapers(q.value.data);
        if (r.status === 'fulfilled') setReviews(r.value.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const reviewedIds = useMemo(() => new Set(reviews.map((r) => r.paper_id)), [reviews]);

  const visible = papers.filter((p) => {
    if (filter === 'awaiting' && reviewedIds.has(p.id)) return false;
    if (filter === 'reviewed' && !reviewedIds.has(p.id)) return false;
    if (query && !p.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const counts = {
    awaiting: papers.filter((p) => !reviewedIds.has(p.id)).length,
    reviewed: papers.filter((p) => reviewedIds.has(p.id)).length,
    all: papers.length,
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <header className="mb-8">
        <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-2">Reviewer</p>
        <h1 className="font-serif text-3xl text-navy-900">Review Queue</h1>
        <p className="text-navy-500 font-sans mt-2">Papers assigned to you for assessment.</p>
      </header>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-1 p-1 rounded-xl bg-parchment-200 w-fit">
          {(['awaiting', 'reviewed', 'all'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-sans font-medium capitalize transition-colors ${
                filter === f ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500 hover:text-navy-800'
              }`}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assigned papers"
            className="input-base pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-navy-400 font-sans text-sm">Loading</div>
      ) : visible.length === 0 ? (
        <div className="card p-12 text-center">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 text-navy-200" />
          <p className="font-sans text-navy-600">
            {query ? 'No assigned paper matches that search.' : 'Nothing in this view.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((paper) => {
            const done = reviewedIds.has(paper.id);
            return (
              <Link key={paper.id} href={`/reviewer/queue/${paper.id}`} className="card p-5 flex items-start gap-4 group">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`badge ${getStatusColor(paper.status)}`}>{getStatusLabel(paper.status)}</span>
                    <span className="badge bg-parchment-200 text-navy-600 capitalize">{paper.paper_type}</span>
                    {done && <span className="badge bg-green-100 text-green-700">Reviewed</span>}
                  </div>
                  <h3 className="font-serif text-lg text-navy-900 group-hover:text-gold-700 transition-colors leading-snug">
                    {paper.title}
                  </h3>
                  <p className="text-sm text-navy-500 font-sans mt-1.5 line-clamp-2">{paper.abstract}</p>
                  <p className="text-xs text-navy-400 font-sans mt-2">Submitted {formatDate(paper.created_at)}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-navy-300 group-hover:text-gold-600 transition-colors mt-1 flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
