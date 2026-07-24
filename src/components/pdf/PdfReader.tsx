'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download,
  Loader2, AlertCircle, Maximize2, Minimize2, X, FileDown,
} from 'lucide-react';
import { parsePageRange, formatPageRange } from '@/lib/page-range';

interface Props {
  url: string;
  title?: string;
  /** Called once when a download completes, so the page can record it. */
  onDownload?: () => void;
}

type Mode = 'all' | 'current' | 'custom';

export default function PdfReader({ url, title, onDownload }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<any>(null);
  const bytesRef = useRef<ArrayBuffer | null>(null);
  const renderTaskRef = useRef<any>(null);

  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('all');
  const [customRange, setCustomRange] = useState('');
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  // Load the document once.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Could not fetch the document (${res.status})`);
        const buffer = await res.arrayBuffer();
        if (cancelled) return;
        bytesRef.current = buffer;

        const doc = await pdfjs.getDocument({ data: buffer.slice(0) }).promise;
        if (cancelled) return;

        docRef.current = doc;
        setNumPages(doc.numPages);
        setPage(1);
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'This document could not be opened');
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [url]);

  // Render the current page.
  const render = useCallback(async () => {
    const doc = docRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas) return;

    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch { /* already gone */ }
    }

    const pdfPage = await doc.getPage(page);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Fit the width of the container so the reader works on a phone.
    const available = (containerRef.current?.clientWidth || 800) - 24;
    const base = pdfPage.getViewport({ scale: 1 });
    const fitScale = available / base.width;
    const viewport = pdfPage.getViewport({ scale: fitScale * scale });

    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    renderTaskRef.current = pdfPage.render({ canvasContext: ctx, viewport });
    try {
      await renderTaskRef.current.promise;
    } catch {
      /* superseded by a newer render */
    }
  }, [page, scale]);

  useEffect(() => { if (!loading && !error) render(); }, [render, loading, error]);

  useEffect(() => {
    const onResize = () => render();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [render]);

  // Keyboard paging.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (pickerOpen) return;
      if (e.key === 'ArrowRight') setPage((p) => Math.min(p + 1, numPages));
      if (e.key === 'ArrowLeft') setPage((p) => Math.max(p - 1, 1));
      if (e.key === 'Escape' && expanded) setExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [numPages, pickerOpen, expanded]);

  const selectedPages = (): number[] => {
    if (mode === 'all') return Array.from({ length: numPages }, (_, i) => i + 1);
    if (mode === 'current') return [page];
    return parsePageRange(customRange, numPages).pages;
  };

  const download = async () => {
    setRangeError(null);

    if (mode === 'custom') {
      const { error: err } = parsePageRange(customRange, numPages);
      if (err) { setRangeError(err); return; }
    }

    const pages = selectedPages();
    if (!pages.length) { setRangeError('No pages selected'); return; }

    setWorking(true);
    try {
      const safeTitle = (title || 'document')
        .replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 60).toLowerCase();

      let blob: Blob;
      let filename: string;

      if (pages.length === numPages) {
        blob = new Blob([bytesRef.current!.slice(0)], { type: 'application/pdf' });
        filename = `${safeTitle}.pdf`;
      } else {
        // Extract only the chosen pages, in the browser, with no server round trip.
        const { PDFDocument } = await import('pdf-lib');
        const source = await PDFDocument.load(bytesRef.current!.slice(0));
        const out = await PDFDocument.create();
        const copied = await out.copyPages(source, pages.map((p) => p - 1));
        copied.forEach((p) => out.addPage(p));
        const bytes = await out.save();
        // Copy into a plain ArrayBuffer so the Blob constructor is satisfied.
        const buf = new ArrayBuffer(bytes.byteLength);
        new Uint8Array(buf).set(bytes);
        blob = new Blob([buf], { type: 'application/pdf' });
        filename = `${safeTitle}-p${formatPageRange(pages).replace(/[,\s]+/g, '_')}.pdf`;
      }

      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);

      onDownload?.();
      setPickerOpen(false);
    } catch (e) {
      setRangeError(e instanceof Error ? e.message : 'The download failed');
    } finally {
      setWorking(false);
    }
  };

  const preview = mode === 'custom' && customRange
    ? parsePageRange(customRange, numPages)
    : null;

  if (error) {
    return (
      <div className="card p-10 text-center">
        <AlertCircle className="w-9 h-9 mx-auto mb-3 text-red-500/60" />
        <p className="font-sans text-navy-700 mb-1">This document could not be opened</p>
        <p className="font-sans text-sm text-navy-400 mb-5">{error}</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn-outline inline-flex">
          <Download className="w-4 h-4" /> Download instead
        </a>
      </div>
    );
  }

  return (
    <div className={expanded
      ? 'fixed inset-0 z-50 bg-navy-950 flex flex-col'
      : 'rounded-2xl border border-parchment-300 bg-white overflow-hidden'}>

      {/* Toolbar */}
      <div className={`flex items-center gap-2 px-3 py-2.5 border-b ${
        expanded ? 'bg-navy-900 border-navy-800' : 'bg-parchment-100 border-parchment-200'
      }`}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page <= 1 || loading}
            aria-label="Previous page"
            className={`w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-30 transition-colors ${
              expanded ? 'text-parchment-200 hover:bg-navy-800' : 'text-navy-700 hover:bg-parchment-200'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className={`flex items-center gap-1.5 text-sm font-sans ${
            expanded ? 'text-parchment-200' : 'text-navy-700'
          }`}>
            <input
              type="number"
              min={1}
              max={numPages || 1}
              value={page}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!Number.isNaN(v) && v >= 1 && v <= numPages) setPage(v);
              }}
              aria-label="Page number"
              className={`w-12 text-center rounded-md py-1 font-mono text-sm border ${
                expanded
                  ? 'bg-navy-800 border-navy-700 text-parchment-100'
                  : 'bg-white border-parchment-300 text-navy-800'
              }`}
            />
            <span className="opacity-60">of {numPages || '-'}</span>
          </div>

          <button
            onClick={() => setPage((p) => Math.min(p + 1, numPages))}
            disabled={page >= numPages || loading}
            aria-label="Next page"
            className={`w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-30 transition-colors ${
              expanded ? 'text-parchment-200 hover:bg-navy-800' : 'text-navy-700 hover:bg-parchment-200'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setScale((s) => Math.max(0.6, +(s - 0.2).toFixed(2)))}
            aria-label="Zoom out"
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              expanded ? 'text-parchment-200 hover:bg-navy-800' : 'text-navy-700 hover:bg-parchment-200'
            }`}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className={`text-xs font-mono w-10 text-center ${
            expanded ? 'text-parchment-400' : 'text-navy-500'
          }`}>
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(3, +(s + 0.2).toFixed(2)))}
            aria-label="Zoom in"
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              expanded ? 'text-parchment-200 hover:bg-navy-800' : 'text-navy-700 hover:bg-parchment-200'
            }`}
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Exit full screen' : 'Full screen'}
            className={`w-9 h-9 rounded-lg items-center justify-center transition-colors hidden sm:flex ${
              expanded ? 'text-parchment-200 hover:bg-navy-800' : 'text-navy-700 hover:bg-parchment-200'
            }`}
          >
            {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setPickerOpen(true)}
            disabled={loading}
            className="btn-primary py-1.5 px-3 text-sm ml-1 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>

      {/* Page canvas */}
      <div
        ref={containerRef}
        className={`overflow-auto flex justify-center p-3 ${
          expanded ? 'flex-1 bg-navy-950' : 'bg-parchment-200/50 max-h-[75vh]'
        }`}
      >
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className={`w-7 h-7 mx-auto mb-3 animate-spin ${
              expanded ? 'text-parchment-400' : 'text-navy-400'
            }`} />
            <p className={`font-sans text-sm ${expanded ? 'text-parchment-400' : 'text-navy-500'}`}>
              Loading document
            </p>
          </div>
        ) : (
          <canvas ref={canvasRef} className="shadow-lg rounded-sm max-w-full h-auto" />
        )}
      </div>

      {/* Download picker */}
      {pickerOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-navy-950/60 backdrop-blur-sm p-0 sm:p-6">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6 shadow-2xl sheet-enter">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-serif text-xl text-navy-900">Download</h3>
                <p className="font-sans text-sm text-navy-500 mt-0.5">
                  {numPages} page{numPages === 1 ? '' : 's'} available
                </p>
              </div>
              <button
                onClick={() => setPickerOpen(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-navy-400 hover:bg-parchment-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 mb-5">
              {([
                ['all', 'All pages', `Every page, 1 to ${numPages}`],
                ['current', 'This page only', `Page ${page}`],
                ['custom', 'Selected pages', 'Choose pages and ranges'],
              ] as const).map(([value, label, hint]) => (
                <button
                  key={value}
                  onClick={() => { setMode(value); setRangeError(null); }}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    mode === value ? 'border-gold-500 bg-gold-50' : 'border-parchment-300 hover:border-navy-300'
                  }`}
                >
                  <p className="font-sans font-semibold text-navy-900 text-sm">{label}</p>
                  <p className="font-sans text-xs text-navy-500 mt-0.5">{hint}</p>
                </button>
              ))}
            </div>

            {mode === 'custom' && (
              <div className="mb-5">
                <label className="block font-sans text-sm font-medium text-navy-800 mb-1.5">
                  Pages
                </label>
                <input
                  value={customRange}
                  onChange={(e) => { setCustomRange(e.target.value); setRangeError(null); }}
                  placeholder="1-3, 7, 11-14"
                  className="input-base font-mono"
                  autoFocus
                />
                <p className="font-sans text-xs text-navy-400 mt-2">
                  Separate with commas. Use a hyphen for a range.
                </p>
                {preview && !preview.error && (
                  <p className="font-sans text-xs text-green-700 mt-2">
                    {preview.pages.length} page{preview.pages.length === 1 ? '' : 's'} selected:{' '}
                    {formatPageRange(preview.pages)}
                  </p>
                )}
              </div>
            )}

            {rangeError && (
              <p className="font-sans text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                {rangeError}
              </p>
            )}

            <button
              onClick={download}
              disabled={working}
              className="btn-primary w-full justify-center py-3 disabled:opacity-60"
            >
              {working
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing</>
                : <><FileDown className="w-4 h-4" /> Download PDF</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
