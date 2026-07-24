'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Upload, Clock, RefreshCw, ArrowRight, Filter } from 'lucide-react';
import { papersApi } from '@/lib/api';
import { Paper, PaperStatus } from '@/types';
import { getStatusColor, getStatusLabel, formatDate, truncate, cn } from '@/lib/utils';

export default function DashboardPapersPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    papersApi.myPapers(filter || undefined).then(r => setPapers(r.data)).finally(() => setLoading(false));
  }, [filter]);

  const statuses: { value: string; label: string }[] = [
    { value: '', label: 'All' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'revision_requested', label: 'Needs Revision' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'published', label: 'Published' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-navy-900 mb-1">My Papers</h1>
          <p className="text-navy-500 text-sm font-sans">Track all your submissions and their review status.</p>
        </div>
        <Link href="/submit" className="btn-gold text-sm">
          <Upload className="w-4 h-4" /> Submit New Paper
        </Link>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statuses.map(s => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
              filter === s.value
                ? 'bg-navy-900 text-parchment-50'
                : 'bg-white border border-parchment-200 text-navy-600 hover:border-navy-300'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse flex gap-4">
              <div className="w-10 h-10 bg-parchment-200 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-parchment-200 rounded w-3/4" />
                <div className="h-3 bg-parchment-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : papers.length === 0 ? (
        <div className="text-center py-20 card">
          <FileText className="w-14 h-14 text-navy-200 mx-auto mb-4" />
          <h3 className="font-serif text-xl text-navy-600 mb-2">No submissions yet</h3>
          <p className="text-navy-400 text-sm mb-6">Submit your first paper to get started.</p>
          <Link href="/submit" className="btn-primary">Submit a Paper</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {papers.map(paper => (
            <Link
              key={paper.id}
              href={`/dashboard/papers/${paper.id}`}
              className="card p-5 flex items-start gap-4 hover:shadow-card-hover transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-navy-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-navy-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-base text-navy-900 group-hover:text-gold-700 transition-colors truncate mb-1">
                  {paper.title}
                </h3>
                <p className="text-xs text-navy-500 font-sans mb-2">
                  {paper.paper_type === 'conference' ? 'Conference Paper' : 'Journal Article'} · Submitted {formatDate(paper.created_at)}
                </p>
                <p className="text-sm text-navy-600 font-sans line-clamp-1">{truncate(paper.abstract, 120)}</p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className={`badge ${getStatusColor(paper.status)}`}>{getStatusLabel(paper.status)}</span>
                {paper.status === 'revision_requested' && (
                  <span className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                    <RefreshCw className="w-3 h-3" /> Action needed
                  </span>
                )}
                <ArrowRight className="w-4 h-4 text-navy-300 group-hover:text-gold-500 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
