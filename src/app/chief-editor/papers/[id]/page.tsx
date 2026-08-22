'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Eye, CheckCircle, XCircle, RefreshCw, Share2, Loader2, Upload, X } from 'lucide-react';
import { papersApi } from '@/lib/api';
import { Paper, Review, ReviewerOption } from '@/types';
import { getStatusColor, getStatusLabel, formatDate, getErrorMessage, previewUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ChiefEditorPaperDetailPage() {
  const params = useParams();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewers, setReviewers] = useState<ReviewerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [rejection, setRejection] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
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

  const handleRequestRevision = async (type: 'minor' | 'major') => {
    setDeciding(true);
    try {
      const { data } = await papersApi.requestRevision(id, type, revisionNotes, revisionFile);
      setPaper(data);
      setRevisionFile(null);
      toast.success('Revision requested - the author has been emailed');
      const { data: freshReviews } = await papersApi.getReviews(id);
      setReviews(freshReviews);
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
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={`badge text-sm px-3 py-1 ${getStatusColor(paper.status)}`}>
            {getStatusLabel(paper.status)}
          </span>
          {paper.status === 'revision_requested' && paper.revision_type && (
            <span className="badge text-xs bg-orange-50 text-orange-700 capitalize">
              {paper.revision_type} revision
            </span>
          )}
        </div>
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
            <p className="text-navy-600 font-sans text-sm leading-relaxed">
              {paper.abstract || <span className="italic text-navy-400">No abstract was provided.</span>}
            </p>
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
                <a href={previewUrl(paper.submission_file_url, paper.title)} target="_blank" rel="noopener"
                  className="flex items-center gap-3 p-3 rounded-xl border border-parchment-200 hover:bg-parchment-50 transition-colors">
                  <FileText className="w-5 h-5 text-navy-600" />
                  <span className="text-sm text-navy-700">Original Submission</span>
                  <Eye className="w-4 h-4 text-navy-400 ml-auto" />
                </a>
              )}
              {paper.revised_file_url && (
                <a href={previewUrl(paper.revised_file_url, paper.title)} target="_blank" rel="noopener"
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
                {review.guide_url && (
                  <a href={review.guide_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-gold-700 hover:text-gold-800 font-medium mt-3">
                    <FileText className="w-3.5 h-3.5" /> Reviewer&apos;s guide/template
                  </a>
                )}
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

          <div className="card p-5 space-y-4">
            <h3 className="font-serif text-base text-navy-900">Editorial Decision</h3>

            {/* Straight accept - no revision needed */}
            <div className="space-y-2">
              <label className="text-xs text-navy-500 block">Editorial Notes (internal)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                rows={2} className="input-base text-sm resize-none" placeholder="Internal notes, not sent to the author..." />
              <button onClick={() => handleDecision('accepted')} disabled={deciding}
                className="w-full flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-green-100 text-green-700 text-sm font-medium hover:bg-green-200 transition-colors disabled:opacity-50">
                <CheckCircle className="w-4 h-4" /> Accept
              </button>
            </div>

            {/* Accept pending revision - minor or major */}
            <div className="space-y-2 pt-3 border-t border-parchment-200">
              <label className="text-xs text-navy-500 block">
                Notes for the Author <span className="text-navy-400 font-normal">(sent in the revision email)</span>
              </label>
              <textarea value={revisionNotes} onChange={(e) => setRevisionNotes(e.target.value)}
                rows={3} className="input-base text-sm resize-none" placeholder="What the author needs to address..." />

              <label className="text-xs text-navy-500 block pt-1">
                Revision Guide <span className="text-navy-400 font-normal">(optional, PDF or Word)</span>
              </label>
              {revisionFile ? (
                <div className="flex items-center gap-2 p-2 rounded-lg border border-parchment-200 bg-parchment-50">
                  <FileText className="w-4 h-4 text-navy-500 flex-shrink-0" />
                  <span className="text-xs text-navy-700 truncate flex-1">{revisionFile.name}</span>
                  <button onClick={() => setRevisionFile(null)} aria-label="Remove file" className="p-1 text-navy-400 hover:text-navy-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-dashed border-parchment-300 text-xs text-navy-500 hover:border-gold-400 hover:text-gold-700 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" /> Attach a guide document
                  <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden" onChange={(e) => setRevisionFile(e.target.files?.[0] || null)} />
                </label>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button onClick={() => handleRequestRevision('minor')} disabled={deciding}
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-orange-100 text-orange-700 text-sm font-medium hover:bg-orange-200 transition-colors disabled:opacity-50">
                  <RefreshCw className="w-4 h-4" /> Minor Revision
                </button>
                <button onClick={() => handleRequestRevision('major')} disabled={deciding}
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-orange-200 text-orange-800 text-sm font-medium hover:bg-orange-300 transition-colors disabled:opacity-50">
                  <RefreshCw className="w-4 h-4" /> Major Revision
                </button>
              </div>
              <p className="text-xs text-navy-400 font-sans">
                Any reviews already submitted are shared with the author automatically along with this.
              </p>
            </div>

            {/* Reject */}
            <div className="space-y-2 pt-3 border-t border-parchment-200">
              <label className="text-xs text-navy-500 block">Rejection Reason</label>
              <textarea value={rejection} onChange={(e) => setRejection(e.target.value)}
                rows={2} className="input-base text-sm resize-none" placeholder="Reason for rejection..." />
              <button onClick={() => handleDecision('rejected')} disabled={deciding}
                className="w-full flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50">
                <XCircle className="w-4 h-4" /> Reject Paper
              </button>
            </div>

            <p className="text-xs text-navy-400 font-sans pt-1 border-t border-parchment-200">
              Accepting authorizes the paper for publication. An administrator publishes it from here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
