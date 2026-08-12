'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Users, Upload, FileText, MapPin, Calendar, Eye, EyeOff, Trash2, ExternalLink, BookOpen } from 'lucide-react';
import { conferencesApi, proceedingsApi } from '@/lib/api';
import { Conference, Registration, ConferenceProceedings, REGISTRANT_CATEGORIES } from '@/types';
import { formatDate, getErrorMessage } from '@/lib/utils';

const CATEGORY_LABEL = Object.fromEntries(
  REGISTRANT_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<string, string>;

const PAYMENT_STYLE: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  unpaid: 'bg-amber-100 text-amber-700',
  waived: 'bg-navy-100 text-navy-600',
};

export default function ConferenceRegistrationsPage() {
  const params = useParams();
  const id = parseInt(params.id as string);

  const [conference, setConference] = useState<Conference | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [proceedings, setProceedings] = useState<ConferenceProceedings[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [bookTitle, setBookTitle] = useState('');
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [bookUploading, setBookUploading] = useState(false);

  const load = () =>
    Promise.allSettled([
      conferencesApi.get(id),
      conferencesApi.registrations(id),
      proceedingsApi.adminAll(id),
    ])
      .then(([c, r, p]) => {
        if (c.status === 'fulfilled') setConference(c.value.data);
        if (r.status === 'fulfilled') setRegistrations(r.value.data);
        if (p.status === 'fulfilled') setProceedings(p.value.data);
      })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  // Recording payment is how an administrator confirms a place, since proof of
  // payment arrives by email rather than through the platform.
  const setPayment = async (reg: Registration, payment_status: string) => {
    setRegistrations((rows) =>
      rows.map((r) => (r.id === reg.id ? { ...r, payment_status } : r)),
    );
    try {
      await conferencesApi.updateRegistration(reg.id, { payment_status });
      toast.success(`Marked ${payment_status}`);
    } catch (err) {
      setRegistrations((rows) =>
        rows.map((r) => (r.id === reg.id ? { ...r, payment_status: reg.payment_status } : r)),
      );
      toast.error(getErrorMessage(err));
    }
  };

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

  const createBook = async () => {
    if (!bookTitle.trim() || !bookFile) { toast.error('Give the book a title and choose a file'); return; }
    setBookUploading(true);
    try {
      await proceedingsApi.create(bookTitle.trim(), id, bookFile);
      toast.success('Book of proceedings published');
      setBookTitle(''); setBookFile(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBookUploading(false);
    }
  };

  const toggleBookVisibility = async (book: ConferenceProceedings) => {
    setProceedings((rows) => rows.map((r) => (r.id === book.id ? { ...r, is_live: !r.is_live } : r)));
    try {
      await proceedingsApi.setVisibility(book.id, !book.is_live);
    } catch (err) {
      setProceedings((rows) => rows.map((r) => (r.id === book.id ? { ...r, is_live: book.is_live } : r)));
      toast.error(getErrorMessage(err));
    }
  };

  const deleteBook = async (book: ConferenceProceedings) => {
    try {
      await proceedingsApi.remove(book.id);
      setProceedings((rows) => rows.filter((r) => r.id !== book.id));
      toast.success('Removed');
    } catch (err) {
      toast.error(getErrorMessage(err));
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
        <h2 className="font-serif text-lg text-navy-900 mb-1 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-gold-600" /> Book of Proceedings
        </h2>
        <p className="font-sans text-sm text-navy-500 mb-4">
          Give it a title and attach the PDF or Word file. It gets its own public page at
          <span className="font-mono text-navy-600"> /proceedings/&lt;slug&gt;</span> as soon as it's uploaded,
          with the reader and page downloads available for PDFs.
        </p>

        {proceedings.length > 0 && (
          <ul className="space-y-2 mb-4">
            {proceedings.map((book) => (
              <li key={book.id} className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-parchment-100 border border-parchment-300">
                <FileText className="w-4 h-4 text-navy-700 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-sm text-navy-800 truncate">{book.title}</p>
                  <p className="font-sans text-xs text-navy-400">
                    {book.file_type.toUpperCase()} · {book.view_count} views · {book.download_count} downloads
                  </p>
                </div>
                <a href={`/proceedings/${book.slug}`} target="_blank" rel="noopener noreferrer"
                   className="p-2 rounded-lg text-navy-500 hover:bg-parchment-200 transition-colors" aria-label="View public page">
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => toggleBookVisibility(book)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans transition-colors ${
                    book.is_live ? 'bg-green-50 text-green-700' : 'bg-parchment-200 text-navy-400'
                  }`}
                >
                  {book.is_live ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {book.is_live ? 'Live' : 'Hidden'}
                </button>
                <button onClick={() => deleteBook(book)} aria-label="Remove"
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
          <div>
            <label className="block font-sans text-xs text-navy-500 mb-1">Title</label>
            <input
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="e.g. Proceedings of the 6th National Conference"
              className="input-base"
            />
          </div>
          <div>
            <label className="block font-sans text-xs text-navy-500 mb-1">File</label>
            <input
              type="file"
              accept="application/pdf,.doc,.docx"
              onChange={(e) => setBookFile(e.target.files?.[0] || null)}
              className="font-sans text-sm text-navy-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-navy-900 file:text-parchment-50 file:text-xs"
            />
          </div>
          <button onClick={createBook} disabled={bookUploading} className="btn-primary py-2 disabled:opacity-50">
            <Upload className="w-4 h-4" /> {bookUploading ? 'Publishing' : 'Publish'}
          </button>
        </div>
      </section>

      <section className="card p-6 mb-6">
        <h2 className="font-serif text-lg text-navy-900 mb-1">Quick Proceedings Link</h2>
        <p className="font-sans text-sm text-navy-500 mb-4">
          A single untitled PDF, used before the Book of Proceedings above existed. Prefer the
          section above for anything new - it has a title and its own public page.
        </p>
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
              <table className="w-full min-w-[980px] text-sm font-sans">
                <thead className="bg-parchment-100 border-b border-parchment-200">
                  <tr className="text-left text-navy-500">
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Institution</th>
                    <th className="px-5 py-3 font-medium">Fee</th>
                    <th className="px-5 py-3 font-medium">Payment</th>
                    <th className="px-5 py-3 font-medium">Reference</th>
                    <th className="px-5 py-3 font-medium">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-parchment-200">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-parchment-50">
                      <td className="px-5 py-3">
                        <p className="text-navy-900 font-medium whitespace-nowrap">
                          {[reg.title, reg.full_name].filter(Boolean).join(' ')}
                        </p>
                        <p className="text-navy-400 text-xs">{reg.email}</p>
                        {!reg.user_id && (
                          <span className="badge bg-parchment-200 text-navy-500 mt-1 inline-block">Guest</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-navy-600">
                        {CATEGORY_LABEL[reg.category] || reg.category}
                      </td>
                      <td className="px-5 py-3 text-navy-600">{reg.institution || '-'}</td>
                      <td className="px-5 py-3 text-navy-700 whitespace-nowrap">
                        {reg.fee_amount ? `${reg.currency || 'NGN'} ${reg.fee_amount}` : '-'}
                      </td>
                      <td className="px-5 py-3">
                        <select
                          value={reg.payment_status}
                          onChange={(e) => setPayment(reg, e.target.value)}
                          className={`badge cursor-pointer border-0 appearance-none ${
                            PAYMENT_STYLE[reg.payment_status] || 'bg-parchment-200 text-navy-600'
                          }`}
                        >
                          <option value="unpaid">Unpaid</option>
                          <option value="paid">Paid</option>
                          <option value="waived">Waived</option>
                        </select>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-navy-600 whitespace-nowrap">{reg.registration_number || '-'}</td>
                      <td className="px-5 py-3 text-navy-500 whitespace-nowrap">{formatDate(reg.created_at)}</td>
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
