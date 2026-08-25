'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, FileText, CheckCircle2, Send } from 'lucide-react';
import { papersApi } from '@/lib/api';
import { Paper, Review, ReviewGuide, ObjectiveCriterionResult, SubjectiveQuestionResult } from '@/types';
import { formatDate, getStatusLabel, getStatusColor, getErrorMessage, previewUrl } from '@/lib/utils';
import { OBJECTIVE_CRITERIA, RATING_SCALE, SUBJECTIVE_QUESTIONS, OVERALL_MARKS_GUIDE } from '@/lib/review-guide';

const schema = z.object({
  decision: z.enum(['accept', 'revision', 'reject'], {
    required_error: 'Select a recommendation',
  }),
  content: z.string().min(40, 'Please give at least a couple of sentences'),
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

// Correction/Feedback is mandatory whenever a criterion flags a problem -
// a low rating, a "no" answer, or (for the ethics question, inverted) a
// "yes". This is where the reviewer lists the pages and sections that have
// issues and says what they are, as part of the guide/submission back to
// the chief editor - the reviewer never mails or interacts with the author.
function objectiveNeedsCorrection(rating: number | null) {
  return rating !== null && rating <= 2;
}
function subjectiveNeedsCorrection(key: string, answer: boolean | null) {
  if (answer === null) return false;
  return key === 'ethical_issues' ? answer === true : answer === false;
}

export default function ReviewPaperPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);

  const [paper, setPaper] = useState<Paper | null>(null);
  const [existing, setExisting] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // The reviewer's guide - the journal's standard peer-review form - filled
  // in directly rather than uploaded as a file.
  const [aiUsed, setAiUsed] = useState<boolean | null>(null);
  const [importanceComment, setImportanceComment] = useState('');
  const [importanceCorrection, setImportanceCorrection] = useState('');
  const [objectiveRows, setObjectiveRows] = useState<ObjectiveCriterionResult[]>(
    OBJECTIVE_CRITERIA.map(([key, label]) => ({ key, label, rating: null, correction_feedback: '' }))
  );
  const [subjectiveRows, setSubjectiveRows] = useState<SubjectiveQuestionResult[]>(
    SUBJECTIVE_QUESTIONS.map(([key, label]) => ({ key, label, answer: null, correction_feedback: '' }))
  );
  const [confidentialComments, setConfidentialComments] = useState('');
  const [competingInterest, setCompetingInterest] = useState('');
  const [overallMarks, setOverallMarks] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
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

  const setObjectiveField = (key: string, patch: Partial<ObjectiveCriterionResult>) => {
    setObjectiveRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };
  const setSubjectiveField = (key: string, patch: Partial<SubjectiveQuestionResult>) => {
    setSubjectiveRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const onSubmit = async (values: FormValues) => {
    if (aiUsed === null) {
      toast.error('Declare whether you used AI during this review');
      return;
    }
    if (!importanceComment.trim()) {
      toast.error("Write a few sentences on the manuscript's importance");
      return;
    }
    const missingObjective = objectiveRows.find(
      (r) => objectiveNeedsCorrection(r.rating ?? null) && !r.correction_feedback?.trim()
    );
    if (missingObjective) {
      toast.error(`Correction/Feedback is required for "${missingObjective.label}" - it was rated 2 or below`);
      return;
    }
    const missingSubjective = subjectiveRows.find(
      (r) => subjectiveNeedsCorrection(r.key, r.answer ?? null) && !r.correction_feedback?.trim()
    );
    if (missingSubjective) {
      toast.error(`Correction/Feedback is required for "${missingSubjective.label}"`);
      return;
    }
    if (!competingInterest.trim()) {
      toast.error('Declare your competing interest, even if you have none to declare');
      return;
    }
    const marks = overallMarks === '' ? null : Number(overallMarks);
    if (marks === null || Number.isNaN(marks) || marks < 0 || marks > 10) {
      toast.error('Give an overall mark between 0 and 10');
      return;
    }

    const guide: ReviewGuide = {
      ai_used: aiUsed,
      importance_comment: importanceComment,
      importance_correction_feedback: importanceCorrection || null,
      objective_evaluation: objectiveRows.map((r) => ({
        key: r.key, label: r.label, rating: r.rating ?? null,
        correction_feedback: r.correction_feedback?.trim() || null,
      })),
      subjective_evaluation: subjectiveRows.map((r) => ({
        key: r.key, label: r.label, answer: r.answer ?? null,
        correction_feedback: r.correction_feedback?.trim() || null,
      })),
      confidential_comments: confidentialComments || null,
      competing_interest: competingInterest,
      overall_marks: marks,
    };

    setSubmitting(true);
    try {
      await papersApi.submitReview(id, { ...values, guide });
      toast.success('Review submitted. Thank you.');
      router.push('/reviewer/queue');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
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
           className="card p-5 flex items-center gap-4 mb-8 group hover:border-gold-400 transition-colors">
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
          {existing.guide && (
            <div className="mt-5 pt-5 border-t border-green-200 space-y-4">
              <h3 className="font-serif text-navy-900">Your submitted guide</h3>
              {existing.guide.importance_comment && (
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-navy-400 mb-1">
                    Importance of the manuscript
                  </p>
                  <p className="font-sans text-sm text-navy-700 whitespace-pre-wrap">{existing.guide.importance_comment}</p>
                  {existing.guide.importance_correction_feedback && (
                    <p className="font-sans text-sm text-navy-600 mt-1">
                      <span className="font-medium">Correction/Feedback:</span> {existing.guide.importance_correction_feedback}
                    </p>
                  )}
                </div>
              )}
              {existing.guide.objective_evaluation.filter((r) => r.rating || r.correction_feedback).length > 0 && (
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-navy-400 mb-2">
                    Objective evaluation
                  </p>
                  <div className="space-y-2">
                    {existing.guide.objective_evaluation.filter((r) => r.rating || r.correction_feedback).map((r) => (
                      <div key={r.key} className="text-sm font-sans">
                        <span className="text-navy-700">{r.label}</span>{' '}
                        {r.rating && <span className="text-navy-400">({r.rating}/5)</span>}
                        {r.correction_feedback && (
                          <p className="text-navy-600 mt-0.5"><span className="font-medium">Correction/Feedback:</span> {r.correction_feedback}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {existing.guide.subjective_evaluation.filter((r) => r.correction_feedback).length > 0 && (
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-navy-400 mb-2">
                    Subjective evaluation
                  </p>
                  <div className="space-y-2">
                    {existing.guide.subjective_evaluation.filter((r) => r.correction_feedback).map((r) => (
                      <div key={r.key} className="text-sm font-sans">
                        <span className="text-navy-700">{r.label}</span>{' '}
                        <span className="text-navy-400">({r.answer ? 'Yes' : 'No'})</span>
                        <p className="text-navy-600 mt-0.5"><span className="font-medium">Correction/Feedback:</span> {r.correction_feedback}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {typeof existing.guide.overall_marks === 'number' && (
                <p className="font-sans text-sm text-navy-700">
                  <span className="font-medium">Overall marks:</span> {existing.guide.overall_marks}/10
                </p>
              )}
            </div>
          )}
        </section>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="card p-6 space-y-6">
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
                Comments for the chief editor
              </label>
              <textarea
                {...register('content')}
                rows={9}
                placeholder="Set out your assessment: what works, what needs to change, and why."
                className="input-base resize-y"
              />
              {errors.content && <p className="text-red-600 text-sm font-sans mt-1">{errors.content.message}</p>}
              <p className="font-sans text-xs text-navy-400 mt-2">
                This, together with the guide below, is your submission back to the chief editor. You do not
                need to interact with or email the author directly - the chief editor decides what is shared
                with them and when.
              </p>
            </div>
          </div>

          <div className="card p-6 space-y-6">
            <div>
              <h2 className="font-serif text-xl text-navy-900">Reviewer&apos;s Guide</h2>
              <p className="font-sans text-sm text-navy-500 mt-1">
                The journal&apos;s standard peer-review form, filled in directly. This is needed on every
                paper and stays with the chief editor - it is only forwarded to the author, with your
                identity never included, if the paper is rejected or sent back for revision.
              </p>
            </div>

            <div>
              <label className="block font-sans text-sm font-medium text-navy-800 mb-2">
                Have you used AI during the peer review of this manuscript?
              </label>
              <div className="flex gap-3">
                {[['No', false], ['Yes', true]].map(([label, val]) => (
                  <button
                    key={label as string}
                    type="button"
                    onClick={() => setAiUsed(val as boolean)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                      aiUsed === val ? 'border-gold-500 bg-gold-50 text-navy-900' : 'border-parchment-300 text-navy-600 hover:border-navy-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="font-sans text-xs text-navy-400 mt-2">
                AI-generated review comments are not accepted - anything found to be AI-generated is rejected
                and not used in the peer review process.
              </p>
            </div>

            <div className="pt-2 border-t border-parchment-200">
              <h3 className="font-serif text-base text-navy-900 mb-1">Part 1 - Importance of the Manuscript</h3>
              <label className="block font-sans text-sm font-medium text-navy-800 mb-1.5 mt-3">
                Comments of the Reviewer
              </label>
              <textarea
                value={importanceComment}
                onChange={(e) => setImportanceComment(e.target.value)}
                rows={3}
                placeholder="A few sentences on the importance of this manuscript for the scientific community."
                className="input-base resize-y"
              />
              <label className="block font-sans text-sm font-medium text-navy-800 mb-1.5 mt-3">
                Correction/Feedback
              </label>
              <textarea
                value={importanceCorrection}
                onChange={(e) => setImportanceCorrection(e.target.value)}
                rows={2}
                placeholder="Pages/sections with issues here, and what needs to change, if any."
                className="input-base resize-y"
              />
            </div>

            <div className="pt-2 border-t border-parchment-200">
              <h3 className="font-serif text-base text-navy-900 mb-1">Part 2.1 - Objective Evaluation</h3>
              <p className="font-sans text-xs text-navy-400 mb-3">
                Rating scale: 5 = Excellent, 4 = Good, 3 = Satisfactory, 2 = Needs Improvement, 1 = Poor.
                Correction/Feedback is required for a rating of 2 or 1.
              </p>
              <div className="space-y-4">
                {objectiveRows.map((row) => (
                  <div key={row.key} className="p-4 rounded-xl border border-parchment-200">
                    <p className="font-sans text-sm text-navy-800 mb-2">{row.label}</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {RATING_SCALE.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setObjectiveField(row.key, { rating: opt.value })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                            row.rating === opt.value
                              ? 'border-gold-500 bg-gold-50 text-navy-900'
                              : 'border-parchment-300 text-navy-500 hover:border-navy-300'
                          }`}
                        >
                          {opt.value}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setObjectiveField(row.key, { rating: null })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                          row.rating === null ? 'border-gold-500 bg-gold-50 text-navy-900' : 'border-parchment-300 text-navy-500 hover:border-navy-300'
                        }`}
                      >
                        N/A
                      </button>
                    </div>
                    {objectiveNeedsCorrection(row.rating ?? null) && (
                      <textarea
                        value={row.correction_feedback || ''}
                        onChange={(e) => setObjectiveField(row.key, { correction_feedback: e.target.value })}
                        rows={2}
                        placeholder="Correction/Feedback (required for this rating) - which pages/sections, and what to fix."
                        className="input-base resize-y text-sm mt-1"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-parchment-200">
              <h3 className="font-serif text-base text-navy-900 mb-3">Part 2.2 - Subjective Evaluation</h3>
              <div className="space-y-4">
                {subjectiveRows.map((row) => (
                  <div key={row.key} className="p-4 rounded-xl border border-parchment-200">
                    <p className="font-sans text-sm text-navy-800 mb-2">{row.label}</p>
                    <div className="flex gap-2 mb-2">
                      {[['No', false], ['Yes', true]].map(([label, val]) => (
                        <button
                          key={label as string}
                          type="button"
                          onClick={() => setSubjectiveField(row.key, { answer: val as boolean })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            row.answer === val ? 'border-gold-500 bg-gold-50 text-navy-900' : 'border-parchment-300 text-navy-500 hover:border-navy-300'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {subjectiveNeedsCorrection(row.key, row.answer ?? null) && (
                      <textarea
                        value={row.correction_feedback || ''}
                        onChange={(e) => setSubjectiveField(row.key, { correction_feedback: e.target.value })}
                        rows={2}
                        placeholder="Correction/Feedback (required) - which pages/sections, and what to fix."
                        className="input-base resize-y text-sm mt-1"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-parchment-200">
              <h3 className="font-serif text-base text-navy-900 mb-1">
                Part 3 - Confidential Comments to the Editor <span className="text-navy-400 font-normal">(if any)</span>
              </h3>
              <textarea
                value={confidentialComments}
                onChange={(e) => setConfidentialComments(e.target.value)}
                rows={3}
                placeholder="For the chief editor only - never shown to the author."
                className="input-base resize-y"
              />
            </div>

            <div className="pt-2 border-t border-parchment-200">
              <h3 className="font-serif text-base text-navy-900 mb-1">Part 4 - Declaration of Competing Interest</h3>
              <textarea
                value={competingInterest}
                onChange={(e) => setCompetingInterest(e.target.value)}
                rows={2}
                placeholder='If nothing to declare, write "I declare that I have no competing interest as a reviewer."'
                className="input-base resize-y"
              />
            </div>

            <div className="pt-2 border-t border-parchment-200">
              <h3 className="font-serif text-base text-navy-900 mb-1">Part 5 - Overall Marks</h3>
              <p className="font-sans text-xs text-navy-400 mb-2">{OVERALL_MARKS_GUIDE}</p>
              <input
                type="number"
                min={0}
                max={10}
                value={overallMarks}
                onChange={(e) => setOverallMarks(e.target.value)}
                placeholder="0-10"
                className="input-base w-32"
              />
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary px-8 py-3 disabled:opacity-60">
            {submitting ? 'Submitting' : <>Submit Review <Send className="w-4 h-4" /></>}
          </button>
        </form>
      )}
    </div>
  );
}
