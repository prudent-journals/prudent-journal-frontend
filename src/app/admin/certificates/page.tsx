'use client';

import Link from 'next/link';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Award, Users, FileCheck, BookOpen, Loader2, Send, RefreshCw,
  CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, Settings,
} from 'lucide-react';
import { certificatesApi, conferencesApi } from '@/lib/api';
import { Certificate, CertificateKind, CertificatePreview, Conference } from '@/types';
import { formatDate, getErrorMessage } from '@/lib/utils';

const KIND_META: Record<CertificateKind, { label: string; blurb: string; icon: typeof Award }> = {
  attendance: {
    label: 'Attendance',
    blurb: 'Every confirmed registrant of the conference',
    icon: Users,
  },
  presentation: {
    label: 'Presentation',
    blurb: 'Authors whose conference paper reached published status',
    icon: FileCheck,
  },
  publication: {
    label: 'Publication',
    blurb: 'Authors published in the journal',
    icon: BookOpen,
  },
};

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-gold-100 text-gold-700',
  approved: 'bg-blue-100 text-blue-700',
  sent: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export default function AdminCertificatesPage() {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [conferenceId, setConferenceId] = useState<number | 'journal'>('journal');
  const [preview, setPreview] = useState<CertificatePreview | null>(null);
  const [issued, setIssued] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [scopeReady, setScopeReady] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    conferencesApi.list()
      .then((r) => {
        setConferences(r.data);
        if (r.data.length) setConferenceId(r.data[0].id);
      })
      .catch(() => setConferences([]))
      .finally(() => setScopeReady(true));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const scope = conferenceId === 'journal' ? undefined : conferenceId;
    const [p, c] = await Promise.allSettled([
      certificatesApi.preview(scope),
      certificatesApi.list(scope),
    ]);
    if (p.status === 'fulfilled') setPreview(p.value.data);
    if (c.status === 'fulfilled') setIssued(c.value.data);
    setLoading(false);
  }, [conferenceId]);

  useEffect(() => { if (scopeReady) load(); }, [load, scopeReady]);

  const generate = async () => {
    setBusy('generate');
    try {
      const kinds: CertificateKind[] = conferenceId === 'journal'
        ? ['publication']
        : ['attendance', 'presentation'];
      const { data } = await certificatesApi.generate(
        conferenceId === 'journal' ? undefined : conferenceId,
        kinds,
      );
      toast.success(
        data.length
          ? `${data.length} certificate${data.length === 1 ? '' : 's'} prepared for approval`
          : 'Everyone eligible already has a certificate',
      );
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const approveAll = async () => {
    const drafts = issued.filter((c) => c.status === 'draft').map((c) => c.id);
    if (!drafts.length) return;
    setBusy('approve');
    try {
      const { data } = await certificatesApi.approve(drafts);
      toast.success(data.message);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const kindsForScope: CertificateKind[] = conferenceId === 'journal'
    ? ['publication']
    : ['attendance', 'presentation'];

  const scopedItems = kindsForScope.flatMap((k) => preview?.[k] || []);
  const readyToPrepare = scopedItems.filter((i) => !i.already_issued).length;

  const draftCount = issued.filter((c) => c.status === 'draft').length;
  const sentCount = issued.filter((c) => c.status === 'sent').length;
  const failedCount = issued.filter((c) => c.status === 'failed').length;

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <header className="mb-8">
        <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-2">
          Administration
        </p>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-navy-900">Certificates</h1>
            <p className="text-navy-500 font-sans mt-2 max-w-2xl">
              Certificates are prepared automatically for everyone eligible. Nothing reaches a
              recipient until you approve the batch.
            </p>
          </div>
          <Link href="/admin/certificates/setup" className="btn-outline flex-shrink-0">
            <Settings className="w-4 h-4" /> Artwork &amp; signatories
          </Link>
        </div>
      </header>

      {/* Scope */}
      <div className="card p-5 mb-6">
        <label className="block font-sans text-sm font-medium text-navy-800 mb-2">
          Issue certificates for
        </label>
        <select
          value={conferenceId}
          onChange={(e) => setConferenceId(e.target.value === 'journal' ? 'journal' : Number(e.target.value))}
          className="input-base"
        >
          {conferences.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
          <option value="journal">Journal publications (all published articles)</option>
        </select>
      </div>

      {/* What would be issued */}
      <section className="mb-8">
        <h2 className="font-serif text-xl text-navy-900 mb-4">Who is eligible</h2>

        {loading ? (
          <div className="card p-10 text-center text-navy-400 font-sans text-sm">Loading</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {kindsForScope.map((kind) => {
              const meta = KIND_META[kind];
              const Icon = meta.icon;
              const items = (preview?.[kind] || []);
              const fresh = items.filter((i) => !i.already_issued).length;
              return (
                <div key={kind} className="card p-5">
                  <div className="w-10 h-10 rounded-xl bg-navy-50 text-navy-700 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-lg text-navy-900">{meta.label}</h3>
                  <p className="font-sans text-xs text-navy-500 leading-relaxed mt-1 mb-3">
                    {meta.blurb}
                  </p>
                  <p className="font-display text-3xl text-navy-900 tabular-figures">{items.length}</p>
                  <p className="font-sans text-xs text-navy-400 mt-1">
                    {fresh} awaiting preparation, {items.length - fresh} already issued
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {readyToPrepare > 0 && (
          <div className="mt-4 rounded-2xl border-2 border-gold-300 bg-gold-50 p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-sans font-semibold text-navy-900">
                {readyToPrepare} certificate{readyToPrepare === 1 ? '' : 's'} ready to prepare
              </p>
              <p className="font-sans text-sm text-navy-600 mt-0.5">
                They will be generated as drafts. Nothing is sent yet.
              </p>
            </div>
            <button onClick={generate} disabled={busy !== null} className="btn-primary disabled:opacity-60">
              {busy === 'generate'
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing</>
                : <><RefreshCw className="w-4 h-4" /> Prepare certificates</>}
            </button>
          </div>
        )}

        {preview && readyToPrepare === 0 && !loading && (
          <p className="mt-4 font-sans text-sm text-navy-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Everyone eligible already has a certificate.
          </p>
        )}
      </section>

      {/* Approval gate */}
      {draftCount > 0 && (
        <section className="mb-8">
          <div className="rounded-2xl border-2 border-navy-800 bg-navy-900 p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-4">
              <ShieldCheck className="w-6 h-6 text-gold-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-serif text-lg text-parchment-50">
                  {draftCount} certificate{draftCount === 1 ? '' : 's'} awaiting your approval
                </p>
                <p className="font-sans text-sm text-parchment-300 mt-1 max-w-lg leading-relaxed">
                  Check the list below. Approving sends each certificate to its recipient by
                  email and makes it available in their dashboard.
                </p>
              </div>
            </div>
            <button onClick={approveAll} disabled={busy !== null} className="btn-gold disabled:opacity-60">
              {busy === 'approve'
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending</>
                : <><Send className="w-4 h-4" /> Approve and send all</>}
            </button>
          </div>
        </section>
      )}

      {/* Register */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <h2 className="font-serif text-xl text-navy-900">Certificate register</h2>
          <div className="flex gap-2 font-sans text-xs">
            {draftCount > 0 && <span className="badge bg-gold-100 text-gold-700">{draftCount} draft</span>}
            {sentCount > 0 && <span className="badge bg-green-100 text-green-700">{sentCount} sent</span>}
            {failedCount > 0 && <span className="badge bg-red-100 text-red-700">{failedCount} failed</span>}
          </div>
        </div>

        {issued.length === 0 ? (
          <div className="card p-12 text-center">
            <Award className="w-10 h-10 mx-auto mb-3 text-navy-200" />
            <p className="font-sans text-navy-600">No certificates issued for this selection yet.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead className="bg-parchment-100 border-b border-parchment-200">
                  <tr className="text-left text-navy-500">
                    <th className="px-5 py-3 font-medium">Recipient</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Reference</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Issued</th>
                    <th className="px-5 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-parchment-200">
                  {issued.map((cert) => (
                    <tr key={cert.id} className="hover:bg-parchment-50">
                      <td className="px-5 py-3">
                        <p className="text-navy-900 font-medium">{cert.recipient_name}</p>
                        <p className="text-navy-400 text-xs">{cert.recipient_email}</p>
                        {cert.subject_title && (
                          <p className="text-navy-400 text-xs mt-0.5 max-w-xs truncate">
                            {cert.subject_title}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-navy-600 capitalize">{cert.kind}</td>
                      <td className="px-5 py-3 font-mono text-xs text-navy-600">{cert.reference}</td>
                      <td className="px-5 py-3">
                        <span className={`badge ${STATUS_STYLE[cert.status] || 'bg-parchment-200 text-navy-600'}`}>
                          {cert.status}
                        </span>
                        {cert.error && (
                          <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {cert.error.slice(0, 60)}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-navy-500 text-xs">
                        {cert.sent_at ? formatDate(cert.sent_at) : formatDate(cert.created_at)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {cert.pdf_url && (
                          <a
                            href={cert.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-navy-600 hover:text-gold-700 text-xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> View
                          </a>
                        )}
                      </td>
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
