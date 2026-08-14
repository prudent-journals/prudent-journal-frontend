'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, FileWarning } from 'lucide-react';
import PdfReaderPanel from '@/components/pdf/PdfReaderPanel';

function isPdf(url: string): boolean {
  return /\.pdf(\?|#|$)/i.test(url);
}

function PreviewContent() {
  const params = useSearchParams();
  const url = params.get('url');
  const title = params.get('title') || 'Document';

  if (!url) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-8 text-center">
        <FileWarning className="w-10 h-10 text-navy-300" />
        <p className="font-sans text-navy-600">No document was given to preview.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-parchment-50">
      <header className="border-b border-parchment-200 bg-white px-4 py-3 flex items-center gap-3">
        <button onClick={() => window.close()} className="inline-flex items-center gap-1.5 text-sm text-navy-500 hover:text-navy-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Close
        </button>
        <h1 className="font-serif text-base text-navy-900 truncate flex-1">{title}</h1>
      </header>

      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {isPdf(url) ? (
            <PdfReaderPanel url={url} title={title} />
          ) : (
            <div className="space-y-3">
              <p className="font-sans text-sm text-navy-500">
                Word documents are previewed through Google's document viewer.
                If it doesn't load, <a href={url} className="text-gold-700 underline">open the file directly</a> instead.
              </p>
              <iframe
                title={title}
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
                className="w-full rounded-2xl border border-parchment-300 bg-white"
                style={{ height: '80vh' }}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-navy-400 font-sans text-sm">Loading</div>}>
      <PreviewContent />
    </Suspense>
  );
}
