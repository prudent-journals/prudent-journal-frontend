'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, FileText, ChevronRight } from 'lucide-react';
import { papersApi } from '@/lib/api';
import { Paper, PaperStatus, ReviewerOption } from '@/types';
import { getStatusColor, getStatusLabel, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUSES: PaperStatus[] = [
  'submitted', 'under_review', 'reviewed', 'revision_requested',
  'resubmitted', 'accepted', 'rejected', 'published',
];

function ChiefEditorPapersContent() {
  const params = useSearchParams();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [reviewers, setReviewers] = useState<ReviewerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(params.get('status') || '');

  const fetchPapers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await papersApi.adminAll({ search: search || undefined, status: statusFilter || undefined, size: 50 });
      setPapers(data);
    } finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchPapers();
    papersApi.editorReviewers().then((r) => setReviewers(r.data)).catch(() => {});
  }, [fetchPapers]);

  const assignReviewer = async (paperId: number, reviewerId: number) => {
    try {
      await papersApi.adminUpdate(paperId, { assigned_reviewer_id: reviewerId });
      toast.success('Reviewer assigned');
      fetchPapers();
    } catch { toast.error('Failed to assign reviewer'); }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-navy-900 mb-1">Submissions</h1>
        <p className="text-navy-500 text-sm font-sans">Assign reviewers and track every paper through review.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input
            type="text"
            placeholder="Search papers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-base w-auto"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead className="bg-parchment-50 border-b border-parchment-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Paper</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Author</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Reviewer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Submitted</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-parchment-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-parchment-200 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : papers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-navy-400 font-sans">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  No submissions found.
                </td></tr>
              ) : papers.map((paper) => (
                <tr key={paper.id} className="hover:bg-parchment-50 transition-colors">
                  <td className="px-6 py-4 max-w-[260px]">
                    <p className="text-sm font-medium text-navy-900 truncate">{paper.title}</p>
                    <p className="text-xs text-navy-400 mt-0.5 capitalize">{paper.paper_type}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-navy-100 flex items-center justify-center text-xs">
                        {paper.author?.full_name.charAt(0) || '?'}
                      </div>
                      <span className="text-sm text-navy-700 truncate max-w-[120px]">
                        {paper.author?.full_name || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`badge ${getStatusColor(paper.status)}`}>{getStatusLabel(paper.status)}</span>
                  </td>
                  <td className="px-4 py-4">
                    {reviewers.length > 0 ? (
                      <select
                        value={paper.assigned_reviewer_id || ''}
                        onChange={(e) => e.target.value && assignReviewer(paper.id, parseInt(e.target.value))}
                        className="text-xs text-navy-600 bg-transparent border-b border-parchment-300 focus:outline-none"
                      >
                        <option value="">Assign...</option>
                        {reviewers.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.full_name} ({r.active_assignments} active)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-navy-400"> - </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-xs text-navy-400 whitespace-nowrap">
                    {formatDate(paper.created_at)}
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/chief-editor/papers/${paper.id}`} className="text-gold-600 hover:text-gold-700">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ChiefEditorPapersPage() {
  return (
    <Suspense fallback={null}>
      <ChiefEditorPapersContent />
    </Suspense>
  );
}
