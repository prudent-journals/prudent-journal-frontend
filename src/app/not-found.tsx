import Link from 'next/link';
import { BookOpen, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-hero-gradient hero-pattern flex items-center justify-center px-6">
      <div className="text-center">
        <div className="font-display text-[120px] text-gold-400/20 leading-none select-none mb-4">404</div>
        <div className="w-16 h-16 rounded-2xl bg-gold-500/20 flex items-center justify-center mx-auto mb-6 border border-gold-500/30">
          <BookOpen className="w-8 h-8 text-gold-400" />
        </div>
        <h1 className="font-serif text-3xl text-parchment-50 mb-3">Page Not Found</h1>
        <p className="text-parchment-400 font-sans mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/" className="btn-gold">
            <ArrowLeft className="w-4 h-4" /> Back to Homepage
          </Link>
          <Link href="/publications" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-parchment-50 border-2 border-parchment-50/30 hover:border-parchment-50 transition-all font-medium text-sm">
            Browse Publications
          </Link>
        </div>
      </div>
    </div>
  );
}
