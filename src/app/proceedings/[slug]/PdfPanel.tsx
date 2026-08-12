'use client';

import PdfReaderPanel from '@/components/pdf/PdfReaderPanel';
import { proceedingsApi } from '@/lib/api';

export default function ProceedingsPdfPanel({ url, title, slug }: { url: string; title: string; slug: string }) {
  const recordDownload = () => { proceedingsApi.recordDownload(slug).catch(() => undefined); };
  return <PdfReaderPanel url={url} title={title} onDownload={recordDownload} />;
}
