'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Users, ArrowLeft, CheckCircle, Loader2, FileText } from 'lucide-react';
import PdfReaderPanel from '@/components/pdf/PdfReaderPanel';
import { conferencesApi } from '@/lib/api';
import { Conference, Registration } from '@/types';
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
  const [notes, setNotes] = useState('');

  useEffect(() => {
    conferencesApi.get(parseInt(id as string)).then(r => setConf(r.data)).finally(() => setLoading(false));
    if (user) {
      conferencesApi.myRegistration(parseInt(id as string)).then(r => setMyReg(r.data)).catch(() => {});
    }
  }, [id, user]);

  const handleRegister = async () => {
    if (!user) { toast.error('Please sign in to register'); return; }
    setRegistering(true);
    try {
      const { data } = await conferencesApi.register(parseInt(id as string), { notes });
      setMyReg(data);
      toast.success('Registered successfully!');
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

            {/* Registration */}
            <div id="register" className={`card p-5 ${canRegister ? 'border-2 border-gold-200' : ''}`}>
              <h3 className="font-serif text-base text-navy-900 mb-4">Registration</h3>
              {myReg ? (
                <div className="text-center">
                  <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-green-700 mb-1">You are registered!</p>
                  <p className="text-xs text-navy-500 font-mono">{myReg.registration_number}</p>
                </div>
              ) : canRegister ? (
                <div className="space-y-3">
                  {conf.registration_fee && (
                    <p className="text-sm text-navy-600">Fee: <strong>{conf.registration_fee}</strong></p>
                  )}
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Any special requirements or notes..."
                    rows={3}
                    className="input-base text-sm resize-none"
                  />
                  {user ? (
                    <button onClick={handleRegister} disabled={registering} className="btn-gold w-full justify-center">
                      {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {registering ? 'Registering...' : 'Register Now'}
                    </button>
                  ) : (
                    <Link href="/auth/login" className="btn-primary w-full justify-center text-sm">
                      Sign In to Register
                    </Link>
                  )}
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
