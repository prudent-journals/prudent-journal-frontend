'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Users, ArrowLeft, CheckCircle, Loader2, FileText, Mail } from 'lucide-react';
import PdfReaderPanel from '@/components/pdf/PdfReaderPanel';
import { conferencesApi } from '@/lib/api';
import {
  Conference, Registration, RegistrantCategory,
  REGISTRANT_CATEGORIES, PERSON_TITLES,
} from '@/types';
import { formatDate, getErrorMessage } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import toast from 'react-hot-toast';

export default function ConferenceDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [conf, setConf] = useState<Conference | null>(null);
  const [myReg, setMyReg] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  // Attending does not require an account. A signed in visitor gets the form
  // pre-filled from their profile; everyone else simply fills it in.
  const [form, setForm] = useState({
    title: '', full_name: '', email: '', phone: '', institution: '',
    category: 'private' as RegistrantCategory, notes: '',
  });

  useEffect(() => {
    conferencesApi.get(parseInt(id as string)).then(r => setConf(r.data)).finally(() => setLoading(false));
    if (user) {
      conferencesApi.myRegistration(parseInt(id as string)).then(r => setMyReg(r.data)).catch(() => {});
    }
  }, [id, user]);

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      full_name: f.full_name || user.full_name || '',
      email: f.email || user.email || '',
      phone: f.phone || user.phone || '',
      institution: f.institution || user.institution || '',
    }));
  }, [user]);

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // The amount for the chosen category, falling back to the conference's single
  // fee when no per-category table has been configured.
  const feeTable = conf?.registration_fees || null;
  const hasFeeTable = !!feeTable && Object.keys(feeTable).length > 0;
  const selectedFee = hasFeeTable ? feeTable![form.category] : conf?.registration_fee;
  const currency = conf?.currency || 'NGN';

  // Per-category amounts are bare numbers and want the currency in front. The
  // legacy free-text fee is written by hand and usually already carries it, so
  // prefixing unconditionally would render "NGN NGN 25,000".
  const money = (amount?: string | null) => {
    if (!amount) return '';
    return /[a-z$€£₦]/i.test(amount) ? amount : `${currency} ${amount}`;
  };

  // Only offer categories the organiser actually priced.
  const offered = hasFeeTable
    ? REGISTRANT_CATEGORIES.filter((c) => feeTable![c.value] !== undefined)
    : REGISTRANT_CATEGORIES;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) {
      toast.error('Your name and email address are required');
      return;
    }
    setRegistering(true);
    try {
      const { data } = await conferencesApi.register(parseInt(id as string), {
        title: form.title || undefined,
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone || undefined,
        institution: form.institution || undefined,
        category: form.category,
        notes: form.notes || undefined,
      });
      setMyReg(data);
      toast.success('Registered. Check your email for confirmation.');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setRegistering(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-navy-400" />
      </div>
    </div>
  );

  if (!conf) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center text-navy-500">Conference not found.</div>
    </div>
  );

  const isOpen = conf.status === 'open';
  const canRegister = isOpen && !myReg;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-hero-gradient py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Link href="/conferences" className="inline-flex items-center gap-2 text-parchment-400 hover:text-gold-400 text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Conferences
          </Link>
          <span className={`badge mb-4 ${
            conf.status === 'open' ? 'bg-green-800/50 text-green-300' :
            conf.status === 'upcoming' ? 'bg-blue-800/50 text-blue-300' :
            'bg-navy-700 text-parchment-400'
          }`}>
            {conf.status.charAt(0).toUpperCase() + conf.status.slice(1)}
          </span>
          <h1 className="font-serif text-3xl lg:text-5xl text-parchment-50 mb-4">{conf.title}</h1>
          {conf.theme && <p className="text-gold-400 font-display text-xl italic">Theme: {conf.theme}</p>}
        </div>
      </section>

      <main className="flex-1 py-10 px-6 bg-parchment-50">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="font-serif text-xl text-navy-900 mb-4">About This Conference</h2>
              <p className="text-navy-600 font-sans leading-relaxed">{conf.description}</p>
            </div>

            {/* Key dates */}
            <div className="card p-6">
              <h2 className="font-serif text-xl text-navy-900 mb-4">Key Dates</h2>
              <div className="space-y-3">
                {[
                  { label: 'Conference Dates', value: conf.start_date ? `${formatDate(conf.start_date)}${conf.end_date ? ` - ${formatDate(conf.end_date)}` : ''}` : null, icon: Calendar },
                  { label: 'Submission Deadline', value: conf.submission_deadline ? formatDate(conf.submission_deadline) : null, icon: Clock },
                  { label: 'Registration Deadline', value: conf.registration_deadline ? formatDate(conf.registration_deadline) : null, icon: Users },
                ].filter(d => d.value).map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-parchment-50 border border-parchment-200">
                    <Icon className="w-5 h-5 text-gold-500" />
                    <div>
                      <p className="text-xs text-navy-400 font-sans">{label}</p>
                      <p className="text-sm font-medium text-navy-800">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Registration. Open to everyone, account or not. */}
            {canRegister && (
              <form id="register" onSubmit={handleRegister} className="card p-6 border-2 border-gold-200">
                <h2 className="font-serif text-xl text-navy-900 mb-1">Register to attend</h2>
                <p className="font-sans text-sm text-navy-500 mb-5">
                  You do not need an account. Fill in the form and we will email your
                  confirmation, the fee for your category and how to pay.
                  {!user && (
                    <> Already have an account?{' '}
                      <Link href="/auth/login" className="text-gold-700 underline">Sign in</Link>{' '}
                      to have your certificate appear on your dashboard too.
                    </>
                  )}
                </p>

                <div className="space-y-4">
                  <div className="grid sm:grid-cols-[7rem_1fr] gap-4">
                    <div>
                      <label htmlFor="reg-title" className="block font-sans text-sm font-medium text-navy-800 mb-1.5">Title</label>
                      <select id="reg-title" value={form.title} onChange={set('title')} className="input-base">
                        <option value="">None</option>
                        {PERSON_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="reg-name" className="block font-sans text-sm font-medium text-navy-800 mb-1.5">
                        Full name <span className="text-red-600">*</span>
                      </label>
                      <input id="reg-name" required value={form.full_name} onChange={set('full_name')} className="input-base" />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="reg-email" className="block font-sans text-sm font-medium text-navy-800 mb-1.5">
                        Email <span className="text-red-600">*</span>
                      </label>
                      <input id="reg-email" type="email" required value={form.email} onChange={set('email')} className="input-base" />
                      <p className="text-xs text-navy-400 mt-1">Your confirmation and certificate go here.</p>
                    </div>
                    <div>
                      <label htmlFor="reg-phone" className="block font-sans text-sm font-medium text-navy-800 mb-1.5">Phone</label>
                      <input id="reg-phone" type="tel" value={form.phone} onChange={set('phone')} className="input-base" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-institution" className="block font-sans text-sm font-medium text-navy-800 mb-1.5">Institution or organisation</label>
                    <input id="reg-institution" value={form.institution} onChange={set('institution')} className="input-base" />
                  </div>

                  <fieldset>
                    <legend className="font-sans text-sm font-medium text-navy-800 mb-2">
                      Registering as <span className="text-red-600">*</span>
                    </legend>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {offered.map(({ value, label, hint }) => {
                        const amount = hasFeeTable ? feeTable![value] : undefined;
                        const active = form.category === value;
                        return (
                          <label
                            key={value}
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors min-w-0 ${
                              active
                                ? 'border-gold-400 bg-gold-50'
                                : 'border-parchment-300 hover:border-gold-300 hover:bg-parchment-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="category"
                              value={value}
                              checked={active}
                              onChange={set('category')}
                              className="mt-1 accent-gold-600 flex-shrink-0"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-navy-900">{label}</span>
                              <span className="block text-xs text-navy-400">{hint}</span>
                              {amount && (
                                <span className="block text-xs font-semibold text-gold-700 mt-1">
                                  {money(amount)}
                                </span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div>
                    <label htmlFor="reg-notes" className="block font-sans text-sm font-medium text-navy-800 mb-1.5">
                      Notes <span className="font-normal text-navy-400">(optional)</span>
                    </label>
                    <textarea
                      id="reg-notes" rows={3} value={form.notes} onChange={set('notes')}
                      placeholder="Dietary requirements, accessibility needs, anything else we should know."
                      className="input-base resize-y"
                    />
                  </div>

                  {selectedFee && (
                    <div className="rounded-xl bg-parchment-50 border border-parchment-200 p-4">
                      <p className="text-sm text-navy-700">
                        Fee for this category: <strong>{money(selectedFee)}</strong>
                      </p>
                      <p className="text-xs text-navy-500 mt-1">
                        Payment terms and where to send your proof of payment will be in your
                        confirmation email. Your place is confirmed once payment is verified.
                      </p>
                    </div>
                  )}

                  <button type="submit" disabled={registering} className="btn-gold w-full justify-center py-3 disabled:opacity-60">
                    {registering && <Loader2 className="w-4 h-4 animate-spin" />}
                    {registering ? 'Registering' : 'Complete registration'}
                  </button>
                </div>
              </form>
            )}

            {/* Proceedings, readable in place with selective download */}
            {conf.proceedings_url && (
              <div className="card p-6">
                <h2 className="font-serif text-xl text-navy-900 mb-2">Conference Proceedings</h2>
                <p className="font-sans text-sm text-navy-500 mb-4">
                  Read the proceedings here, or take a copy. You can choose which pages.
                </p>
                <PdfReaderPanel url={conf.proceedings_url} title={`${conf.title} proceedings`} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Location */}
            {conf.venue && (
              <div className="card p-5">
                <h3 className="font-sans text-sm font-semibold text-navy-500 uppercase tracking-wider mb-3">Venue</h3>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gold-500 mt-0.5" />
                  <p className="text-sm text-navy-700">{conf.venue}</p>
                </div>
              </div>
            )}

            {/* Registration status and fees */}
            <div className={`card p-5 ${canRegister ? 'border-2 border-gold-200' : ''}`}>
              <h3 className="font-serif text-base text-navy-900 mb-4">Registration</h3>
              {myReg ? (
                <div className="text-center">
                  <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-green-700 mb-1">You are registered</p>
                  <p className="text-xs text-navy-500 font-mono break-all">{myReg.registration_number}</p>
                  {myReg.fee_amount && (
                    <p className="text-xs text-navy-500 mt-3">
                      Fee due: <strong>{money(myReg.fee_amount)}</strong>
                      <br />
                      <span className="capitalize">{myReg.payment_status}</span>
                    </p>
                  )}
                  <p className="text-xs text-navy-400 mt-3 inline-flex items-start gap-1.5 text-left">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    Confirmation sent to {myReg.email}
                  </p>
                </div>
              ) : canRegister ? (
                <div className="space-y-3">
                  {hasFeeTable ? (
                    <>
                      <p className="text-xs text-navy-500">Fees by category:</p>
                      <ul className="space-y-1.5">
                        {offered.map(({ value, label }) => (
                          <li key={value} className="flex items-baseline justify-between gap-3 text-sm min-w-0">
                            <span className="text-navy-600 min-w-0 truncate">{label}</span>
                            <span className="font-semibold text-navy-900 flex-shrink-0">
                              {money(feeTable![value])}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : conf.registration_fee ? (
                    <p className="text-sm text-navy-600">Fee: <strong>{money(conf.registration_fee)}</strong></p>
                  ) : (
                    <p className="text-sm text-navy-600">No registration fee.</p>
                  )}
                  <a href="#register" className="btn-gold w-full justify-center text-sm">
                    Register to attend
                  </a>
                  <p className="text-xs text-navy-400 text-center">No account required.</p>
                </div>
              ) : (
                <p className="text-sm text-navy-500 text-center py-4">
                  {conf.status === 'completed' ? 'This conference has concluded.' :
                   conf.status === 'upcoming' ? 'Registration not yet open.' :
                   'Registration is closed.'}
                </p>
              )}
            </div>

            {/* Submit paper */}
            {(conf.status === 'open' || conf.status === 'upcoming') && (
              <div className="card p-5 bg-navy-50 border border-navy-200">
                <h3 className="font-serif text-base text-navy-900 mb-2">Submit a Paper</h3>
                <p className="text-xs text-navy-500 mb-3">Submit your research to this conference for peer review.</p>
                <Link href={`/submit?conference_id=${conf.id}&type=conference`} className="btn-primary text-sm w-full justify-center">
                  Submit Paper
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
