'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, ArrowRight, Search, UserCheck, Clock } from 'lucide-react';
import { papersApi } from '@/lib/api';
import { Paper } from '@/types';
import { formatDate, getStatusLabel, getStatusColor } from '@/lib/utils';

export default function AdminReviewQueuePage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    papersApi.reviewQueue()
      .then((r) => setPapers(r.data))
      .catch(() => setPapers([]))
      .finally(() => setLoading(false));
  }, []);

  const visible = papers.filter(
    (p) => !query || p.title.toLowerCase().includes(query.toLowerCase()),
  );

  const unassigned = papers.filter((p) => !p.assigned_reviewer_id).length;
  const inReview = papers.filter((p) => p.assigned_reviewer_id).length;

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <header className="mb-8">
        <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-2">Administration</p>
        <h1 className="font-serif text-3xl text-navy-900">Review Queue</h1>
        <p className="text-navy-500 font-sans mt-2">
          Submissions waiting on a reviewer, and those currently under assessment.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4 mb-8 max-w-lg">
        {[
          { label: 'Awaiting a reviewer', value: unassigned, icon: Clock, tone: 'text-gold-700 bg-gold-50' },
          { label: 'With a reviewer', value: inReview, icon: UserCheck, tone: 'text-navy-700 bg-navy-50' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tone}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="font-display text-3xl text-navy-900 tabular-figures">{loading ? '' : value}</p>
            <p className="text-sm text-navy-500 font-sans mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-sm mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search submissions"
          className="input-base pl-9"
        />
      </div>

      {loading ? (
        <div className="card p-10 text-center text-navy-400 font-sans text-sm">Loading</div>
      ) : visible.length === 0 ? (
        <div className="card p-12 text-center">
          <Star className="w-10 h-10 mx-auto mb-3 text-navy-200" />
          <p className="font-sans text-navy-600">
            {papers.length === 0 ? 'Nothing is waiting for review.' : 'No submission matches that search.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((paper) => (
            <Link key={paper.id} href={`/admin/papers/${paper.id}`} className="card p-5 flex items-start gap-4 group">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className={`badge ${getStatusColor(paper.status)}`}>{getStatusLabel(paper.status)}</span>
                  <span className="badge bg-parchment-200 text-navy-600 capitalize">{paper.paper_type}</span>
                  {!paper.assigned_reviewer_id && (
                    <span className="badge bg-gold-100 text-gold-700">Needs a reviewer</span>
                  )}
                </div>
                <h3 className="font-serif text-lg text-navy-900 group-hover:text-gold-700 transition-colors leading-snug">
                  {paper.title}
                </h3>
                <p className="text-xs text-navy-400 font-sans mt-2">Submitted {formatDate(paper.created_at)}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-navy-300 group-hover:text-gold-600 transition-colors mt-1 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
