'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Eye, CheckCircle, XCircle, RefreshCw, Share2, Loader2 } from 'lucide-react';
import { papersApi } from '@/lib/api';
import { Paper, Review, ReviewerOption } from '@/types';
import { getStatusColor, getStatusLabel, formatDate, getErrorMessage } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ChiefEditorPaperDetailPage() {
  const params = useParams();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewers, setReviewers] = useState<ReviewerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [rejection, setRejection] = useState('');
  const [deciding, setDeciding] = useState(false);

  const id = parseInt(params.id as string);

  useEffect(() => {
    Promise.all([
      papersApi.get(id),
      papersApi.getReviews(id),
      papersApi.editorReviewers(),
    ]).then(([p, r, u]) => {
      setPaper(p.data);
      setReviews(r.data);
      setReviewers(u.data);
      setNotes(p.data.admin_notes || '');
      setRejection(p.data.rejection_reason || '');
    }).catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDecision = async (status: string, extra?: object) => {
    setDeciding(true);
    try {
      const { data } = await papersApi.adminUpdate(id, { status, admin_notes: notes, rejection_reason: rejection, ...extra });
      setPaper(data);
      toast.success('Paper updated');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeciding(false); }
  };

  const handleAssignReviewer = async (reviewerId: string) => {
    try {
      const { data } = await papersApi.adminUpdate(id, { assigned_reviewer_id: parseInt(reviewerId) });
      setPaper(data);
      toast.success('Reviewer assigned and notified');
    } catch { toast.error('Failed to assign reviewer'); }
  };

  const handleShareReview = async (reviewId: number) => {
    try {
      await papersApi.shareReview(id, reviewId);
      toast.success('Review shared with author');
      const { data } = await papersApi.getReviews(id);
      setReviews(data);
    } catch { toast.error('Failed to share review'); }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin text-navy-400 mx-auto" /></div>;
  if (!paper) return <div className="p-8 text-center text-navy-500">Paper not found.</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link href="/chief-editor/papers" className="inline-flex items-center gap-2 text-navy-500 hover:text-navy-900 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Submissions
      </Link>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl text-navy-900 mb-2">{paper.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-navy-500">
            <span>by {paper.author?.full_name}</span>
            <span>&middot;</span>
            <span className="capitalize">{paper.paper_type} paper</span>
            <span>&middot;</span>
            <span>Submitted {formatDate(paper.created_at)}</span>
          </div>
        </div>
        <span className={`badge text-sm px-3 py-1 flex-shrink-0 ${getStatusColor(paper.status)}`}>
          {getStatusLabel(paper.status)}
        </span>
      </div>

      {paper.status === 'accepted' && (
        <div className="card p-4 mb-6 border-2 border-gold-200 bg-gold-50/50 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-gold-600 flex-shrink-0" />
          <p className="text-sm text-navy-700 font-sans">
            This paper is authorized for publication. An administrator now uploads the typeset PDF and publishes it.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="font-serif text-lg text-navy-900 mb-3">Abstract</h2>
            <p className="text-navy-600 font-sans text-sm leading-relaxed">{paper.abstract}</p>
            {paper.keywords && (
              <div className="mt-4 flex flex-wrap gap-2">
                {paper.keywords.split(',').map((k) => (
                  <span key={k} className="badge bg-parchment-200 text-navy-600">{k.trim()}</span>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-serif text-lg text-navy-900 mb-4">Manuscript Files</h2>
            <div className="space-y-3">
              {paper.submission_file_url && (
                <a href={paper.submission_file_url} target="_blank" rel="noopener"
                  className="flex items-center gap-3 p-3 rounded-xl border border-parchment-200 hover:bg-parchment-50 transition-colors">
                  <FileText className="w-5 h-5 text-navy-600" />
                  <span className="text-sm text-navy-700">Original Submission</span>
                  <Eye className="w-4 h-4 text-navy-400 ml-auto" />
                </a>
              )}
              {paper.revised_file_url && (
                <a href={paper.revised_file_url} target="_blank" rel="noopener"
                  className="flex items-center gap-3 p-3 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 transition-colors">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700">Final Version (current)</span>
                  <Eye className="w-4 h-4 text-green-500 ml-auto" />
                </a>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-serif text-lg text-navy-900 mb-4">
              Reviewer Feedback ({reviews.length})
            </h2>
            {reviews.length === 0 ? (
              <p className="text-navy-400 text-sm font-sans">No reviews submitted yet.</p>
            ) : reviews.map((review) => (
              <div key={review.id} className="border border-parchment-200 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-navy-800">{review.reviewer?.full_name}</span>
                    <span className={`badge ${
                      review.decision === 'accept' ? 'bg-green-100 text-green-700' :
                      review.decision === 'reject' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {review.decision}
                    </span>
                  </div>
                  {!review.is_visible_to_author && (
                    <button onClick={() => handleShareReview(review.id)}
                      className="flex items-center gap-1.5 text-xs text-gold-600 hover:text-gold-700 font-medium">
                      <Share2 className="w-3.5 h-3.5" /> Share with Author
                    </button>
                  )}
                  {review.is_visible_to_author && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Shared
                    </span>
                  )}
                </div>

                {(review.originality_score || review.methodology_score) && (
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[
                      ['Originality', review.originality_score],
                      ['Methodology', review.methodology_score],
                      ['Clarity', review.clarity_score],
                      ['Relevance', review.relevance_score],
                    ].map(([label, score]) => score && (
                      <div key={label as string} className="text-center bg-parchment-50 rounded-lg p-2">
                        <div className="font-semibold text-navy-900">{score}/10</div>
                        <div className="text-xs text-navy-400">{label}</div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-sm text-navy-600 leading-relaxed">{review.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-serif text-base text-navy-900 mb-3">Assign Reviewer</h3>
            <select
              value={paper.assigned_reviewer_id || ''}
              onChange={(e) => handleAssignReviewer(e.target.value)}
              className="input-base text-sm"
            >
              <option value="">Select reviewer...</option>
              {reviewers.map((r) => (
                <option key={r.id} value={r.id}>{r.full_name} ({r.active_assignments} active)</option>
              ))}
            </select>
            {paper.assigned_reviewer_id && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Reviewer assigned
              </p>
            )}
          </div>

          <div className="card p-5 space-y-3">
            <h3 className="font-serif text-base text-navy-900 mb-3">Editorial Decision</h3>

            <div>
              <label className="text-xs text-navy-500 mb-1 block">Editorial Notes (internal)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                rows={3} className="input-base text-sm resize-none" placeholder="Internal notes..." />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleDecision('accepted')} disabled={deciding}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-green-100 text-green-700 text-sm font-medium hover:bg-green-200 transition-colors disabled:opacity-50">
                <CheckCircle className="w-4 h-4" /> Accept
              </button>
              <button onClick={() => handleDecision('revision_requested')} disabled={deciding}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-orange-100 text-orange-700 text-sm font-medium hover:bg-orange-200 transition-colors disabled:opacity-50">
                <RefreshCw className="w-4 h-4" /> Request Revision
              </button>
            </div>

            <div>
              <label className="text-xs text-navy-500 mb-1 block">Rejection Reason</label>
              <textarea value={rejection} onChange={(e) => setRejection(e.target.value)}
                rows={2} className="input-base text-sm resize-none" placeholder="Reason for rejection..." />
            </div>
            <button onClick={() => handleDecision('rejected')} disabled={deciding}
              className="w-full flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50">
              <XCircle className="w-4 h-4" /> Reject Paper
            </button>

            <p className="text-xs text-navy-400 font-sans pt-1">
              Accepting authorizes the paper for publication. An administrator publishes it from here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
