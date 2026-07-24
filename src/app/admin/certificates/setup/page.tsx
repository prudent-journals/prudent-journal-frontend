'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Upload, Loader2, Plus, Trash2, Eye, EyeOff, PenLine,
  Image as ImageIcon, GripVertical, ExternalLink, Save, X,
} from 'lucide-react';
import { certificatesApi } from '@/lib/api';
import { CertificateTemplate, CertificateSignatory, CertificateKind } from '@/types';
import { getErrorMessage } from '@/lib/utils';

const KINDS: { key: CertificateKind; label: string }[] = [
  { key: 'attendance', label: 'Attendance' },
  { key: 'presentation', label: 'Presentation' },
  { key: 'publication', label: 'Publication' },
];

const KIND_LABEL: Record<CertificateKind, string> = {
  attendance: 'Attendance',
  presentation: 'Presentation',
  publication: 'Publication',
};

export default function CertificateSetupPage() {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [signatories, setSignatories] = useState<CertificateSignatory[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [t, s] = await Promise.allSettled([
      certificatesApi.templates(),
      certificatesApi.signatories(),
    ]);
    if (t.status === 'fulfilled') setTemplates(t.value.data);
    if (s.status === 'fulfilled') setSignatories(s.value.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ---- Templates --------------------------------------------------------
  const uploadTemplate = async (kind: CertificateKind, file: File) => {
    setBusy(`tmpl-${kind}`);
    try {
      await certificatesApi.uploadTemplate(kind, file);
      toast.success(`${KIND_LABEL[kind]} artwork updated`);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const setBand = async (kind: CertificateKind, bandY: number) => {
    try {
      await certificatesApi.uploadTemplate(kind, null, bandY);
      setTemplates((list) => list.map((t) => (t.kind === kind ? { ...t, signatory_band_y: bandY } : t)));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // ---- Signatories ------------------------------------------------------
  const addSignatory = async () => {
    setBusy('add');
    try {
      await certificatesApi.createSignatory({
        name: 'New signatory',
        title: '',
        applies_to: [],
        display_order: signatories.length,
        is_active: true,
      });
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl">
      <Link href="/admin/certificates" className="inline-flex items-center gap-2 text-sm text-navy-500 hover:text-navy-800 font-sans mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to certificates
      </Link>

      <header className="mb-8">
        <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-2">Administration</p>
        <h1 className="font-serif text-3xl text-navy-900">Certificate Setup</h1>
        <p className="text-navy-500 font-sans mt-2 max-w-2xl">
          Manage the artwork and the dignitaries who sign. Names and signatures are added
          at generation time, so a change of office holder never needs new artwork. Upload
          artwork with the signatory area left blank.
        </p>
      </header>

      {loading ? (
        <div className="card p-16 text-center text-navy-400 font-sans text-sm">
          <Loader2 className="w-7 h-7 mx-auto mb-3 animate-spin" /> Loading
        </div>
      ) : (
        <>
          {/* Templates */}
          <section className="mb-12">
            <h2 className="font-serif text-xl text-navy-900 mb-4">Artwork</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {KINDS.map(({ key, label }) => {
                const tmpl = templates.find((t) => t.kind === key);
                return (
                  <div key={key} className="card p-5">
                    <h3 className="font-serif text-lg text-navy-900 mb-1">{label}</h3>
                    <div className="aspect-[1.4/1] rounded-xl border border-parchment-200 bg-parchment-100 overflow-hidden mb-3 flex items-center justify-center">
                      {tmpl?.background_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={tmpl.background_url} alt={`${label} artwork`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center text-navy-400 p-4">
                          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="font-sans text-xs">Using the bundled artwork</p>
                        </div>
                      )}
                    </div>

                    <TemplateUpload
                      kind={key}
                      busy={busy === `tmpl-${key}`}
                      onUpload={(f) => uploadTemplate(key, f)}
                    />

                    <div className="mt-3">
                      <label className="block font-sans text-[11px] text-navy-500 mb-1">
                        Signatory height ({Math.round((tmpl?.signatory_band_y ?? 0.86) * 100)}%)
                      </label>
                      <input
                        type="range" min={0.6} max={0.95} step={0.01}
                        defaultValue={tmpl?.signatory_band_y ?? 0.86}
                        onChange={(e) => setBand(key, parseFloat(e.target.value))}
                        className="w-full accent-gold-600"
                      />
                    </div>

                    <a
                      href={certificatesApi.sampleUrl(key)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline w-full justify-center py-1.5 text-sm mt-3"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview sample
                    </a>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Signatories */}
          <section>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-serif text-xl text-navy-900">Signatories</h2>
                <p className="font-sans text-sm text-navy-500 mt-0.5">
                  Shown left to right in order. Leave the certificate types empty to appear on all.
                </p>
              </div>
              <button onClick={addSignatory} disabled={busy === 'add'} className="btn-primary disabled:opacity-60">
                {busy === 'add' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add signatory
              </button>
            </div>

            {signatories.length === 0 ? (
              <div className="card p-12 text-center">
                <PenLine className="w-10 h-10 mx-auto mb-3 text-navy-200" />
                <p className="font-sans text-navy-600">No signatories yet.</p>
                <p className="font-sans text-sm text-navy-400 mt-1">
                  Add the dignitaries who sign the certificates.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {signatories.map((sig) => (
                  <SignatoryRow key={sig.id} signatory={sig} onChanged={load} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function TemplateUpload({ kind, busy, onUpload }: {
  kind: string; busy: boolean; onUpload: (f: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ''; }}
      />
      <button onClick={() => ref.current?.click()} disabled={busy}
        className="btn-primary w-full justify-center py-1.5 text-sm disabled:opacity-60">
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        Upload artwork
      </button>
    </>
  );
}

const ALL_KINDS: CertificateKind[] = ['attendance', 'presentation', 'publication'];

function SignatoryRow({ signatory, onChanged }: {
  signatory: CertificateSignatory; onChanged: () => void;
}) {
  const [name, setName] = useState(signatory.name);
  const [title, setTitle] = useState(signatory.title || '');
  const [order, setOrder] = useState(signatory.display_order);
  const [applies, setApplies] = useState<CertificateKind[]>(signatory.applies_to || []);
  const [active, setActive] = useState(signatory.is_active);
  const [saving, setSaving] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);
  const sigRef = useRef<HTMLInputElement>(null);

  const dirty =
    name !== signatory.name ||
    title !== (signatory.title || '') ||
    order !== signatory.display_order ||
    active !== signatory.is_active ||
    JSON.stringify(applies.sort()) !== JSON.stringify([...(signatory.applies_to || [])].sort());

  const save = async () => {
    setSaving(true);
    try {
      await certificatesApi.updateSignatory(signatory.id, {
        name, title, display_order: order, is_active: active, applies_to: applies,
      });
      toast.success('Saved');
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const uploadSig = async (file: File) => {
    setUploadingSig(true);
    try {
      await certificatesApi.uploadSignature(signatory.id, file);
      toast.success('Signature uploaded');
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploadingSig(false);
    }
  };

  const remove = async () => {
    try {
      await certificatesApi.deleteSignatory(signatory.id);
      toast.success('Removed');
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const toggleKind = (k: CertificateKind) => {
    setApplies((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));
  };

  return (
    <div className="card p-5">
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Signature preview */}
        <div className="flex-shrink-0">
          <div className="w-40 h-24 rounded-xl border border-parchment-200 bg-white flex items-center justify-center overflow-hidden">
            {signatory.signature_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={signatory.signature_url} alt="Signature" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="font-sans text-xs text-navy-400">No signature</span>
            )}
          </div>
          <input
            ref={sigRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadSig(f); e.target.value = ''; }}
          />
          <button
            onClick={() => sigRef.current?.click()}
            disabled={uploadingSig}
            className="btn-outline w-40 justify-center py-1.5 text-xs mt-2 disabled:opacity-60"
          >
            {uploadingSig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PenLine className="w-3.5 h-3.5" />}
            {signatory.signature_url ? 'Replace' : 'Upload signature'}
          </button>
          <p className="font-sans text-[10px] text-navy-400 mt-1.5 w-40 leading-tight">
            PNG with a transparent background works best.
          </p>
        </div>

        {/* Fields */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-sans text-[11px] text-navy-500 mb-1">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input-base py-2 text-sm" />
            </div>
            <div>
              <label className="block font-sans text-[11px] text-navy-500 mb-1">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chairman, Organizing Committee" className="input-base py-2 text-sm" />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block font-sans text-[11px] text-navy-500 mb-1">Appears on</label>
              <div className="flex gap-1.5">
                {ALL_KINDS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => toggleKind(k)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-sans capitalize transition-colors ${
                      applies.length === 0 || applies.includes(k)
                        ? 'bg-gold-100 text-gold-700 border border-gold-300'
                        : 'bg-parchment-100 text-navy-400 border border-parchment-300'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
              {applies.length === 0 && (
                <p className="font-sans text-[10px] text-navy-400 mt-1">All types</p>
              )}
            </div>

            <div>
              <label className="block font-sans text-[11px] text-navy-500 mb-1">Order</label>
              <input type="number" min={0} value={order}
                onChange={(e) => setOrder(parseInt(e.target.value || '0', 10))}
                className="input-base py-2 text-sm w-20" />
            </div>

            <button
              type="button"
              onClick={() => setActive((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-sans transition-colors ${
                active ? 'bg-green-50 text-green-700' : 'bg-parchment-100 text-navy-400'
              }`}
            >
              {active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {active ? 'Active' : 'Hidden'}
            </button>

            <div className="ml-auto flex items-center gap-2">
              {dirty && (
                <button onClick={save} disabled={saving} className="btn-primary py-2 text-sm disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              )}
              <button onClick={remove} aria-label="Remove signatory"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
