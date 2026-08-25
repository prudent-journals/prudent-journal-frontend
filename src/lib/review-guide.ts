// The reviewer's guide - the journal's standard peer-review form - filled in
// directly as part of "Submit your review" rather than uploaded as a file.
// Its shape is fixed, so the questions live here as constants shared by
// nothing else; the backend stores whatever is submitted as opaque JSON
// (see ReviewGuideInput in the backend schemas) and echoes the label back
// on every row, so display-only pages never need to import this list.

export const OBJECTIVE_CRITERIA = [
  ['title_clarity', 'Is the title clear and appropriate for the paper?'],
  ['abstract_comprehensive', 'Is the abstract of the article comprehensive?'],
  ['keywords_appropriate', 'Are the keywords appropriate and useful?'],
  ['background_sufficient', 'Is the background information sufficient and well organized?'],
  ['objectives_clear', 'Are the objectives clearly stated?'],
  ['literature_relevant', 'Is the literature review relevant?'],
  ['literature_recent', 'Is the literature review recent?'],
  ['literature_methodology', 'Is the literature search methodology explained properly?'],
  ['critical_analysis', 'Is critical analysis of the literature done?'],
  ['research_gaps', 'Is identification of research gaps / future directions done?'],
  ['conclusions_logical', 'Are the conclusions logically arrived at?'],
  ['limitations_discussed', 'Are the limitations of the paper discussed?'],
  ['references_quality', 'What is the quality of references (peer-reviewed, authentic sources)?'],
  ['language_clarity', 'Is the manuscript written in clear, understandable language?'],
] as const;

// 5 = Excellent, 4 = Good, 3 = Satisfactory, 2 = Needs Improvement, 1 = Poor.
// Correction/Feedback is mandatory for a rating of 2 or 1.
export const RATING_SCALE = [
  { value: 5, label: '5 - Excellent' },
  { value: 4, label: '4 - Good' },
  { value: 3, label: '3 - Satisfactory' },
  { value: 2, label: '2 - Needs Improvement' },
  { value: 1, label: '1 - Poor' },
] as const;

export const SUBJECTIVE_QUESTIONS = [
  ['title_suitable', 'Is the title of the article suitable?'],
  ['abstract_comprehensive_yn', 'Is the abstract of the article comprehensive?'],
  ['scientifically_correct', 'Is the manuscript scientifically correct?'],
  ['references_sufficient_recent', 'Are the references sufficient and recent?'],
  ['ethical_issues', 'Are there ethical issues in this manuscript?'],
] as const;

// Accept As It Is: >9-10, Minor Revision: >8-9, Major Revision: >7-8,
// Serious Major Revision: >5-7, Rejected (repairable): >3-5,
// Strongly rejected (irreparable): >0-3.
export const OVERALL_MARKS_GUIDE =
  'Accept As It Is (>9-10) · Minor Revision (>8-9) · Major Revision (>7-8) · ' +
  'Serious Major Revision (>5-7) · Rejected, repairable (>3-5) · Strongly rejected, irreparable (>0-3)';
