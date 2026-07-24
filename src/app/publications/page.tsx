'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Filter, BookOpen, Download, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { publicationsApi } from '@/lib/api';
import { Publication } from '@/types';
import { formatDate, truncate, cn } from '@/lib/utils';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';

const PAGE_SIZE = 12;

export default function PublicationsPage() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await publicationsApi.list({
        search: search || undefined,
        paper_type: typeFilter || undefined,
        page,
        size: PAGE_SIZE,
      });
      setPublications(Array.isArray(data) ? data : []);
      // If API returns paginated format
      if (data.total !== undefined) setTotal(data.total);
    } catch {
      setPublications([]);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Header */}
      <section className="bg-hero-gradient py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-gold-400 text-sm font-sans font-semibold uppercase tracking-widest mb-3">Research Repository</p>
          <h1 className="font-serif text-4xl lg:text-5xl text-parchment-50 mb-4">Publications</h1>
          <p className="text-parchment-300 font-sans max-w-xl">
            Explore peer-reviewed research, journal articles, and conference proceedings from Prudent Journals scholars.
          </p>
        </div>
      </section>

      {/* Filters */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-parchment-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input
              type="text"
              placeholder="Search by title, author, or keyword..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="input-base pl-10"
            />
          </div>
          <div className="flex gap-2">
            {['', 'journal', 'conference'].map(type => (
              <button
                key={type}
                onClick={() => { setTypeFilter(type); setPage(1); }}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  typeFilter === type
                    ? 'bg-navy-900 text-parchment-50'
                    : 'bg-parchment-100 text-navy-600 hover:bg-parchment-200'
                )}
              >
                {type === '' ? 'All' : type === 'journal' ? 'Journal' : 'Conference'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 py-10 px-6 bg-parchment-50">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="h-4 bg-parchment-200 rounded w-1/3 mb-4" />
                  <div className="h-5 bg-parchment-200 rounded w-full mb-2" />
                  <div className="h-5 bg-parchment-200 rounded w-4/5 mb-4" />
                  <div className="h-3 bg-parchment-200 rounded w-full mb-2" />
                  <div className="h-3 bg-parchment-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : publications.length === 0 ? (
            <div className="text-center py-24">
              <BookOpen className="w-14 h-14 text-navy-300 mx-auto mb-4" />
              <h3 className="font-serif text-xl text-navy-600 mb-2">No publications found</h3>
              <p className="text-navy-400 font-sans">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-navy-500 font-sans mb-6">
                {publications.length} result{publications.length !== 1 ? 's' : ''} found
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                {publications.map((pub, i) => (
                  <PublicationCard key={pub.id} pub={pub} index={i} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-parchment-300 disabled:opacity-40 hover:bg-parchment-100 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        'w-9 h-9 rounded-lg text-sm font-medium transition-all',
                        page === p ? 'bg-navy-900 text-parchment-50' : 'hover:bg-parchment-100 text-navy-600'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-parchment-300 disabled:opacity-40 hover:bg-parchment-100 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}

function PublicationCard({ pub, index }: { pub: Publication; index: number }) {
  return (
    <Link
      href={`/publications/${pub.slug}`}
      className="group card p-6 flex flex-col gap-3 animate-fade-up min-w-0"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-center justify-between">
        <span className={cn(
          'badge',
          pub.paper_type === 'conference' ? 'bg-navy-100 text-navy-700' : 'bg-gold-100 text-gold-700'
        )}>
          {pub.paper_type === 'conference' ? 'Conference' : 'Journal'}
        </span>
        {pub.volume && (
          <span className="text-xs text-navy-400 font-mono">Vol. {pub.volume}{pub.issue ? ` No. ${pub.issue}` : ''}</span>
        )}
      </div>

      <h2 className="font-serif text-base text-navy-900 group-hover:text-gold-700 transition-colors leading-snug">
        {truncate(pub.title, 90)}
      </h2>

      <p className="text-navy-500 text-sm font-sans leading-relaxed flex-1">
        {truncate(pub.abstract, 130)}
      </p>

      {pub.keywords && (
        <div className="flex flex-wrap gap-1">
          {pub.keywords.split(',').slice(0, 3).map(kw => (
            <span key={kw} className="text-xs px-2 py-0.5 rounded-full bg-parchment-200 text-navy-600">
              {kw.trim()}
            </span>
          ))}
        </div>
      )}

      <div className="pt-3 border-t border-parchment-200 flex items-center justify-between gap-2 min-w-0">
        <span className="text-xs text-navy-500 font-sans truncate min-w-0 flex-1">{pub.authors}</span>
        <div className="flex items-center gap-3 text-navy-400 flex-shrink-0">
          <span className="flex items-center gap-1 text-xs"><Eye className="w-3 h-3" />{pub.view_count}</span>
          <span className="flex items-center gap-1 text-xs"><Download className="w-3 h-3" />{pub.download_count}</span>
        </div>
      </div>
    </Link>
  );
}
