'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Search, ExternalLink, Eye, EyeOff, Download, FileText, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { publicationsApi } from '@/lib/api';
import { Publication } from '@/types';
import { formatDate, truncate, getErrorMessage } from '@/lib/utils';

type TypeFilter = 'all' | 'journal' | 'conference';

export default function AdminPublicationsPage() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [toggling, setToggling] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    publicationsApi.adminAll()
      .then((r) => setPublications(r.data))
      .catch(() => setPublications([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleVisibility = async (pub: Publication) => {
    const next = !(pub.is_live ?? true);
    setToggling(pub.id);
    try {
      const { data } = await publicationsApi.setVisibility(pub.id, next);
      setPublications((list) => list.map((p) => (p.id === pub.id ? { ...p, is_live: data.is_live } : p)));
      toast.success(next ? 'Publication is live again' : 'Publication withdrawn from the site');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToggling(null);
    }
  };

  const remove = async (pub: Publication) => {
    if (!confirm(`Delete "${pub.title}"?\n\nThis permanently removes the publication and cannot be undone. The underlying paper is put back to accepted, so it can be republished later.`)) {
      return;
    }
    setDeleting(pub.id);
    try {
      await publicationsApi.remove(pub.id);
      setPublications((list) => list.filter((p) => p.id !== pub.id));
      toast.success('Publication deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  const visible = useMemo(
    () =>
      publications.filter((p) => {
        if (typeFilter !== 'all' && p.paper_type !== typeFilter) return false;
        if (query) {
          const q = query.toLowerCase();
          return p.title.toLowerCase().includes(q) || p.authors.toLowerCase().includes(q);
        }
        return true;
      }),
    [publications, query, typeFilter],
  );

  const totals = useMemo(
    () => ({
      views: publications.reduce((n, p) => n + (p.view_count || 0), 0),
      downloads: publications.reduce((n, p) => n + (p.download_count || 0), 0),
    }),
    [publications],
  );

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <header className="mb-8">
        <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-2">Administration</p>
        <h1 className="font-serif text-3xl text-navy-900">Publications</h1>
        <p className="text-navy-500 font-sans mt-2">
          Everything published. Switch an item off to take it down from the public site
        without deleting it, and back on when you are ready.
        </p>
      </header>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Live publications', value: publications.filter((p) => p.is_live ?? true).length, icon: BookOpen },
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

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-1 p-1 rounded-xl bg-parchment-200 w-fit">
          {(['all', 'journal', 'conference'] as TypeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-sans font-medium capitalize transition-colors ${
                typeFilter === t ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500 hover:text-navy-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or author"
            className="input-base pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-navy-400 font-sans text-sm">Loading</div>
      ) : visible.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen className="w-10 h-10 mx-auto mb-3 text-navy-200" />
          <p className="font-sans text-navy-600">
            {publications.length === 0 ? 'Nothing published yet.' : 'No publication matches those filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((pub) => (
            <div key={pub.id} className="card p-5 flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`badge ${pub.paper_type === 'conference' ? 'bg-navy-100 text-navy-700' : 'bg-gold-100 text-gold-700'}`}>
                    {pub.paper_type === 'conference' ? 'Conference' : 'Journal'}
                  </span>
                  {!(pub.is_live ?? true) && (
                    <span className="badge bg-red-100 text-red-700 inline-flex items-center gap-1">
                      <EyeOff className="w-3 h-3" /> Withdrawn
                    </span>
                  )}
                  {pub.volume && (
                    <span className="font-mono text-xs text-navy-400">
                      Vol. {pub.volume}{pub.issue ? `(${pub.issue})` : ''}{pub.pages ? `, pp ${pub.pages}` : ''}
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-lg text-navy-900 leading-snug mb-1">{truncate(pub.title, 90)}</h3>
                <p className="font-sans text-sm text-navy-500">{pub.authors}</p>
                <div className="flex flex-wrap gap-4 font-sans text-xs text-navy-400 mt-2">
                  <span>Published {formatDate(pub.published_at)}</span>
                  <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {pub.view_count ?? 0}</span>
                  <span className="inline-flex items-center gap-1"><Download className="w-3.5 h-3.5" /> {pub.download_count ?? 0}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 min-w-[9.5rem]">
                <button
                  onClick={() => toggleVisibility(pub)}
                  disabled={toggling === pub.id}
                  className={`py-1.5 text-sm justify-center rounded-xl font-medium inline-flex items-center gap-2 transition-colors disabled:opacity-60 ${
                    (pub.is_live ?? true)
                      ? 'bg-navy-900 text-parchment-50 hover:bg-navy-800'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {toggling === pub.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : (pub.is_live ?? true) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {(pub.is_live ?? true) ? 'Take offline' : 'Put back live'}
                </button>
                <Link href={`/publications/${pub.slug}`} target="_blank" className="btn-outline py-1.5 text-sm justify-center">
                  <ExternalLink className="w-3.5 h-3.5" /> View live
                </Link>
                {pub.pdf_url && (
                  <a href={pub.pdf_url} target="_blank" rel="noopener noreferrer" className="btn-ghost py-1.5 text-sm justify-center">
                    <FileText className="w-3.5 h-3.5" /> Open PDF
                  </a>
                )}
                <button
                  onClick={() => remove(pub)}
                  disabled={deleting === pub.id}
                  className="py-1.5 text-sm justify-center rounded-xl font-medium inline-flex items-center gap-2 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                  {deleting === pub.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
