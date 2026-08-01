import { Cpu, Droplets, Landmark } from 'lucide-react';

/**
 * The three titles Prudent Journals publishes under.
 *
 * This is the single source of truth for the journal list. The landing page and
 * the About page both read it, so adding or renaming a title is one edit here.
 *
 * `q` is the search term a card links to. Publications are not yet tagged with a
 * journal, so the listing is filtered by subject keywords instead; if a journal
 * field is added to the model later, only this constant and the links need to
 * change.
 */
export const JOURNALS = [
  {
    icon: Cpu,
    title: 'Journal of Science and Engineering',
    blurb:
      'Applied science and engineering research, from materials and power systems to computing and instrumentation.',
    topics: ['Engineering', 'Computing', 'Energy', 'Applied physics'],
    q: 'engineering',
  },
  {
    icon: Droplets,
    title: 'Journal of Environmental Science',
    blurb:
      'Work on the environment and the systems that depend on it, including pollution, water quality, agriculture and climate adaptation.',
    topics: ['Environment', 'Agriculture', 'Water', 'Climate'],
    q: 'environmental',
  },
  {
    icon: Landmark,
    title: 'Journal of Management and Social Science',
    blurb:
      'Management, economics and the social sciences, including public administration, institutional reform and health policy.',
    topics: ['Management', 'Economics', 'Governance', 'Social policy'],
    q: 'management',
  },
] as const;
