/**
 * Upload constraints, kept in step with app/services/file_service.py.
 *
 * Manuscripts move through submission and review as Word documents, because
 * authors and reviewers exchange tracked changes. PDF is the format of the
 * finished article, produced when an administrator publishes it, and of
 * conference proceedings.
 */

export const MAX_DOCUMENT_SIZE = 100 * 1024 * 1024;
export const MAX_DOCUMENT_SIZE_LABEL = '100MB';

// A book of proceedings compiles many papers into one file and can reach
// multiple gigabytes. It's uploaded in small pieces behind the scenes so
// Cloudinary's own per-file size cap never gets in the way - this is a
// sanity ceiling, not anything close to a real technical limit.
export const MAX_PROCEEDINGS_SIZE = 5 * 1024 * 1024 * 1024;
export const MAX_PROCEEDINGS_SIZE_LABEL = '5GB';

/** Dropzone `accept` map for a manuscript. */
export const MANUSCRIPT_ACCEPT = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
} as const;

/** `accept` attribute for a plain file input taking a manuscript. */
export const MANUSCRIPT_ACCEPT_ATTR =
  '.docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword';

export const MANUSCRIPT_HINT = `Word document (.docx) · Max ${MAX_DOCUMENT_SIZE_LABEL}`;

/** Dropzone `accept` map for the published PDF. */
export const PDF_ACCEPT = { 'application/pdf': ['.pdf'] } as const;
export const PDF_HINT = `PDF only · Max ${MAX_DOCUMENT_SIZE_LABEL}`;
