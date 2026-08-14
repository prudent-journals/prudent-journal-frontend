'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, FileText, CheckCircle2, Send, Upload, Loader2 } from 'lucide-react';
import { papersApi } from '@/lib/api';
import { Paper, Review } from '@/types';
import { formatDate, getStatusLabel, getStatusColor, getErrorMessage, previewUrl } from '@/lib/utils';
import { MANUSCRIPT_ACCEPT_ATTR } from '@/lib/uploads';

const schema = z.object({
  decision: z.enum(['accept', 'revision', 'reject'], {
    required_error: 'Select a recommendation',
  }),
  content: z.string().min(40, 'Please give the author at least a couple of sentences'),
  originality_score: z.coerce.number().min(1).max(10),
  methodology_score: z.coerce.number().min(1).max(10),
  clarity_score: z.coerce.number().min(1).max(10),
  relevance_score: z.coerce.number().min(1).max(10),
});

type FormValues = z.infer<typeof schema>;

const CRITERIA = [
  ['originality_score', 'Originality'],
  ['methodology_score', 'Methodology'],
  ['clarity_score', 'Clarity'],
  ['relevance_score', 'Relevance'],
] as const;

export default function ReviewPaperPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);

  const [paper, setPaper] = useState<Paper | null>(null);
  const [existing, setExisting] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalFile, setFinalFile] = useState<File | null>(null);
  const [uploadingFinal, setUploadingFinal] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        originality_score: 7, methodology_score: 7,
        clarity_score: 7, relevance_score: 7,
      },
    });

  const decision = watch('decision');

  useEffect(() => {
    Promise.allSettled([papersApi.get(id), papersApi.myReviews()])
      .then(([p, r]) => {
        if (p.status === 'fulfilled') setPaper(p.value.data);
        if (r.status === 'fulfilled') {
          const mine = (r.value.data as Review[]).find((x) => x.paper_id === id);
          if (mine) setExisting(mine);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const uploadFinal = async () => {
    if (!finalFile) return;
    setUploadingFinal(true);
    try {
      const { data } = await papersApi.replaceDocument(id, finalFile);
      setPaper(data);
      setFinalFile(null);
      toast.success('Final document uploaded. It is now the current version.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploadingFinal(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await papersApi.submitReview(id, values);
      toast.success('Review submitted. Thank you.');
      router.push('/reviewer/queue');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) {
    return <div className="p-10 text-navy-400 font-sans text-sm">Loading</div>;
  }

  if (!paper) {
    return (
      <div className="p-10">
        <p className="font-sans text-navy-600">That paper is not available to you.</p>
        <Link href="/reviewer/queue" className="btn-outline mt-4 inline-flex">Back to queue</Link>
      </div>
    );
  }

  const fileUrl = paper.revised_file_url || paper.submission_file_url;

  return (
    <div className="p-6 lg:p-10 max-w-4xl">
      <Link href="/reviewer/queue" className="inline-flex items-center gap-2 text-sm text-navy-500 hover:text-navy-800 font-sans mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to queue
      </Link>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={`badge ${getStatusColor(paper.status)}`}>{getStatusLabel(paper.status)}</span>
        <span className="badge bg-parchment-200 text-navy-600 capitalize">{paper.paper_type}</span>
      </div>

      <h1 className="font-serif text-2xl lg:text-3xl text-navy-900 leading-snug mb-3">{paper.title}</h1>
      <p className="text-sm text-navy-400 font-sans mb-8">Submitted {formatDate(paper.created_at)}</p>

      <section className="card p-6 mb-6">
        <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-navy-400 mb-3">Abstract</h2>
        <p className="font-sans text-navy-700 leading-relaxed">
          {paper.abstract || <span className="italic text-navy-400">No abstract was provided.</span>}
        </p>
        {paper.keywords && (
          <div className="mt-4 pt-4 border-t border-parchment-200">
            <p className="font-sans text-xs text-navy-400 mb-2">Keywords</p>
            <div className="flex flex-wrap gap-2">
              {paper.keywords.split(',').map((k) => (
                <span key={k} className="badge bg-parchment-100 text-navy-600">{k.trim()}</span>
              ))}
            </div>
          </div>
        )}
      </section>

      {fileUrl && (
        <a href={previewUrl(fileUrl, paper.title)} target="_blank" rel="noopener noreferrer"
           className="card p-5 flex items-center gap-4 mb-4 group hover:border-gold-400 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-navy-900 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-gold-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-sans font-medium text-navy-900 text-sm">
              {paper.revised_file_url ? 'Current document (latest version)' : 'Submitted manuscript'}
            </p>
            <p className="font-sans text-xs text-navy-400">Open the manuscript to read the full paper</p>
          </div>
        </a>
      )}

      {/* Reviewer uploads the final agreed document. Revisions are handled
          offline by email; this replaces the working document with the final one. */}
      <div className="card p-5 mb-8 border-gold-200">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gold-50 flex items-center justify-center flex-shrink-0">
            <Upload className="w-4.5 h-4.5 text-gold-700" />
          </div>
          <div>
            <h3 className="font-serif text-navy-900">Upload the final document</h3>
            <p className="font-sans text-xs text-navy-500 leading-relaxed mt-0.5">
              Once you and the author have agreed the final version offline, upload it here.
              It replaces the working document and becomes what gets published.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept={MANUSCRIPT_ACCEPT_ATTR}
            onChange={(e) => setFinalFile(e.target.files?.[0] || null)}
            className="font-sans text-sm text-navy-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-navy-900 file:text-parchment-50 file:text-sm file:cursor-pointer"
          />
          <button
            onClick={uploadFinal}
            disabled={!finalFile || uploadingFinal}
            className="btn-primary py-2 disabled:opacity-50"
          >
            {uploadingFinal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploadingFinal ? 'Uploading' : 'Replace document'}
          </button>
        </div>
      </div>

      {existing ? (
        <section className="card p-6 border-green-200 bg-green-50/40">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h2 className="font-serif text-lg text-navy-900">You have reviewed this paper</h2>
          </div>
          <p className="font-sans text-sm text-navy-500 mb-4">
            Submitted {formatDate(existing.created_at)}. Recommendation:{' '}
            <span className="font-semibold text-navy-800">
              {existing.decision === 'revision' ? 'revision requested' : existing.decision}
            </span>
            .
          </p>
          <p className="font-sans text-navy-700 leading-relaxed whitespace-pre-wrap">{existing.content}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-green-200">
            {CRITERIA.map(([key, label]) => (
              <div key={key}>
                <p className="font-sans text-xs text-navy-400">{label}</p>
                <p className="font-display text-xl text-navy-900 tabular-figures">
                  {(existing[key] as number | undefined) ?? '-'}<span className="text-sm text-navy-400">/10</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-6">
          <h2 className="font-serif text-xl text-navy-900">Submit your review</h2>

          <div>
            <label className="block font-sans text-sm font-medium text-navy-800 mb-2">Recommendation</label>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { value: 'accept', label: 'Accept', desc: 'Ready to publish' },
                { value: 'revision', label: 'Revision', desc: 'Needs changes' },
                { value: 'reject', label: 'Reject', desc: 'Not suitable' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue('decision', opt.value as FormValues['decision'], { shouldValidate: true })}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    decision === opt.value
                      ? 'border-gold-500 bg-gold-50'
                      : 'border-parchment-300 hover:border-navy-300'
                  }`}
                >
                  <p className="font-sans font-semibold text-navy-900 text-sm">{opt.label}</p>
                  <p className="font-sans text-xs text-navy-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
            {errors.decision && <p className="text-red-600 text-sm font-sans mt-2">{errors.decision.message}</p>}
          </div>

          <div>
            <label className="block font-sans text-sm font-medium text-navy-800 mb-2">Scores</label>
            <div className="grid sm:grid-cols-2 gap-4">
              {CRITERIA.map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="font-sans text-sm text-navy-600 w-28 flex-shrink-0">{label}</span>
                  <input type="range" min={1} max={10} {...register(key)} className="flex-1 accent-gold-600" />
                  <span className="font-mono text-sm text-navy-800 w-8 text-right">{watch(key)}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-sans text-sm font-medium text-navy-800 mb-2">
              Comments for the author
            </label>
            <textarea
              {...register('content')}
              rows={9}
              placeholder="Set out your assessment: what works, what needs to change, and why."
              className="input-base resize-y"
            />
            {errors.content && <p className="text-red-600 text-sm font-sans mt-1">{errors.content.message}</p>}
            <p className="font-sans text-xs text-navy-400 mt-2">
              An editor decides whether these comments are shared with the author.
            </p>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary px-8 py-3 disabled:opacity-60">
            {isSubmitting ? 'Submitting' : <>Submit Review <Send className="w-4 h-4" /></>}
          </button>
        </form>
      )}
    </div>
  );
}
