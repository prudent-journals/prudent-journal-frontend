'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Eye, Download, FileText } from 'lucide-react';
import { proceedingsApi } from '@/lib/api';
import { ConferenceProceedings } from '@/types';
import { formatDate } from '@/lib/utils';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';

export default function ProceedingsPage() {
  const [items, setItems] = useState<ConferenceProceedings[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    proceedingsApi.list()
      .then(r => setItems(r.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-hero-gradient py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-gold-400 text-sm font-sans font-semibold uppercase tracking-widest mb-3">Conference Output</p>
          <h1 className="font-serif text-4xl lg:text-5xl text-parchment-50 mb-4">Book of Proceedings</h1>
          <p className="text-parchment-300 font-sans max-w-xl">
            Published proceedings from Prudent Journals conferences, open for anyone to read and download.
          </p>
        </div>
      </section>

      <main className="flex-1 py-10 px-6 bg-parchment-50">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="h-4 bg-parchment-200 rounded w-1/3 mb-4" />
                  <div className="h-5 bg-parchment-200 rounded w-full mb-2" />
                  <div className="h-3 bg-parchment-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-24">
              <BookOpen className="w-14 h-14 text-navy-300 mx-auto mb-4" />
              <h3 className="font-serif text-xl text-navy-600 mb-2">No proceedings published yet</h3>
              <p className="text-navy-400 font-sans">Check back once a conference's book of proceedings is available.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 stagger-children min-w-0">
              {items.map((item, i) => (
                <Link
                  key={item.id}
                  href={`/proceedings/${item.slug}`}
                  className="group card p-6 flex flex-col gap-3 animate-fade-up min-w-0"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="badge bg-gold-100 text-gold-700 inline-flex items-center gap-1">
                      <FileText className="w-3 h-3" /> {item.file_type.toUpperCase()}
                    </span>
                    <span className="text-xs text-navy-400 font-sans">{formatDate(item.created_at)}</span>
                  </div>
                  <h2 className="font-serif text-lg text-navy-900 group-hover:text-gold-700 transition-colors leading-snug">
                    {item.title}
                  </h2>
                  {item.conference_title && (
                    <p className="text-navy-500 text-sm font-sans truncate">{item.conference_title}</p>
                  )}
                  <div className="pt-3 border-t border-parchment-200 flex items-center gap-4 text-navy-400 text-xs">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{item.view_count}</span>
                    <span className="flex items-center gap-1"><Download className="w-3 h-3" />{item.download_count}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
