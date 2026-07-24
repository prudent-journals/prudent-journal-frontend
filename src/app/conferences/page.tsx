'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Clock, FileText, ArrowRight } from 'lucide-react';
import { conferencesApi } from '@/lib/api';
import { Conference } from '@/types';
import { formatDate, cn } from '@/lib/utils';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';

export default function ConferencesPage() {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    conferencesApi.list().then(r => setConferences(r.data)).finally(() => setLoading(false));
  }, []);

  const upcoming = conferences.filter(c => ['upcoming', 'open'].includes(c.status));
  const past = conferences.filter(c => ['closed', 'completed'].includes(c.status));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-hero-gradient py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-gold-400 text-sm font-sans font-semibold uppercase tracking-widest mb-3">Academic Events</p>
          <h1 className="font-serif text-4xl lg:text-5xl text-parchment-50 mb-4">Conferences</h1>
          <p className="text-parchment-300 font-sans max-w-xl">
            Academic conferences hosted by Prudent Journals. Register, submit papers, and access proceedings.
          </p>
        </div>
      </section>

      <main className="flex-1 py-12 px-6 bg-parchment-50">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="h-5 bg-parchment-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-parchment-200 rounded w-full mb-2" />
                  <div className="h-4 bg-parchment-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : conferences.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="w-14 h-14 text-navy-200 mx-auto mb-4" />
              <p className="text-navy-500 font-sans">No conferences scheduled yet.</p>
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div className="mb-12">
                  <h2 className="font-serif text-2xl text-navy-900 mb-6 section-bordered">Upcoming & Open</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {upcoming.map(conf => <ConferenceCard key={conf.id} conf={conf} />)}
                  </div>
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <h2 className="font-serif text-2xl text-navy-900 mb-6 section-bordered">Past Conferences</h2>
                  <div className="grid md:grid-cols-2 gap-6 opacity-80">
                    {past.map(conf => <ConferenceCard key={conf.id} conf={conf} past />)}
                  </div>
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

function ConferenceCard({ conf, past = false }: { conf: Conference; past?: boolean }) {
  const statusColors: Record<string, string> = {
    upcoming: 'bg-blue-100 text-blue-700',
    open: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-600',
    completed: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="card overflow-hidden group">
      <div className={cn('h-2', past ? 'bg-navy-300' : 'bg-gradient-to-r from-gold-500 to-gold-400')} />
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <span className={`badge ${statusColors[conf.status] || 'bg-gray-100 text-gray-600'}`}>
            {conf.status.charAt(0).toUpperCase() + conf.status.slice(1)}
          </span>
          {conf.proceedings_url && (
            <a href={conf.proceedings_url} target="_blank" rel="noopener"
              className="flex items-center gap-1 text-xs text-gold-600 hover:text-gold-700">
              <FileText className="w-3.5 h-3.5" /> Proceedings
            </a>
          )}
        </div>

        <h3 className="font-serif text-xl text-navy-900 mb-2 group-hover:text-gold-700 transition-colors">
          {conf.title}
        </h3>

        {conf.theme && (
          <p className="text-sm text-navy-500 italic mb-3">Theme: {conf.theme}</p>
        )}

        <p className="text-sm text-navy-600 font-sans leading-relaxed mb-4 line-clamp-2">
          {conf.description}
        </p>

        <div className="space-y-2 text-sm text-navy-500 mb-5">
          {conf.venue && (
            <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-navy-400" /> {conf.venue}</span>
          )}
          {conf.start_date && (
            <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-navy-400" />
              {formatDate(conf.start_date)}{conf.end_date ? ` - ${formatDate(conf.end_date)}` : ''}
            </span>
          )}
          {conf.submission_deadline && (
            <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-orange-400 " />
              <span className="text-orange-600">Submission deadline: {formatDate(conf.submission_deadline)}</span>
            </span>
          )}
          {conf.max_registrations && (
            <span className="flex items-center gap-2"><Users className="w-4 h-4 text-navy-400" />
              Max {conf.max_registrations} attendees
            </span>
          )}
        </div>

        <div className="flex gap-3">
          <Link href={`/conferences/${conf.id}`} className="btn-primary text-sm flex-1 justify-center">
            View Details <ArrowRight className="w-4 h-4" />
          </Link>
          {conf.status === 'open' && (
            <Link href={`/conferences/${conf.id}#register`} className="btn-gold text-sm px-4">
              Register
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
