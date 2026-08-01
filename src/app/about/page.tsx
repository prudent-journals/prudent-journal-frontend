import Link from 'next/link';
import { Metadata } from 'next';
import {
  BookOpen, ShieldCheck, Globe, Users, ScrollText, Scale,
  Landmark, ArrowRight, Quote, MapPin,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import { DIRECTORS, EDITORIAL_BOARD, MILESTONES, Person } from '@/lib/people';
import { JOURNALS } from '@/lib/journals';
import { getInitials } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Prudent Journal Ltd is an independent academic publisher. Our mission, scope, ' +
    'publishing ethics, leadership and editorial board.',
};

function Portrait({ person, size = 'lg' }: { person: Person; size?: 'lg' | 'sm' }) {
  const dimension = size === 'lg' ? 'w-20 h-20 text-xl' : 'w-14 h-14 text-base';
  if (person.photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={person.photo}
        alt={person.name}
        className={`${dimension} rounded-2xl object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${dimension} rounded-2xl bg-navy-900 text-gold-400 font-serif flex items-center justify-center flex-shrink-0`}
      aria-hidden="true"
    >
      {getInitials(person.name)}
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <header className="bg-hero-gradient hero-pattern relative overflow-hidden">
        <div className="noise-overlay absolute inset-0" />
        <div className="absolute top-10 right-[8%] w-72 h-72 rounded-full bg-gold-500/5 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <p className="text-gold-400 text-sm font-sans font-semibold uppercase tracking-widest mb-4">
            About
          </p>
          <h1 className="font-display text-4xl lg:text-6xl text-parchment-50 leading-tight mb-6 max-w-3xl">
            An Independent Publisher of Scholarly Work
          </h1>
          <p className="font-sans text-lg text-parchment-300 max-w-2xl leading-relaxed">
            Prudent Journals exists to put rigorously reviewed research into the open,
            where it can be read, cited and built upon without a paywall standing in
            the way.
          </p>
        </div>
      </header>

      <main className="flex-1 bg-parchment-50">
        {/* Mission */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-3">
                Our Mission
              </p>
              <h2 className="font-serif text-3xl text-navy-900 mb-6">Why we publish</h2>
              <div className="space-y-5 font-sans text-navy-700 leading-relaxed">
                <p>
                  A great deal of capable research is carried out in institutions that sit
                  outside the established publishing centres, and much of it never reaches
                  an audience. The barriers are rarely about quality. They are about cost,
                  access, and the absence of a route to publication that treats the work
                  seriously.
                </p>
                <p>
                  Prudent Journals was founded to remove those barriers. Submission is free.
                  Publication is open access, with no charge to the reader and no
                  subscription. Every manuscript is assessed on its merits by a reviewer
                  qualified in the field, and the decision, along with the reasoning behind
                  it, is recorded against the manuscript.
                </p>
                <p>
                  We publish a peer reviewed journal, run a conference programme with
                  published proceedings, and maintain a permanent open archive of
                  everything we have published.
                </p>
              </div>
            </div>

            <aside className="space-y-4">
              {[
                { icon: BookOpen, label: 'Open access', detail: 'No paywall, no reader account' },
                { icon: ShieldCheck, label: 'Peer reviewed', detail: 'Assessed against published criteria' },
                { icon: Globe, label: 'Indexed', detail: 'Structured metadata for discovery' },
                { icon: Scale, label: 'Independent', detail: 'Editorial decisions made on merit' },
              ].map(({ icon: Icon, label, detail }) => (
                <div key={label} className="card p-5 flex gap-4 items-start">
                  <div className="w-11 h-11 rounded-xl bg-gold-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-gold-700" />
                  </div>
                  <div>
                    <p className="font-sans font-semibold text-navy-900 text-sm">{label}</p>
                    <p className="font-sans text-sm text-navy-500 leading-relaxed">{detail}</p>
                  </div>
                </div>
              ))}
            </aside>
          </div>
        </section>

        {/* Scope */}
        <section className="bg-white border-y border-parchment-200 py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl mb-12">
              <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-3">
                Scope
              </p>
              <h2 className="font-serif text-3xl text-navy-900 mb-4">What we consider</h2>
              <p className="font-sans text-navy-600 leading-relaxed">
                We publish original research, review articles and conference papers under
                three titles. Work that is methodologically sound and clearly reported is
                welcome regardless of whether its findings are positive.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {JOURNALS.map(({ icon: Icon, title, blurb, topics }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-parchment-300 p-6 bg-parchment-50 flex flex-col min-w-0"
                >
                  <div className="w-11 h-11 rounded-xl bg-navy-900 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-gold-400" />
                  </div>
                  <h3 className="font-serif text-lg text-navy-900 leading-snug mb-2">{title}</h3>
                  <p className="font-sans text-sm text-navy-500 leading-relaxed mb-4">{blurb}</p>
                  <ul className="mt-auto flex flex-wrap gap-1.5">
                    {topics.map((t) => (
                      <li
                        key={t}
                        className="font-sans text-xs text-navy-600 bg-white border border-parchment-300 rounded-full px-2.5 py-1"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Directors */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-2xl mb-12">
            <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-3">
              Directors
            </p>
            <h2 className="font-serif text-3xl text-navy-900 mb-4">Who runs the journal</h2>
            <p className="font-sans text-navy-600 leading-relaxed">
              The directors are responsible for the company and its operation. Editorial
              decisions rest with the editorial management board and are made on merit,
              independent of commercial direction.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {DIRECTORS.map((person) => (
              <article key={person.name} className="card p-7">
                <div className="flex gap-5 mb-4">
                  <Portrait person={person} />
                  <div className="min-w-0">
                    <h3 className="font-serif text-xl text-navy-900 leading-snug">{person.name}</h3>
                    {person.role && (
                      <p className="font-sans text-sm text-gold-700 font-medium mt-0.5">{person.role}</p>
                    )}
                    {person.credentials && (
                      <p className="font-mono text-xs text-navy-400 mt-1">{person.credentials}</p>
                    )}
                  </div>
                </div>

                {person.qualifications && (
                  <p className="font-sans text-sm text-navy-500 mb-2">
                    <span className="text-navy-400">Qualifications:</span> {person.qualifications}
                  </p>
                )}
                {person.bio && (
                  <p className="font-sans text-sm text-navy-600 leading-relaxed">{person.bio}</p>
                )}

                {person.research && person.research.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-parchment-200">
                    <p className="font-sans text-xs text-navy-400 mb-2">Research interests</p>
                    <div className="flex flex-wrap gap-2">
                      {person.research.map((r) => (
                        <span key={r} className="badge bg-parchment-100 text-navy-600">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* Editorial management board */}
        <section id="editorial-board" className="bg-navy-900 py-20 px-6 relative overflow-hidden scroll-mt-20">
          <div className="absolute inset-0 hero-pattern opacity-30" />
          <div className="relative max-w-7xl mx-auto">
            <div className="max-w-2xl mb-12">
              <p className="text-gold-400 text-sm font-sans font-semibold uppercase tracking-widest mb-3">
                Editorial Management Board
              </p>
              <h2 className="font-display text-4xl text-parchment-50 mb-4">
                The people who assess the work
              </h2>
              <p className="font-sans text-parchment-300 leading-relaxed">
                Board members are practising researchers across engineering, architecture,
                accounting and the social sciences. They handle submissions in their own
                field and declare any conflict of interest before taking an assignment.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {EDITORIAL_BOARD.map((person) => (
                person.incoming ? (
                  <article
                    key={person.name}
                    className="rounded-2xl border-2 border-dashed border-navy-700 p-6 flex flex-col items-center justify-center text-center min-h-[180px]"
                  >
                    <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-navy-600 flex items-center justify-center mb-3">
                      <span className="text-navy-500 text-2xl font-serif">+</span>
                    </div>
                    <p className="font-serif text-parchment-200">A further member</p>
                    <p className="font-sans text-xs text-parchment-500 mt-1">
                      To be announced
                    </p>
                  </article>
                ) : (
                  <article key={person.name} className="glass-dark rounded-2xl p-6 flex flex-col">
                    <div className="flex gap-4 mb-3">
                      <Portrait person={person} size="sm" />
                      <div className="min-w-0">
                        <h3 className="font-serif text-base text-parchment-100 leading-snug">
                          {person.name}
                        </h3>
                        {person.role && (
                          <p className="font-sans text-xs text-gold-400 mt-0.5">{person.role}</p>
                        )}
                      </div>
                    </div>

                    {person.credentials && (
                      <p className="font-mono text-[11px] text-parchment-500 mb-2">{person.credentials}</p>
                    )}
                    {person.qualifications && (
                      <p className="font-sans text-xs text-parchment-400 mb-2">{person.qualifications}</p>
                    )}
                    {person.affiliation && (
                      <p className="font-sans text-xs text-parchment-400 mb-3 flex items-start gap-1.5">
                        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-parchment-500" />
                        {person.affiliation}
                      </p>
                    )}
                    {person.bio && (
                      <p className="font-sans text-sm text-parchment-300 leading-relaxed mb-3">{person.bio}</p>
                    )}

                    {person.research && person.research.length > 0 && (
                      <div className="mt-auto pt-3 border-t border-navy-700/60 flex flex-wrap gap-1.5">
                        {person.research.map((r) => (
                          <span key={r} className="text-[11px] px-2 py-0.5 rounded-full bg-navy-800 text-parchment-400">
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                )
              ))}
            </div>
          </div>
        </section>

        {/* Ethics */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-14">
            <div>
              <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-3">
                Publishing Ethics
              </p>
              <h2 className="font-serif text-3xl text-navy-900 mb-6">How we handle the work</h2>

              <div className="space-y-6">
                {[
                  {
                    icon: ScrollText,
                    title: 'Authorship and attribution',
                    body:
                      'Everyone listed must have contributed to the work, and everyone who ' +
                      'contributed must be listed. Sources are expected to be cited properly, ' +
                      'and submissions are checked for correct attribution before review.',
                  },
                  {
                    icon: Users,
                    title: 'Conflicts of interest',
                    body:
                      'Reviewers declare any competing interest before accepting an assignment, ' +
                      'and are not assigned to work by close colleagues or collaborators. ' +
                      'Authors disclose funding sources on submission.',
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Corrections and retraction',
                    body:
                      'Where an error affects the findings we publish a correction linked to the ' +
                      'original. Where the findings cannot stand, the article is retracted and ' +
                      'the record marked, rather than quietly removed.',
                  },
                  {
                    icon: Scale,
                    title: 'Appeals',
                    body:
                      'An author who believes a decision was reached unfairly may appeal in ' +
                      'writing to the Editor in Chief, who will arrange an independent assessment.',
                  },
                ].map(({ icon: Icon, title, body }) => (
                  <div key={title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-parchment-200 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-navy-700" />
                    </div>
                    <div>
                      <h3 className="font-sans font-semibold text-navy-900 mb-1">{title}</h3>
                      <p className="font-sans text-sm text-navy-600 leading-relaxed">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-3">
                History
              </p>
              <h2 className="font-serif text-3xl text-navy-900 mb-6">How we got here</h2>

              <ol className="relative border-l-2 border-parchment-300 pl-6 space-y-8 mb-10">
                {MILESTONES.map((m) => (
                  <li key={m.title} className="relative">
                    <span className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-gold-500 ring-4 ring-parchment-50" />
                    <p className="font-mono text-xs text-gold-700 mb-1">{m.year}</p>
                    <h3 className="font-serif text-lg text-navy-900 mb-1">{m.title}</h3>
                    <p className="font-sans text-sm text-navy-600 leading-relaxed">{m.detail}</p>
                  </li>
                ))}
              </ol>

              <div className="card p-7 bg-navy-900 border-navy-800">
                <Landmark className="w-7 h-7 text-gold-400 mb-4" />
                <h3 className="font-serif text-xl text-parchment-50 mb-3">The legal entity</h3>
                <p className="font-sans text-sm text-parchment-300 leading-relaxed mb-5">
                  The journal is published by <strong className="text-parchment-100">Prudent
                  Journal Ltd</strong>, a private company limited by shares, incorporated in
                  the Federal Republic of Nigeria under the Companies and Allied Matters
                  Act 2020.
                </p>
                <dl className="space-y-2 font-sans text-sm">
                  <div className="flex justify-between gap-4 py-2 border-t border-navy-800">
                    <dt className="text-parchment-400">Registered name</dt>
                    <dd className="text-parchment-100 text-right">Prudent Journal Ltd</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2 border-t border-navy-800">
                    <dt className="text-parchment-400">Company number</dt>
                    <dd className="text-parchment-100 font-mono text-right">9613688</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2 border-t border-navy-800">
                    <dt className="text-parchment-400">Jurisdiction</dt>
                    <dd className="text-parchment-100 text-right">Federal Republic of Nigeria</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        {/* Closing */}
        <section className="bg-parchment-100 border-t border-parchment-300 py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <Quote className="w-9 h-9 text-gold-500/50 mx-auto mb-6" />
            <p className="font-display text-2xl lg:text-3xl text-navy-900 leading-relaxed mb-8">
              Research that is not read changes nothing. Our job is to make sure good
              work is found, trusted and cited.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/submit" className="btn-primary text-base px-8 py-3">
                Submit your work <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/contact" className="btn-outline text-base px-8 py-3">
                Contact the editorial office
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
