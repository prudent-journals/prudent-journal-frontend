'use client';

import { useEffect, useState } from 'react';
import { Users, Mail, Loader2 } from 'lucide-react';
import { papersApi } from '@/lib/api';
import { ReviewerOption, ReviewerWorkload } from '@/types';

export default function ChiefEditorReviewersPage() {
  const [reviewers, setReviewers] = useState<ReviewerOption[]>([]);
  const [workload, setWorkload] = useState<ReviewerWorkload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([papersApi.editorReviewers(), papersApi.editorStats()])
      .then(([r, s]) => {
        setReviewers(r.data);
        setWorkload(s.data.reviewer_workload);
      })
      .finally(() => setLoading(false));
  }, []);

  const completedFor = (reviewerId: number) =>
    workload.find((w) => w.reviewer_id === reviewerId)?.completed_reviews ?? 0;

  const maxActive = Math.max(1, ...reviewers.map((r) => r.active_assignments));

  return (
    <div className="p-6 lg:p-10 max-w-5xl">
      <header className="mb-8">
        <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-2">Chief Editor</p>
        <h1 className="font-serif text-3xl text-navy-900">Reviewers</h1>
        <p className="text-navy-500 font-sans mt-2">
          Who is carrying how much, so assignments stay evenly spread.
        </p>
      </header>

      {loading ? (
        <div className="card p-10 text-center text-navy-400 font-sans text-sm">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading
        </div>
      ) : reviewers.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-10 h-10 mx-auto mb-3 text-navy-200" />
          <p className="font-sans text-navy-600">No reviewer accounts yet.</p>
          <p className="font-sans text-sm text-navy-400 mt-1">An administrator creates reviewer accounts from Users.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-parchment-50 border-b border-parchment-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Reviewer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Active Assignments</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Completed Reviews</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment-100">
                {reviewers.map((r) => (
                  <tr key={r.id} className="hover:bg-parchment-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-navy-900">{r.full_name}</p>
                      <p className="text-xs text-navy-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" /> {r.email}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-parchment-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${r.active_assignments > 2 ? 'bg-orange-500' : 'bg-navy-700'}`}
                            style={{ width: `${(r.active_assignments / maxActive) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-navy-700 tabular-figures">{r.active_assignments}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-navy-600 tabular-figures">{completedFor(r.id)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
