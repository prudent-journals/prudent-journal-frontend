'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Eye, Upload, MessageSquare, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { papersApi } from '@/lib/api';
import { Paper, Review } from '@/types';
import { getStatusColor, getStatusLabel, formatDate, getErrorMessage, cn, previewUrl } from '@/lib/utils';
import toast from 'react-hot-toast';
import { MANUSCRIPT_ACCEPT, MAX_DOCUMENT_SIZE } from '@/lib/uploads';

export default function DashboardPaperDetailPage() {
  const { id } = useParams();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [submittingRevision, setSubmittingRevision] = useState(false);

  const paperId = parseInt(id as string);

  const load = useCallback(async () => {
    const [pRes, rRes] = await Promise.all([
      papersApi.get(paperId),
      papersApi.getReviews(paperId),
    ]);
    setPaper(pRes.data);
    setReviews(rRes.data);
    setLoading(false);
  }, [paperId]);

  useEffect(() => { load(); }, [load]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (files) => files[0] && setRevisionFile(files[0]),
    accept: MANUSCRIPT_ACCEPT,
    maxFiles: 1,
    maxSize: MAX_DOCUMENT_SIZE,
  });

  const handleResubmit = async () => {
    if (!revisionFile) { toast.error('Please upload your revised paper'); return; }
    setSubmittingRevision(true);
    try {
      await papersApi.resubmit(paperId, revisionFile);
      toast.success('Revision submitted successfully');
      await load();
      setRevisionFile(null);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSubmittingRevision(false); }
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-navy-400" />
    </div>
  );
  if (!paper) return <div className="p-8 text-navy-500">Paper not found.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/dashboard/papers" className="inline-flex items-center gap-2 text-navy-500 hover:text-navy-900 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> My Papers
      </Link>

      <div className="flex items-start justify-between gap-4 mb-8">
        <h1 className="font-serif text-2xl text-navy-900 leading-snug">{paper.title}</h1>
        <span className={`badge text-sm px-3 py-1 flex-shrink-0 ${getStatusColor(paper.status)}`}>
          {getStatusLabel(paper.status)}
        </span>
      </div>

      {/* Status timeline */}
      <div className="card p-5 mb-6">
        <h2 className="font-sans text-sm font-semibold text-navy-500 uppercase tracking-wider mb-4">Submission Timeline</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(['submitted', 'under_review', 'reviewed', 'accepted', 'published'] as const).map((s, i, arr) => {
            const statuses = ['submitted', 'under_review', 'reviewed', 'revision_requested', 'resubmitted', 'accepted', 'published', 'rejected'];
            const currentIdx = statuses.indexOf(paper.status);
            const stepIdx = statuses.indexOf(s);
            const isActive = paper.status === s;
            const isDone = currentIdx > stepIdx && paper.status !== 'rejected';
            return (
              <div key={s} className="flex items-center gap-2 flex-shrink-0">
                <div className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                  isActive ? 'bg-navy-900 text-parchment-50' :
                  isDone ? 'bg-green-100 text-green-700' :
                  'bg-parchment-200 text-navy-400'
                )}>
                  {isDone && <CheckCircle className="w-3 h-3" />}
                  {isActive && <Clock className="w-3 h-3" />}
                  {getStatusLabel(s)}
                </div>
                {i < arr.length - 1 && <div className="w-4 h-px bg-parchment-300" />}
              </div>
            );
          })}
        </div>
        {paper.status === 'rejected' && (
          <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200">
            <p className="text-sm text-red-700 font-medium">Paper Not Accepted</p>
            {paper.rejection_reason && <p className="text-xs text-red-600 mt-1">{paper.rejection_reason}</p>}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Abstract */}
          <div className="card p-6">
            <h2 className="font-serif text-lg text-navy-900 mb-3">Abstract</h2>
            <p className="text-navy-600 font-sans text-sm leading-relaxed">
              {paper.abstract || <span className="italic text-navy-400">No abstract was provided.</span>}
            </p>
            {paper.keywords && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {paper.keywords.split(',').map(k => (
                  <span key={k} className="badge bg-parchment-200 text-navy-600">{k.trim()}</span>
                ))}
              </div>
            )}
          </div>

          {/* Reviewer feedback */}
          {reviews.length > 0 && (
            <div className="card p-6">
              <h2 className="font-serif text-lg text-navy-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gold-500" /> Reviewer Feedback
              </h2>
              {reviews.map(review => (
                <div key={review.id} className="bg-parchment-50 rounded-xl p-4 border border-parchment-200 mb-3">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`badge ${
                      review.decision === 'accept' ? 'bg-green-100 text-green-700' :
                      review.decision === 'reject' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      Decision: {review.decision.charAt(0).toUpperCase() + review.decision.slice(1)}
                    </span>
                    <span className="text-xs text-navy-400">{formatDate(review.created_at)}</span>
                  </div>
                  {(review.originality_score || review.methodology_score) && (
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[
                        ['Originality', review.originality_score],
                        ['Methodology', review.methodology_score],
                        ['Clarity', review.clarity_score],
                        ['Relevance', review.relevance_score],
                      ].map(([l, s]) => s && (
                        <div key={l as string} className="text-center bg-white rounded-lg p-2 border border-parchment-200">
                          <div className="font-semibold text-navy-900 text-sm">{s}/10</div>
                          <div className="text-xs text-navy-400">{l}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-navy-700 leading-relaxed">{review.content}</p>
                  {review.guide_url && (
                    <a href={review.guide_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-gold-700 hover:text-gold-800 font-medium mt-3">
                      <FileText className="w-3.5 h-3.5" /> Reviewer&apos;s guide/template
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* What to revise - the editor's own notes and guide, plus any
              reviewer guide files, so this is visible even if the email
              was missed or is being checked later. */}
          {paper.status === 'revision_requested' && (paper.admin_notes || paper.revision_guide_url) && (
            <div className="card p-6 border-2 border-orange-200 bg-orange-50/40">
              <h2 className="font-serif text-lg text-navy-900 mb-2 flex items-center gap-2">
                {paper.revision_type === 'major' ? 'Major' : 'Minor'} Revision Requested
              </h2>
              {paper.admin_notes && (
                <p className="text-sm text-navy-700 leading-relaxed whitespace-pre-wrap mb-3">{paper.admin_notes}</p>
              )}
              {paper.revision_guide_url && (
                <a href={paper.revision_guide_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-gold-700 hover:text-gold-800 font-medium">
                  <FileText className="w-4 h-4" /> Download Revision Guide
                </a>
              )}
            </div>
          )}

          {/* Revision upload */}
          {paper.status === 'revision_requested' && (
            <div className="card p-6 border-2 border-orange-200">
              <h2 className="font-serif text-lg text-navy-900 mb-2 flex items-center gap-2">
                <Upload className="w-5 h-5 text-orange-500" /> Submit Revision
              </h2>
              <p className="text-sm text-navy-500 mb-4">
                Address the reviewer's comments and upload your revised manuscript.
              </p>
              <div {...getRootProps()} className="border-2 border-dashed border-orange-300 rounded-xl p-6 text-center cursor-pointer hover:bg-orange-50 transition-colors mb-3">
                <input {...getInputProps()} />
                {revisionFile ? (
                  <p className="text-sm font-medium text-green-700">{revisionFile.name}</p>
                ) : (
                  <p className="text-sm text-navy-500">Drop your revised Word document here or click to browse</p>
                )}
              </div>
              <button
                onClick={handleResubmit}
                disabled={!revisionFile || submittingRevision}
                className="btn-gold w-full justify-center disabled:opacity-50"
              >
                {submittingRevision ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {submittingRevision ? 'Submitting...' : 'Submit Revision'}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="card p-5 space-y-3">
            <h3 className="font-sans text-sm font-semibold text-navy-500 uppercase tracking-wider">Files</h3>
            {paper.submission_file_url && (
              <a href={previewUrl(paper.submission_file_url, paper.title)} target="_blank" rel="noopener"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-parchment-200 hover:bg-parchment-50 text-sm text-navy-700 transition-colors">
                <FileText className="w-4 h-4 text-navy-500" /> Original Submission
                <Eye className="w-3.5 h-3.5 ml-auto text-navy-400" />
              </a>
            )}
            {paper.revised_file_url && (
              <a href={previewUrl(paper.revised_file_url, paper.title)} target="_blank" rel="noopener"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 text-sm text-green-700 transition-colors">
                <FileText className="w-4 h-4" /> Revised Version
                <Eye className="w-3.5 h-3.5 ml-auto" />
              </a>
            )}
            {paper.final_pdf_url && (
              <a href={previewUrl(paper.final_pdf_url, paper.title)} target="_blank" rel="noopener"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-gold-200 bg-gold-50 hover:bg-gold-100 text-sm text-gold-700 transition-colors">
                <FileText className="w-4 h-4" /> Published PDF
                <Eye className="w-3.5 h-3.5 ml-auto" />
              </a>
            )}
          </div>

          <div className="card p-5 space-y-3">
            <h3 className="font-sans text-sm font-semibold text-navy-500 uppercase tracking-wider">Details</h3>
            {[
              { label: 'Type', value: paper.paper_type },
              { label: 'Submitted', value: formatDate(paper.created_at) },
              { label: 'Last Updated', value: formatDate(paper.updated_at) },
              ...(paper.doi ? [{ label: 'DOI', value: paper.doi }] : []),
              ...(paper.volume ? [{ label: 'Volume', value: paper.volume }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-navy-400">{label}</span>
                <span className="text-navy-700 capitalize">{value}</span>
              </div>
            ))}
          </div>

          {paper.status === 'published' && (
            <Link href={`/publications/${paper.slug}`} className="btn-gold w-full justify-center text-sm">
              View Published Paper
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
