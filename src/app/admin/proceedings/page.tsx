'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Library, Eye, EyeOff, Download, ExternalLink, FileText, Trash2, Upload, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { proceedingsApi, conferencesApi } from '@/lib/api';
import { ConferenceProceedings, Conference } from '@/types';
import { formatDate, getErrorMessage } from '@/lib/utils';

export default function AdminProceedingsPage() {
  const [proceedings, setProceedings] = useState<ConferenceProceedings[]>([]);
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [conferenceId, setConferenceId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = () =>
    Promise.allSettled([proceedingsApi.adminAll(), conferencesApi.list()])
      .then(([p, c]) => {
        if (p.status === 'fulfilled') setProceedings(p.value.data);
        if (c.status === 'fulfilled') setConferences(c.value.data);
      })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const conferenceTitle = useMemo(
    () => Object.fromEntries(conferences.map((c) => [c.id, c.title])),
    [conferences],
  );

  const onUpload = async () => {
    if (!title.trim() || !conferenceId || !file) {
      toast.error('Give it a title, a conference, and a file');
      return;
    }
    setUploading(true);
    try {
      await proceedingsApi.create(title.trim(), parseInt(conferenceId, 10), file);
      toast.success('Book of proceedings published');
      setTitle(''); setConferenceId(''); setFile(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const toggleVisibility = async (item: ConferenceProceedings) => {
    setToggling(item.id);
    try {
      const { data } = await proceedingsApi.setVisibility(item.id, !item.is_live);
      setProceedings((list) => list.map((p) => (p.id === item.id ? { ...p, is_live: data.is_live } : p)));
      toast.success(data.is_live ? 'Back on the public site' : 'Withdrawn from the public site');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToggling(null);
    }
  };

  const remove = async (item: ConferenceProceedings) => {
    setDeleting(item.id);
    try {
      await proceedingsApi.remove(item.id);
      setProceedings((list) => list.filter((p) => p.id !== item.id));
      toast.success('Removed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  const totals = useMemo(
    () => ({
      views: proceedings.reduce((n, p) => n + (p.view_count || 0), 0),
      downloads: proceedings.reduce((n, p) => n + (p.download_count || 0), 0),
      live: proceedings.filter((p) => p.is_live).length,
    }),
    [proceedings],
  );

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <header className="mb-8">
        <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-2">Administration</p>
        <h1 className="font-serif text-3xl text-navy-900">Book of Proceedings</h1>
        <p className="text-navy-500 font-sans mt-2">
          Publish a titled PDF or Word file for a conference. Each one gets its own public page
          with a reader and downloads, open to anyone without signing in.
        </p>
      </header>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Live', value: totals.live, icon: Library },
          { label: 'Total views', value: totals.views, icon: Eye },
          { label: 'Total downloads', value: totals.downloads, icon: Download },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-5">
            <div className="w-10 h-10 rounded-xl bg-navy-50 text-navy-700 flex items-center justify-center mb-3">
              <Icon className="w-5 h-5" />
            </div>
            <p className="font-display text-3xl text-navy-900 tabular-figures">{loading ? '' : value.toLocaleString()}</p>
            <p className="text-sm text-navy-500 font-sans mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Upload */}
      <div className="card p-6 mb-8">
        <h2 className="font-serif text-lg text-navy-900 mb-4">Publish a new one</h2>
        <div className="grid sm:grid-cols-[1fr_1fr] gap-4 mb-4">
          <div>
            <label className="block font-sans text-xs text-navy-500 mb-1.5">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Proceedings of the 6th National Conference"
              className="input-base"
            />
          </div>
          <div>
            <label className="block font-sans text-xs text-navy-500 mb-1.5">Conference</label>
            <select value={conferenceId} onChange={(e) => setConferenceId(e.target.value)} className="input-base">
              <option value="">Select a conference</option>
              {conferences.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[14rem]">
            <label className="block font-sans text-xs text-navy-500 mb-1.5">File (PDF or Word)</label>
            <input
              type="file"
              accept="application/pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="font-sans text-sm text-navy-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-navy-900 file:text-parchment-50 file:text-sm w-full"
            />
          </div>
          <button onClick={onUpload} disabled={uploading} className="btn-primary py-2 disabled:opacity-60">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Publishing' : 'Publish'}
          </button>
        </div>
        {conferences.length === 0 && !loading && (
          <p className="font-sans text-xs text-navy-400 mt-3">
            No conferences yet. <Link href="/admin/conferences" className="text-gold-700 underline">Create one first</Link>.
          </p>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="card p-10 text-center text-navy-400 font-sans text-sm">Loading</div>
      ) : proceedings.length === 0 ? (
        <div className="card p-12 text-center">
          <Library className="w-10 h-10 mx-auto mb-3 text-navy-200" />
          <p className="font-sans text-navy-600">Nothing published yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proceedings.map((item) => (
            <div key={item.id} className="card p-5 flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="badge bg-gold-100 text-gold-700 inline-flex items-center gap-1">
                    <FileText className="w-3 h-3" /> {item.file_type.toUpperCase()}
                  </span>
                  {!item.is_live && (
                    <span className="badge bg-red-100 text-red-700 inline-flex items-center gap-1">
                      <EyeOff className="w-3 h-3" /> Withdrawn
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-lg text-navy-900 leading-snug mb-1">{item.title}</h3>
                <p className="font-sans text-sm text-navy-500">
                  {item.conference_title || conferenceTitle[item.conference_id] || 'Unknown conference'}
                </p>
                <div className="flex flex-wrap gap-4 font-sans text-xs text-navy-400 mt-2">
                  <span>Published {formatDate(item.created_at)}</span>
                  <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {item.view_count}</span>
                  <span className="inline-flex items-center gap-1"><Download className="w-3.5 h-3.5" /> {item.download_count}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 min-w-[9.5rem]">
                <button
                  onClick={() => toggleVisibility(item)}
                  disabled={toggling === item.id}
                  className={`py-1.5 text-sm justify-center rounded-xl font-medium inline-flex items-center gap-2 transition-colors disabled:opacity-60 ${
                    item.is_live
                      ? 'bg-navy-900 text-parchment-50 hover:bg-navy-800'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {toggling === item.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : item.is_live ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {item.is_live ? 'Take offline' : 'Put back live'}
                </button>
                <Link href={`/proceedings/${item.slug}`} target="_blank" className="btn-outline py-1.5 text-sm justify-center">
                  <ExternalLink className="w-3.5 h-3.5" /> View live
                </Link>
                <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="btn-ghost py-1.5 text-sm justify-center">
                  <FileText className="w-3.5 h-3.5" /> Open file
                </a>
                <button
                  onClick={() => remove(item)}
                  disabled={deleting === item.id}
                  className="py-1.5 text-sm justify-center rounded-xl font-medium inline-flex items-center gap-2 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                  {deleting === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
