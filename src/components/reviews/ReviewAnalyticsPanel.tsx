'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { papersApi } from '@/lib/api';
import { PaperReviewAnalytics } from '@/types';

const CRITERIA: [keyof PaperReviewAnalytics['averages'], string][] = [
  ['originality', 'Originality'],
  ['methodology', 'Methodology'],
  ['clarity', 'Clarity'],
  ['relevance', 'Relevance'],
];

const DECISION_LABEL: Record<string, string> = { accept: 'Accept', revision: 'Revision', reject: 'Reject' };

// Several independent reviewers can now be assigned to one paper - this is
// where their separate guides come together into one picture: who has
// filed, how their scores average out, and whether their decisions agree.
export default function ReviewAnalyticsPanel({ paperId, refreshKey }: { paperId: number; refreshKey?: number }) {
  const [data, setData] = useState<PaperReviewAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    papersApi.reviewAnalytics(paperId)
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [paperId, refreshKey]);

  if (loading) return <div className="card p-6 animate-pulse h-48" />;
  if (!data || data.assigned_count === 0) return null;

  const pct = Math.round((data.submitted_count / data.assigned_count) * 100);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg text-navy-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gold-600" /> Review Analytics
        </h2>
        {data.consensus && (
          <span className={`badge ${data.consensus === 'unanimous' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
            {data.consensus === 'unanimous' ? 'Unanimous' : 'Split decision'}
          </span>
        )}
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between text-sm font-sans mb-1.5">
          <span className="text-navy-600">{data.submitted_count} of {data.assigned_count} reviewers have submitted</span>
          <span className="font-semibold text-navy-800">{pct}%</span>
        </div>
        <div className="h-2 bg-parchment-100 rounded-full overflow-hidden">
          <div className="h-full bg-gold-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {data.submitted_count > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {(['accept', 'revision', 'reject'] as const).map((d) => (
              <div key={d} className="text-center bg-parchment-50 rounded-lg p-2.5">
                <div className="font-semibold text-navy-900">{data.decision_counts[d] || 0}</div>
                <div className="text-xs text-navy-400">{DECISION_LABEL[d]}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2.5 mb-5">
            {CRITERIA.map(([key, label]) => {
              const val = data.averages[key];
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-navy-500 w-24 flex-shrink-0">{label}</span>
                  <div className="flex-1 h-2 bg-parchment-100 rounded-full overflow-hidden">
                    <div className="h-full bg-navy-700 rounded-full" style={{ width: `${((val || 0) / 10) * 100}%` }} />
                  </div>
                  <span className="text-xs font-mono text-navy-700 w-12 text-right">{val ?? '-'}/10</span>
                </div>
              );
            })}
            {typeof data.averages.overall_marks === 'number' && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-navy-500 w-24 flex-shrink-0">Overall Marks</span>
                <div className="flex-1 h-2 bg-parchment-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gold-600 rounded-full" style={{ width: `${((data.averages.overall_marks || 0) / 10) * 100}%` }} />
                </div>
                <span className="text-xs font-mono text-navy-700 w-12 text-right">{data.averages.overall_marks}/10</span>
              </div>
            )}
          </div>
        </>
      )}

      <div className="space-y-1.5 pt-4 border-t border-parchment-200">
        {data.reviewers.map((r) => (
          <div key={r.reviewer_id} className="flex items-center justify-between text-sm">
            <span className="text-navy-700 truncate">{r.reviewer_name}</span>
            {r.status === 'submitted' ? (
              <span className="flex items-center gap-1 text-xs text-green-600 flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {r.decision ? DECISION_LABEL[r.decision] : 'Submitted'}
                {typeof r.overall_marks === 'number' ? ` · ${r.overall_marks}/10` : ''}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-navy-400 flex-shrink-0">
                <Clock className="w-3.5 h-3.5" /> Pending
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
