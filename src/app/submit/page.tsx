'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { papersApi, conferencesApi } from '@/lib/api';
import { Conference } from '@/types';
import { getErrorMessage, formatFileSize, cn } from '@/lib/utils';
import { MANUSCRIPT_ACCEPT, MANUSCRIPT_HINT, MAX_DOCUMENT_SIZE } from '@/lib/uploads';
import { useAuthStore } from '@/lib/auth-store';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import toast from 'react-hot-toast';

const schema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  abstract: z.string().min(100, 'Abstract must be at least 100 characters'),
  keywords: z.string().optional(),
  authors_str: z.string().optional(),
  paper_type: z.enum(['journal', 'conference']),
  conference_id: z.string().optional(),
  cover_letter: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function SubmitPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paper_type: 'journal' },
  });

  const paperType = watch('paper_type');

  useEffect(() => {
    conferencesApi.list().then(r => setConferences(r.data.filter((c: Conference) =>
      ['open', 'upcoming'].includes(c.status)
    ))).catch(() => {});
  }, []);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: MANUSCRIPT_ACCEPT,
    maxFiles: 1,
    maxSize: MAX_DOCUMENT_SIZE,
  });

  const onSubmit = async (data: FormData) => {
    if (!file) { toast.error('Please upload your paper as a Word document'); return; }

    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v) fd.append(k, v as string); });
    fd.append('file', file);

    try {
      await papersApi.submit(fd);
      setSubmitted(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-6 py-20 bg-parchment-50">
          <div className="w-full max-w-md text-center">
            <div className="w-14 h-14 rounded-2xl bg-navy-900 flex items-center justify-center mx-auto mb-6">
              <Upload className="w-7 h-7 text-gold-400" />
            </div>
            <h1 className="font-serif text-2xl text-navy-900 mb-3">Sign in to submit a paper</h1>
            <p className="font-sans text-navy-600 leading-relaxed mb-8">
              Submissions are tied to your account so you can track progress and respond
              to reviewer feedback. Creating an account is free.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/auth/login" className="btn-primary flex-1 justify-center py-3">
                Sign in
              </Link>
              <Link href="/auth/register" className="btn-outline flex-1 justify-center py-3">
                Create an account
              </Link>
            </div>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="font-serif text-3xl text-navy-900 mb-3">Submission Received!</h2>
            <p className="text-navy-500 font-sans mb-2">
              Your paper has been submitted successfully. You will receive a confirmation email shortly.
            </p>
            <p className="text-navy-400 font-sans text-sm mb-8">
              Our editorial team will review your submission and assign a reviewer. Track your status in the dashboard.
            </p>
            <div className="flex gap-3 justify-center">
              <a href="/dashboard/papers" className="btn-primary">Track Submission</a>
              <a href="/submit" onClick={() => setSubmitted(false)} className="btn-outline">Submit Another</a>
            </div>
          </div>
        </div>
        <Footer />
      <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-hero-gradient py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold-400 text-sm font-sans font-semibold uppercase tracking-widest mb-2">Author Portal</p>
          <h1 className="font-serif text-4xl text-parchment-50 mb-2">Submit Your Paper</h1>
          <p className="text-parchment-300 font-sans text-sm">
            Submit to the Prudent Journals or a specific conference. All submissions undergo peer review.
          </p>
        </div>
      </section>

      <main className="flex-1 py-10 px-6 bg-parchment-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-8">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 font-sans">
              <strong>Before submitting:</strong> Ensure your paper is anonymized (no author names in the document),
              formatted per the Prudent Journals guidelines, and saved as a Word document (.docx, max 100MB).
              The typeset PDF is produced by the editorial team once your paper is accepted.
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Paper Type */}
            <div className="card p-6">
              <h2 className="font-serif text-lg text-navy-900 mb-4">Submission Type</h2>
              <div className="grid grid-cols-2 gap-4">
                {(['journal', 'conference'] as const).map(type => (
                  <label
                    key={type}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                      paperType === type
                        ? 'border-gold-500 bg-gold-50'
                        : 'border-parchment-200 hover:border-parchment-300'
                    )}
                  >
                    <input {...register('paper_type')} type="radio" value={type} className="accent-gold-500" />
                    <div>
                      <p className="font-medium text-sm text-navy-900 capitalize">{type} Paper</p>
                      <p className="text-xs text-navy-500">
                        {type === 'journal' ? 'For the Prudent Journals' : 'Tied to a conference'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {paperType === 'conference' && conferences.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">Select Conference *</label>
                  <select {...register('conference_id')} className="input-base">
                    <option value="">Choose a conference...</option>
                    {conferences.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Paper Details */}
            <div className="card p-6 space-y-5">
              <h2 className="font-serif text-lg text-navy-900">Paper Details</h2>

              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">Title *</label>
                <input {...register('title')} placeholder="Full paper title as it should appear in publication" className="input-base" />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">
                  Abstract * <span className="text-navy-400 font-normal">(min. 100 characters)</span>
                </label>
                <textarea
                  {...register('abstract')}
                  rows={6}
                  placeholder="A concise summary of your research, methodology, findings, and conclusions..."
                  className="input-base resize-none"
                />
                {errors.abstract && <p className="text-red-500 text-xs mt-1">{errors.abstract.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">
                  Keywords <span className="text-navy-400 font-normal">(comma-separated)</span>
                </label>
                <input {...register('keywords')} placeholder="machine learning, data analysis, IoT, ..." className="input-base" />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">
                  Co-Authors <span className="text-navy-400 font-normal">(comma-separated, if any)</span>
                </label>
                <input {...register('authors_str')} placeholder="Dr. John Smith, Prof. Mary Jones, ..." className="input-base" />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">
                  Cover Letter <span className="text-navy-400 font-normal">(optional)</span>
                </label>
                <textarea
                  {...register('cover_letter')}
                  rows={4}
                  placeholder="Brief message to the editorial board..."
                  className="input-base resize-none"
                />
              </div>
            </div>

            {/* File Upload */}
            <div className="card p-6">
              <h2 className="font-serif text-lg text-navy-900 mb-4">Upload Manuscript</h2>
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all',
                  isDragActive
                    ? 'border-gold-400 bg-gold-50'
                    : file
                    ? 'border-green-400 bg-green-50'
                    : 'border-parchment-300 hover:border-gold-400 hover:bg-gold-50/30'
                )}
              >
                <input {...getInputProps()} />
                {file ? (
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-green-700">{file.name}</p>
                    <p className="text-xs text-green-600 mt-1">{formatFileSize(file.size)}</p>
                    <p className="text-xs text-navy-400 mt-2">Click or drag to replace</p>
                  </div>
                ) : (
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-parchment-200 flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6 text-navy-500" />
                    </div>
                    <p className="text-sm font-medium text-navy-700">
                      {isDragActive ? 'Drop your document here' : 'Drag & drop your Word document, or click to browse'}
                    </p>
                    <p className="text-xs text-navy-400 mt-1">{MANUSCRIPT_HINT}</p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !file}
              className="btn-gold w-full justify-center py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {isSubmitting ? 'Submitting...' : 'Submit Paper'}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
