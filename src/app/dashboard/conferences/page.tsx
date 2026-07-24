'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Ticket, ArrowRight, CalendarPlus, Award, Download } from 'lucide-react';
import { certificatesApi, conferencesApi } from '@/lib/api';
import { Certificate, Conference } from '@/types';
import { formatDate } from '@/lib/utils';

interface Registration {
  id: number;
  conference_id: number;
  status: string;
  payment_status: string;
  registration_number?: string;
  created_at: string;
  conference?: Conference;
}

const STATUS_STYLE: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  pending: 'bg-gold-100 text-gold-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function MyConferencesPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [upcoming, setUpcoming] = useState<Conference[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      conferencesApi.myRegistrations(),
      conferencesApi.list(),
      certificatesApi.mine(),
    ])
      .then(([r, c, k]) => {
        if (r.status === 'fulfilled') setRegistrations(r.value.data);
        if (c.status === 'fulfilled') setUpcoming(c.value.data);
        if (k.status === 'fulfilled') setCertificates(k.value.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const registeredIds = new Set(registrations.map((r) => r.conference_id));
  const openToJoin = upcoming.filter((c) => c.status === 'open' && !registeredIds.has(c.id));

  return (
    <div className="p-6 lg:p-10 max-w-5xl">
      <header className="mb-8">
        <h1 className="font-serif text-3xl text-navy-900">My Conferences</h1>
        <p className="text-navy-500 font-sans mt-2">
          Events you have registered for, and your registration references.
        </p>
      </header>

      {loading ? (
        <div className="card p-10 text-center text-navy-400 font-sans text-sm">Loading</div>
      ) : (
        <>
          {registrations.length === 0 ? (
            <div className="card p-12 text-center mb-10">
              <Ticket className="w-10 h-10 mx-auto mb-3 text-navy-200" />
              <p className="font-sans text-navy-600 mb-1">You have not registered for any conference yet.</p>
              <p className="font-sans text-sm text-navy-400">
                Registration references and certificates appear here once you do.
              </p>
              <Link href="/conferences" className="btn-primary mt-6 inline-flex">
                Browse conferences <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <section className="mb-12">
              <h2 className="font-serif text-xl text-navy-900 mb-4">Your registrations</h2>
              <div className="space-y-4">
                {registrations.map((reg) => (
                  <div key={reg.id} className="card p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`badge ${STATUS_STYLE[reg.status] || 'bg-parchment-200 text-navy-600'}`}>
                            {reg.status}
                          </span>
                          {reg.payment_status && (
                            <span className="badge bg-parchment-200 text-navy-600">{reg.payment_status}</span>
                          )}
                        </div>

                        <h3 className="font-serif text-lg text-navy-900 leading-snug mb-2">
                          {reg.conference?.title || `Conference #${reg.conference_id}`}
                        </h3>

                        <div className="flex flex-wrap gap-4 font-sans text-xs text-navy-400">
                          {reg.conference?.venue && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" /> {reg.conference.venue}
                            </span>
                          )}
                          {reg.conference?.start_date && (
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" /> {formatDate(reg.conference.start_date)}
                            </span>
                          )}
                          <span>Registered {formatDate(reg.created_at)}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-sans text-xs text-navy-400 mb-1">Reference</p>
                        <p className="font-mono text-sm text-navy-900">{reg.registration_number || '-'}</p>
                        <Link
                          href={`/conferences/${reg.conference_id}`}
                          className="btn-outline py-1.5 text-sm justify-center mt-3"
                        >
                          View event
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {certificates.length > 0 && (
            <section className="mb-12">
              <h2 className="font-serif text-xl text-navy-900 mb-4">Your certificates</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {certificates.map((cert) => (
                  <div key={cert.id} className="card p-5 flex gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gold-50 flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 text-gold-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans font-semibold text-navy-900 text-sm capitalize">
                        Certificate of {cert.kind}
                      </p>
                      {cert.subject_title && (
                        <p className="font-sans text-xs text-navy-500 mt-0.5 line-clamp-2">
                          {cert.subject_title}
                        </p>
                      )}
                      <p className="font-mono text-xs text-navy-400 mt-1.5">{cert.reference}</p>
                      {cert.pdf_url && (
                        <a
                          href={cert.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-3 text-sm font-sans font-medium text-navy-800 hover:text-gold-700 transition-colors animated-underline"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {openToJoin.length > 0 && (
            <section>
              <h2 className="font-serif text-xl text-navy-900 mb-4">Open for registration</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {openToJoin.map((conf) => (
                  <Link key={conf.id} href={`/conferences/${conf.id}`} className="group card p-5 flex flex-col gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center">
                      <CalendarPlus className="w-5 h-5 text-gold-400" />
                    </div>
                    <h3 className="font-serif text-navy-900 group-hover:text-gold-700 transition-colors leading-snug">
                      {conf.title}
                    </h3>
                    {conf.start_date && (
                      <p className="font-sans text-xs text-navy-400">{formatDate(conf.start_date)}</p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
