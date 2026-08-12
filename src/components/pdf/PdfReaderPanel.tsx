'use client';

import dynamic from 'next/dynamic';
import { publicationsApi } from '@/lib/api';

// pdf.js only runs in the browser, so the reader is never server rendered.
const PdfReader = dynamic(() => import('./PdfReader'), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-parchment-300 bg-parchment-100 p-16 text-center">
      <p className="font-sans text-sm text-navy-400">Preparing the reader</p>
    </div>
  ),
});

interface Props {
  url: string;
  title?: string;
  /** When present, a completed download is counted against the publication. */
  slug?: string;
  /** Overrides the publication-download counter with a different one, for
   * surfaces that aren't a Publication (e.g. conference proceedings). */
  onDownload?: () => void;
}

export default function PdfReaderPanel({ url, title, slug, onDownload }: Props) {
  const recordDownload = () => {
    if (onDownload) { onDownload(); return; }
    if (!slug) return;
    // Best effort. A failed count must never break the download itself.
    publicationsApi.recordDownload(slug).catch(() => undefined);
  };

  return <PdfReader url={url} title={title} onDownload={recordDownload} />;
}
