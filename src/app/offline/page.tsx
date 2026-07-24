import Link from 'next/link';
import { Metadata } from 'next';
import { WifiOff, BookOpen, RotateCw } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Offline',
  description: 'You are offline.',
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment-50 px-6 py-16">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-navy-900 flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-8 h-8 text-gold-400" />
        </div>

        <h1 className="font-serif text-2xl text-navy-900 mb-3">You are offline</h1>
        <p className="font-sans text-navy-600 leading-relaxed mb-8">
          This page has not been saved to your device. Pages you have already visited,
          and any paper you have opened in the reader, are still available.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/publications" className="btn-primary flex-1 justify-center py-3">
            <BookOpen className="w-4 h-4" /> Saved publications
          </Link>
          <Link href="/" className="btn-outline flex-1 justify-center py-3">
            <RotateCw className="w-4 h-4" /> Try again
          </Link>
        </div>
      </div>
    </div>
  );
}
