import { ReviewGuide } from '@/types';

// Full detail, including the two parts an author must never see
// (confidential_comments, competing_interest) - this is the editorial
// (admin / chief editor) view of a reviewer's guide. Reused wherever a
// review is shown to the editorial side; the author-facing pages render
// their own sanitized view since the API already strips those two parts
// before a guide reaches an author-facing response.
export default function ReviewerGuideDetail({ guide }: { guide?: ReviewGuide | null }) {
  if (!guide) return null;
  return (
    <div className="mt-3 pt-3 border-t border-parchment-200 space-y-3">
      {(guide.importance_comment || guide.importance_correction_feedback) && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-navy-400 mb-1">
            Importance of the manuscript
          </p>
          {guide.importance_comment && <p className="text-sm text-navy-700 whitespace-pre-wrap">{guide.importance_comment}</p>}
          {guide.importance_correction_feedback && (
            <p className="text-sm text-navy-600 mt-1"><span className="font-medium">Correction/Feedback:</span> {guide.importance_correction_feedback}</p>
          )}
        </div>
      )}
      {guide.objective_evaluation?.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-navy-400 mb-1">Objective evaluation</p>
          <div className="space-y-1">
            {guide.objective_evaluation.map((r) => (
              <p key={r.key} className="text-sm text-navy-700">
                {r.label} <span className="text-navy-400">({r.rating ? `${r.rating}/5` : 'N/A'})</span>
                {r.correction_feedback && <span className="block text-navy-600"><span className="font-medium">Correction/Feedback:</span> {r.correction_feedback}</span>}
              </p>
            ))}
          </div>
        </div>
      )}
      {guide.subjective_evaluation?.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-navy-400 mb-1">Subjective evaluation</p>
          <div className="space-y-1">
            {guide.subjective_evaluation.map((r) => (
              <p key={r.key} className="text-sm text-navy-700">
                {r.label} <span className="text-navy-400">({r.answer === null || r.answer === undefined ? '-' : r.answer ? 'Yes' : 'No'})</span>
                {r.correction_feedback && <span className="block text-navy-600"><span className="font-medium">Correction/Feedback:</span> {r.correction_feedback}</span>}
              </p>
            ))}
          </div>
        </div>
      )}
      {guide.confidential_comments && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-navy-400 mb-1">
            Confidential comments to the editor <span className="normal-case font-normal">(never shown to the author)</span>
          </p>
          <p className="text-sm text-navy-700 whitespace-pre-wrap">{guide.confidential_comments}</p>
        </div>
      )}
      {guide.competing_interest && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-navy-400 mb-1">Competing interest</p>
          <p className="text-sm text-navy-700 whitespace-pre-wrap">{guide.competing_interest}</p>
        </div>
      )}
      {typeof guide.overall_marks === 'number' && (
        <p className="text-sm text-navy-700"><span className="font-medium">Overall marks:</span> {guide.overall_marks}/10</p>
      )}
      {guide.ai_used && (
        <p className="text-xs text-orange-700 font-medium">Reviewer declared AI was used during this review.</p>
      )}
    </div>
  );
}
