'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Calendar, Plus, X, MapPin, Users, ExternalLink } from 'lucide-react';
import { conferencesApi } from '@/lib/api';
import {
  Conference, ConferenceStatus, RegistrantCategory, REGISTRANT_CATEGORIES,
} from '@/types';
import { formatDate, getErrorMessage } from '@/lib/utils';

const schema = z.object({
  title: z.string().min(6, 'Give the conference a title'),
  description: z.string().min(20, 'Describe the conference in a sentence or two'),
  theme: z.string().optional(),
  venue: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  submission_deadline: z.string().optional(),
  registration_deadline: z.string().optional(),
  currency: z.string().optional(),
  payment_instructions: z.string().optional(),
  payment_proof_email: z.string().email('Enter a valid email address').or(z.literal('')).optional(),
  status: z.enum(['upcoming', 'open', 'closed', 'completed']),
});

type FormValues = z.infer<typeof schema>;

const STATUS_STYLE: Record<ConferenceStatus, string> = {
  upcoming: 'bg-blue-100 text-blue-700',
  open: 'bg-green-100 text-green-700',
  closed: 'bg-parchment-300 text-navy-600',
  completed: 'bg-navy-100 text-navy-700',
};

const toIso = (v?: string) => (v ? new Date(v).toISOString() : undefined);

export default function AdminConferencesPage() {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Fee per registrant category. A category left blank is not offered on the
  // public registration form at all, which is how an organiser restricts who
  // may attend.
  const [fees, setFees] = useState<Partial<Record<RegistrantCategory, string>>>({});

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { status: 'upcoming', currency: 'NGN' },
    });

  const load = () =>
    conferencesApi.list()
      .then((r) => setConferences(r.data))
      .catch(() => setConferences([]))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const onSubmit = async (values: FormValues) => {
    // Drop blank amounts so an unpriced category is simply absent.
    const registration_fees = Object.fromEntries(
      Object.entries(fees).filter(([, amount]) => amount && amount.trim()),
    );
    try {
      await conferencesApi.create({
        ...values,
        payment_proof_email: values.payment_proof_email || undefined,
        registration_fees,
        start_date: toIso(values.start_date),
        end_date: toIso(values.end_date),
        submission_deadline: toIso(values.submission_deadline),
        registration_deadline: toIso(values.registration_deadline),
      });
      toast.success('Conference created');
      reset({ status: 'upcoming', currency: 'NGN' });
      setFees({});
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const changeStatus = async (conf: Conference, status: ConferenceStatus) => {
    try {
      await conferencesApi.update(conf.id, { status });
      toast.success(`Status set to ${status}`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <header className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-2">Administration</p>
          <h1 className="font-serif text-3xl text-navy-900">Conferences</h1>
          <p className="text-navy-500 font-sans mt-2">
            Create events, control whether registration is open, and review who has registered.
          </p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
          {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Conference</>}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 mb-8 space-y-5">
          <h2 className="font-serif text-xl text-navy-900">New conference</h2>

          <div>
            <label className="block font-sans text-sm font-medium text-navy-800 mb-1.5">Title</label>
            <input {...register('title')} className="input-base" placeholder="7th National Conference on ..." />
            {errors.title && <p className="text-red-600 text-sm font-sans mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block font-sans text-sm font-medium text-navy-800 mb-1.5">Description</label>
            <textarea {...register('description')} rows={3} className="input-base resize-y" />
            {errors.description && <p className="text-red-600 text-sm font-sans mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block font-sans text-sm font-medium text-navy-800 mb-1.5">Theme</label>
            <textarea {...register('theme')} rows={2} className="input-base resize-y" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-sm font-medium text-navy-800 mb-1.5">Venue</label>
              <input {...register('venue')} className="input-base" />
            </div>
            <div>
              <label className="block font-sans text-sm font-medium text-navy-800 mb-1.5">Currency</label>
              <input {...register('currency')} className="input-base" placeholder="NGN" />
            </div>
            <div>
              <label className="block font-sans text-sm font-medium text-navy-800 mb-1.5">Starts</label>
              <input type="date" {...register('start_date')} className="input-base" />
            </div>
            <div>
              <label className="block font-sans text-sm font-medium text-navy-800 mb-1.5">Ends</label>
              <input type="date" {...register('end_date')} className="input-base" />
            </div>
            <div>
              <label className="block font-sans text-sm font-medium text-navy-800 mb-1.5">Submission deadline</label>
              <input type="date" {...register('submission_deadline')} className="input-base" />
            </div>
            <div>
              <label className="block font-sans text-sm font-medium text-navy-800 mb-1.5">Registration deadline</label>
              <input type="date" {...register('registration_deadline')} className="input-base" />
            </div>
          </div>

          {/* Fees drive the public form: a category with no amount is not offered. */}
          <fieldset className="rounded-2xl border border-parchment-300 p-5 bg-parchment-50">
            <legend className="px-2 font-sans text-sm font-semibold text-navy-800">
              Registration fees by category
            </legend>
            <p className="font-sans text-xs text-navy-500 mb-4">
              Set an amount for every category you want to admit. Leave one blank and it
              will not appear on the registration form. Enter <strong>0</strong> for a
              category that attends free.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {REGISTRANT_CATEGORIES.map(({ value, label, hint }) => (
                <div key={value} className="min-w-0">
                  <label
                    htmlFor={`fee-${value}`}
                    className="block font-sans text-sm font-medium text-navy-800"
                  >
                    {label}
                  </label>
                  <span className="block font-sans text-xs text-navy-400 mb-1.5">{hint}</span>
                  <input
                    id={`fee-${value}`}
                    inputMode="numeric"
                    value={fees[value] ?? ''}
                    onChange={(e) => setFees((f) => ({ ...f, [value]: e.target.value }))}
                    className="input-base"
                    placeholder="e.g. 25000"
                  />
                </div>
              ))}
            </div>
          </fieldset>

          <div>
            <label className="block font-sans text-sm font-medium text-navy-800 mb-1.5">
              Payment terms
            </label>
            <textarea
              {...register('payment_instructions')}
              rows={4}
              className="input-base resize-y"
              placeholder={'Bank: ...\nAccount name: ...\nAccount number: ...\nPayment is due within 14 days of registering.'}
            />
            <p className="font-sans text-xs text-navy-500 mt-1">
              Included verbatim in the confirmation email whenever a fee applies.
            </p>
          </div>

          <div>
            <label className="block font-sans text-sm font-medium text-navy-800 mb-1.5">
              Send proof of payment to
            </label>
            <input
              {...register('payment_proof_email')}
              type="email"
              className="input-base"
              placeholder="payments@prudentjournals.com"
            />
            {errors.payment_proof_email && (
              <p className="text-red-600 text-sm font-sans mt-1">{errors.payment_proof_email.message}</p>
            )}
          </div>

          <div>
            <label className="block font-sans text-sm font-medium text-navy-800 mb-1.5">Status</label>
            <select {...register('status')} className="input-base">
              <option value="upcoming">Upcoming, not yet open</option>
              <option value="open">Open for registration</option>
              <option value="closed">Closed</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary px-8 py-3 disabled:opacity-60">
            {isSubmitting ? 'Creating' : 'Create conference'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="card p-10 text-center text-navy-400 font-sans text-sm">Loading</div>
      ) : conferences.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-navy-200" />
          <p className="font-sans text-navy-600">No conferences yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {conferences.map((conf) => (
            <div key={conf.id} className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge ${STATUS_STYLE[conf.status]}`}>{conf.status}</span>
                  </div>
                  <h3 className="font-serif text-lg text-navy-900 leading-snug mb-2">{conf.title}</h3>
                  {conf.theme && (
                    <p className="font-sans text-sm text-navy-500 leading-relaxed mb-3">{conf.theme}</p>
                  )}
                  <div className="flex flex-wrap gap-4 font-sans text-xs text-navy-400">
                    {conf.venue && <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {conf.venue}</span>}
                    {conf.start_date && <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(conf.start_date)}</span>}
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-stretch">
                  <select
                    value={conf.status}
                    onChange={(e) => changeStatus(conf, e.target.value as ConferenceStatus)}
                    className="input-base py-1.5 text-sm"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="completed">Completed</option>
                  </select>
                  <Link href={`/admin/conferences/${conf.id}`} className="btn-outline py-1.5 text-sm justify-center">
                    <Users className="w-3.5 h-3.5" /> Registrations
                  </Link>
                  <Link href={`/conferences/${conf.id}`} target="_blank" className="btn-ghost py-1.5 text-sm justify-center">
                    <ExternalLink className="w-3.5 h-3.5" /> View public page
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
