// Enums

export type UserRole = 'super_admin' | 'journal_admin' | 'conference_admin' | 'reviewer' | 'user';
export type PaperType = 'journal' | 'conference';
export type PaperStatus =
  | 'submitted'
  | 'under_review'
  | 'reviewed'
  | 'revision_requested'
  | 'resubmitted'
  | 'accepted'
  | 'rejected'
  | 'published';
export type ReviewDecision = 'accept' | 'reject' | 'revision';
export type ConferenceStatus = 'upcoming' | 'open' | 'closed' | 'completed';

/** What someone registers as. The conference fee is a function of this. */
export type RegistrantCategory =
  | 'asup_internal'
  | 'asup_external'
  | 'asuu'
  | 'corporate'
  | 'private'
  | 'student_undergraduate'
  | 'student_postgraduate';

export const REGISTRANT_CATEGORIES: { value: RegistrantCategory; label: string; hint: string }[] = [
  { value: 'asup_internal', label: 'ASUP member (internal)', hint: 'Staff of the host polytechnic' },
  { value: 'asup_external', label: 'ASUP member (external)', hint: 'Staff of any other polytechnic' },
  { value: 'asuu', label: 'ASUU member', hint: 'University academic staff' },
  { value: 'corporate', label: 'Corporate organisation', hint: 'Attending on behalf of a company' },
  { value: 'private', label: 'Private participant', hint: 'Attending in a personal capacity' },
  { value: 'student_undergraduate', label: 'Student (undergraduate)', hint: 'With a valid student ID' },
  { value: 'student_postgraduate', label: 'Student (postgraduate)', hint: 'With a valid student ID' },
];

/** Courtesy titles offered on the conference registration form. */
export const PERSON_TITLES = [
  'Prof.', 'Assoc. Prof.', 'Dr.', 'Engr.', 'Arc.', 'Barr.',
  'Rev.', 'Chief', 'Mr.', 'Mrs.', 'Ms.', 'Miss',
] as const;
export type NotificationType =
  | 'submission' | 'review_assigned' | 'feedback' | 'revision_request'
  | 'accepted' | 'rejected' | 'published' | 'conference' | 'general';

// User

export interface User {
  id: number;
  email: string;
  full_name: string;
  institution?: string;
  bio?: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface UserPublic {
  id: number;
  full_name: string;
  institution?: string;
  avatar_url?: string;
}

// Auth

export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest {
  email: string; full_name: string; password: string;
  institution?: string; bio?: string; phone?: string;
}
export interface TokenResponse { access_token: string; token_type: string; user: User; }

// Paper

export interface Paper {
  id: number;
  title: string;
  slug: string;
  abstract: string;
  keywords?: string;
  authors_str?: string;
  paper_type: PaperType;
  status: PaperStatus;
  submission_file_url?: string;
  revised_file_url?: string;
  final_pdf_url?: string;
  cover_letter?: string;
  admin_notes?: string;
  rejection_reason?: string;
  volume?: string;
  issue?: string;
  doi?: string;
  author_id: number;
  conference_id?: number;
  assigned_reviewer_id?: number;
  created_at: string;
  updated_at: string;
  author?: UserPublic;
}

// Review

export interface Review {
  id: number;
  paper_id: number;
  reviewer_id: number;
  content: string;
  decision: ReviewDecision;
  originality_score?: number;
  methodology_score?: number;
  clarity_score?: number;
  relevance_score?: number;
  is_visible_to_author: boolean;
  created_at: string;
  reviewer?: UserPublic;
  paper_title?: string | null;
}

// Conference

export interface Conference {
  id: number;
  title: string;
  slug: string;
  description: string;
  theme?: string;
  venue?: string;
  start_date?: string;
  end_date?: string;
  submission_deadline?: string;
  registration_deadline?: string;
  status: ConferenceStatus;
  banner_url?: string;
  proceedings_url?: string;
  max_registrations?: number;
  /** Legacy single fee, used when no per-category table is set. */
  registration_fee?: string;
  /** Amount per registrant category. A missing key means the category is not offered. */
  registration_fees?: Partial<Record<RegistrantCategory, string>> | null;
  currency?: string;
  payment_instructions?: string;
  payment_proof_email?: string;
  created_at: string;
}

// Publication

export interface Publication {
  id: number;
  slug: string;
  title: string;
  abstract: string;
  authors: string;
  keywords?: string;
  paper_type: string;
  pdf_url: string;
  doi?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  is_live?: boolean;
  view_count: number;
  download_count: number;
  published_at: string;
  conference_id?: number;
}

// Notification

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  link?: string;
  created_at: string;
}

// Blog


// Registration

export interface Registration {
  id: number;
  /** Null when the registrant has no platform account. */
  user_id?: number | null;
  conference_id: number;
  title?: string;
  full_name: string;
  email: string;
  phone?: string;
  institution?: string;
  category: RegistrantCategory;
  fee_amount?: string | null;
  currency?: string | null;
  status: string;
  payment_status: string;
  registration_number?: string;
  notes?: string;
  created_at: string;
  user?: UserPublic;
}

/** What the public registration form submits. */
export interface RegistrationRequest {
  title?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  institution?: string;
  category: RegistrantCategory;
  notes?: string;
}

export type CertificateKind = 'attendance' | 'presentation' | 'publication';
export type CertificateStatus = 'draft' | 'approved' | 'sent' | 'failed';

export interface Certificate {
  id: number;
  kind: CertificateKind;
  status: CertificateStatus;
  reference: string;
  user_id?: number | null;
  conference_id?: number | null;
  paper_id?: number | null;
  registration_id?: number | null;
  recipient_name: string;
  recipient_email: string;
  subject_title?: string | null;
  article_id?: string | null;
  pdf_url?: string | null;
  error?: string | null;
  approved_at?: string | null;
  sent_at?: string | null;
  created_at: string;
}

export interface CertificatePreviewItem {
  kind: CertificateKind;
  user_id?: number | null;
  registration_id?: number | null;
  recipient_name: string;
  recipient_email: string;
  subject_title?: string | null;
  already_issued: boolean;
  /** No platform account: reachable by email only. */
  is_guest?: boolean;
}

export interface CertificatePreview {
  conference_id?: number | null;
  attendance: CertificatePreviewItem[];
  presentation: CertificatePreviewItem[];
  publication: CertificatePreviewItem[];
  total_new: number;
  total_existing: number;
}

export interface CertificateTemplate {
  id: number;
  kind: CertificateKind;
  background_url?: string | null;
  signatory_band_y: number;
  updated_at: string;
}

export interface CertificateSignatory {
  id: number;
  name: string;
  title?: string | null;
  signature_url?: string | null;
  applies_to: CertificateKind[];
  display_order: number;
  is_active: boolean;
  created_at: string;
}
