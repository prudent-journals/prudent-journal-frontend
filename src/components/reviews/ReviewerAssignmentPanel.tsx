'use client';

import { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { papersApi } from '@/lib/api';
import { Paper } from '@/types';
import { getErrorMessage } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ReviewerLike {
  id: number;
  full_name: string;
  active_assignments?: number;
}

// Many-to-one: a paper can carry several independent reviewers at once, each
// filing their own guide. This panel adds/removes them one at a time rather
// than replacing a single assignment - used on both the admin and chief
// editor paper detail pages.
export default function ReviewerAssignmentPanel({
  paper, reviewers, onUpdate,
}: {
  paper: Paper;
  reviewers: ReviewerLike[];
  onUpdate: (paper: Paper) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [selected, setSelected] = useState('');

  const assignedIds = new Set(paper.assigned_reviewers.map((r) => r.id));
  const available = reviewers.filter((r) => !assignedIds.has(r.id));

  const add = async () => {
    if (!selected) return;
    setAdding(true);
    try {
      const { data } = await papersApi.assignReviewer(paper.id, parseInt(selected, 10));
      onUpdate(data);
      setSelected('');
      toast.success('Reviewer assigned');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setAdding(false); }
  };

  const remove = async (reviewerId: number) => {
    setRemovingId(reviewerId);
    try {
      const { data } = await papersApi.unassignReviewer(paper.id, reviewerId);
      onUpdate(data);
      toast.success('Reviewer removed');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setRemovingId(null); }
  };

  return (
    <div className="space-y-2">
      {paper.assigned_reviewers.length === 0 ? (
        <p className="text-xs text-navy-400 font-sans">No reviewers assigned yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {paper.assigned_reviewers.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-parchment-50 border border-parchment-200">
              <span className="text-sm text-navy-800 truncate">{r.full_name}</span>
              <button
                type="button"
                onClick={() => remove(r.id)}
                disabled={removingId === r.id}
                aria-label={`Remove ${r.full_name}`}
                className="p-1 rounded text-navy-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {removingId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
              </button>
            </li>
          ))}
        </ul>
      )}
      {available.length > 0 ? (
        <div className="flex gap-2 pt-1">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="input-base text-sm flex-1"
          >
            <option value="">Add a reviewer...</option>
            {available.map((r) => (
              <option key={r.id} value={r.id}>
                {r.full_name}{typeof r.active_assignments === 'number' ? ` (${r.active_assignments} active)` : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={add}
            disabled={!selected || adding}
            aria-label="Add reviewer"
            className="btn-outline py-2 px-3 text-sm disabled:opacity-50 flex-shrink-0"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      ) : reviewers.length > 0 ? (
        <p className="text-xs text-navy-400 font-sans pt-1">Every available reviewer is already assigned.</p>
      ) : null}
    </div>
  );
}
