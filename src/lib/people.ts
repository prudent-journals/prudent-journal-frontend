/**
 * People shown on the About page.
 *
 * Real data, supplied by the client. Two groups: the directors and the
 * editorial management board. The board is being expanded and one further
 * member is yet to be confirmed, represented by the `incoming` placeholder.
 *
 * Photographs are not yet available. Drop a file into `public/people/` and set
 * `photo` to `/people/filename.jpg` to add one. Where `photo` is null the page
 * falls back to the person's initials.
 */

export interface Person {
  name: string;
  role?: string;
  /** Professional bodies and post-nominals, for example "MNSE, COREN". */
  credentials?: string;
  /** Degrees held, for example "PhD, MTech, BEng". */
  qualifications?: string;
  affiliation?: string;
  bio?: string;
  research?: string[];
  photo?: string | null;
  /** A confirmed position whose holder has not yet been announced. */
  incoming?: boolean;
}

export const DIRECTORS: Person[] = [
  {
    name: 'Bariakwaadoo Stanley Bere',
    role: 'Director',
    credentials: 'FNATE, MNSE, MIEEE, MIET',
    qualifications: 'PhD, MTech, BEng, HND',
    photo: null,
    research: ['Electrical machines', 'Control engineering'],
  },
  {
    name: 'Dr O. Igbudu',
    role: 'Director',
    credentials: 'MNIP',
    photo: null,
    bio: 'Environmental physics and radiation protection.',
    research: [
      'Natural radioactivity of environmental media (water, air, soil and sediment)',
    ],
  },
];

export const EDITORIAL_BOARD: Person[] = [
  {
    name: 'Engr. Dr Nte N. Isioto',
    role: 'Editor-in-Chief',
    credentials: 'MNSE, COREN, IEEE, NIEEE',
    qualifications: 'PhD, Electronic and Communication Engineering',
    affiliation: 'Kenule Beeson Saro-Wiwa Polytechnic, Bori, Rivers State',
    photo: null,
    research: [
      'Communication systems',
      'Control and system optimization',
      'Satellite communication',
      'Embedded systems and IoT',
      'AI and machine learning',
    ],
  },
  {
    name: 'Arc. Dr Amakiri-Whyte Belema',
    role: 'Chief Lecturer, Department of Architecture',
    credentials: 'MNIA, ARCON Registered',
    qualifications: 'PhD, Urban and Regional Planning (RSU)',
    affiliation: 'Kenule Beeson Saro-Wiwa Polytechnic, Bori',
    photo: null,
    research: [
      'Parking systems in urban societies',
      'Compartmentalization of fire in buildings',
    ],
  },
  {
    name: 'Dr Efeeloo Nangih',
    role: 'Editorial Management Board',
    credentials: 'FCA, FCTI, ACFIA, AMNAA',
    qualifications: 'PhD, MSc, MBA, BSc',
    photo: null,
    bio:
      'Academic, researcher, chartered accountant and chartered tax practitioner, ' +
      'with expertise in financial accounting, taxation, oil and gas accounting, ' +
      'corporate reporting and financial analysis. He has over 900 citations across ' +
      'academic platforms and serves on the editorial board of more than seven ' +
      'international and local journals.',
    research: ['Financial accounting', 'Taxation', 'Corporate reporting'],
  },
  {
    name: 'Dr Kidi ZorBari Dekpugi',
    role: 'Chief Lecturer, Department of General Studies',
    credentials: 'MIPA, CIPM, FIPMD',
    qualifications: 'PhD Sociology (UPH), MSc, PGD, BSc',
    affiliation: 'Kenule Beeson Saro-Wiwa Polytechnic, Bori, Ogoni, Rivers State',
    photo: null,
    research: [
      'Industrial relations and human resource management',
      'Citizenship education',
    ],
  },
];

export const MILESTONES = [
  {
    year: '2026',
    title: 'Incorporated',
    detail:
      'Registered in the Federal Republic of Nigeria as Prudent Journal Ltd under ' +
      'the Companies and Allied Matters Act 2020, company number 9613688.',
  },
  {
    year: '2026',
    title: 'Platform launched',
    detail:
      'The submission, peer review and publishing platform opened to authors, with ' +
      'open access publication from the first issue.',
  },
  {
    year: '2026',
    title: 'Conference programme',
    detail:
      'The national conference programme began, with proceedings published ' +
      'alongside the journal and certification issued to presenters and attendees.',
  },
];
