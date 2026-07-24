'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Users, Upload, FileText, MapPin, Calendar } from 'lucide-react';
import { conferencesApi } from '@/lib/api';
import { Conference } from '@/types';
import { formatDate, getErrorMessage } from '@/lib/utils';

interface Registration {
  id: number;
  user_id: number;
  status: string;
  payment_status: string;
  registration_number?: string;
  created_at: string;
  user?: { full_name: string; email: string; institution?: string };
}

export default function ConferenceRegistrationsPage() {
  const params = useParams();
  const id = parseInt(params.id as string);

  const [conference, setConference] = useState<Conference | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = () =>
    Promise.allSettled([conferencesApi.get(id), conferencesApi.registrations(id)])
      .then(([c, r]) => {
        if (c.status === 'fulfilled') setConference(c.value.data);
        if (r.status === 'fulfilled') setRegistrations(r.value.data);
      })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  const uploadProceedings = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await conferencesApi.uploadProceedings(id, file);
      toast.success('Proceedings uploaded');
      setFile(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-10 text-navy-400 font-sans text-sm">Loading</div>;

  if (!conference) {
    return (
      <div className="p-10">
        <p className="font-sans text-navy-600">Conference not found.</p>
        <Link href="/admin/conferences" className="btn-outline mt-4 inline-flex">Back</Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl">
      <Link href="/admin/conferences" className="inline-flex items-center gap-2 text-sm text-navy-500 hover:text-navy-800 font-sans mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> All conferences
      </Link>

      <header className="mb-8">
        <span className="badge bg-parchment-200 text-navy-600 capitalize mb-3 inline-block">{conference.status}</span>
        <h1 className="font-serif text-2xl lg:text-3xl text-navy-900 leading-snug mb-3">{conference.title}</h1>
        <div className="flex flex-wrap gap-4 font-sans text-sm text-navy-500">
          {conference.venue && <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {conference.venue}</span>}
          {conference.start_date && <span className="inline-flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatDate(conference.start_date)}</span>}
        </div>
      </header>

      <section className="card p-6 mb-6">
        <h2 className="font-serif text-lg text-navy-900 mb-4">Proceedings</h2>
        {conference.proceedings_url ? (
          <a href={conference.proceedings_url} target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-3 p-4 rounded-xl bg-parchment-100 border border-parchment-300 hover:border-gold-400 transition-colors">
            <FileText className="w-5 h-5 text-navy-700" />
            <span className="font-sans text-sm text-navy-800">Proceedings published, open the PDF</span>
          </a>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="font-sans text-sm text-navy-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-navy-900 file:text-parchment-50 file:text-sm"
            />
            <button onClick={uploadProceedings} disabled={!file || uploading} className="btn-primary py-2 disabled:opacity-50">
              <Upload className="w-4 h-4" /> {uploading ? 'Uploading' : 'Upload'}
            </button>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-navy-700" />
          <h2 className="font-serif text-lg text-navy-900">
            Registrations <span className="text-navy-400 font-sans text-sm">({registrations.length})</span>
          </h2>
        </div>

        {registrations.length === 0 ? (
          <div className="card p-10 text-center text-navy-500 font-sans">No registrations yet.</div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead className="bg-parchment-100 border-b border-parchment-200">
                  <tr className="text-left text-navy-500">
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Institution</th>
                    <th className="px-5 py-3 font-medium">Reference</th>
                    <th className="px-5 py-3 font-medium">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-parchment-200">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-parchment-50">
                      <td className="px-5 py-3">
                        <p className="text-navy-900 font-medium">{reg.user?.full_name || `User #${reg.user_id}`}</p>
                        {reg.user?.email && <p className="text-navy-400 text-xs">{reg.user.email}</p>}
                      </td>
                      <td className="px-5 py-3 text-navy-600">{reg.user?.institution || '-'}</td>
                      <td className="px-5 py-3 font-mono text-xs text-navy-600">{reg.registration_number || '-'}</td>
                      <td className="px-5 py-3 text-navy-500">{formatDate(reg.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
