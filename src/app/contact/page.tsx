import Link from 'next/link';
import { Metadata } from 'next';
import { Mail, Globe, MapPin, FileText, Users, HelpCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'How to reach the editorial office of Prudent Journals.',
};

const ROUTES = [
  {
    icon: FileText,
    title: 'Submissions and review',
    desc: 'Questions about a manuscript already under consideration, review timelines, or revisions.',
    email: 'editorial@prudentjournals.com',
  },
  {
    icon: Users,
    title: 'Conferences and registration',
    desc: 'Registration references, attendance, proceedings and certificates.',
    email: 'conferences@prudentjournals.com',
  },
  {
    icon: HelpCircle,
    title: 'General enquiries',
    desc: 'Anything else, including indexing, permissions and corrections.',
    email: 'info@prudentjournals.com',
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <header className="bg-hero-gradient hero-pattern relative overflow-hidden">
        <div className="noise-overlay absolute inset-0" />
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <p className="text-gold-400 text-sm font-sans font-semibold uppercase tracking-widest mb-3">Contact</p>
          <h1 className="font-display text-4xl lg:text-5xl text-parchment-50 mb-4">Get in Touch</h1>
          <p className="font-sans text-parchment-300 max-w-2xl leading-relaxed">
            The editorial office answers enquiries during normal working hours. If your question
            concerns a specific manuscript, quote its title so we can find it quickly.
          </p>
        </div>
      </header>

      <main className="flex-1 bg-parchment-50 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 mb-14">
            {ROUTES.map(({ icon: Icon, title, desc, email }) => (
              <div key={title} className="card p-7 flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-gold-400" />
                </div>
                <h2 className="font-serif text-xl text-navy-900">{title}</h2>
                <p className="font-sans text-sm text-navy-500 leading-relaxed flex-1">{desc}</p>
                <a
                  href={`mailto:${email}`}
                  className="font-sans text-sm font-medium text-navy-800 hover:text-gold-700 transition-colors animated-underline w-fit py-2 -my-1 inline-flex items-center min-h-[40px]"
                >
                  {email}
                </a>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card p-8">
              <h2 className="font-serif text-2xl text-navy-900 mb-5">Editorial office</h2>
              <ul className="space-y-4 font-sans text-sm">
                <li className="flex gap-3">
                  <Mail className="w-5 h-5 text-navy-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-navy-500">Email</p>
                    <a href="mailto:editorial@prudentjournals.com" className="text-navy-900 hover:text-gold-700 transition-colors">
                      editorial@prudentjournals.com
                    </a>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Globe className="w-5 h-5 text-navy-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-navy-500">Web</p>
                    <span className="text-navy-900">prudentjournals.com</span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <MapPin className="w-5 h-5 text-navy-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-navy-500">Registered office</p>
                    <span className="text-navy-900">Bori, Rivers State, Nigeria</span>
                  </div>
                </li>
              </ul>

              <div className="mt-7 pt-6 border-t border-parchment-200">
                <p className="font-sans text-xs text-navy-400 leading-relaxed">
                  Prudent Journal Ltd is incorporated in the Federal Republic of Nigeria under the
                  Companies and Allied Matters Act 2020.
                  <br />
                  Company registration number <span className="font-mono text-navy-600">9613688</span>.
                </p>
              </div>
            </div>

            <div className="card p-8 bg-navy-900 border-navy-800">
              <h2 className="font-serif text-2xl text-parchment-50 mb-4">Before you write</h2>
              <p className="font-sans text-sm text-parchment-300 leading-relaxed mb-6">
                Most questions about a submission can be answered from your dashboard, which shows
                the current stage of every manuscript and any feedback that has been shared with you.
              </p>
              <div className="space-y-3">
                <Link href="/dashboard/papers" className="flex items-center justify-between p-4 rounded-xl bg-navy-800/60 hover:bg-navy-800 transition-colors">
                  <span className="font-sans text-sm text-parchment-100">Check a submission status</span>
                  <span className="text-gold-400">-&gt;</span>
                </Link>
                <Link href="/submit" className="flex items-center justify-between p-4 rounded-xl bg-navy-800/60 hover:bg-navy-800 transition-colors">
                  <span className="font-sans text-sm text-parchment-100">Submit a new manuscript</span>
                  <span className="text-gold-400">-&gt;</span>
                </Link>
                <Link href="/conferences" className="flex items-center justify-between p-4 rounded-xl bg-navy-800/60 hover:bg-navy-800 transition-colors">
                  <span className="font-sans text-sm text-parchment-100">Find a conference</span>
                  <span className="text-gold-400">-&gt;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
