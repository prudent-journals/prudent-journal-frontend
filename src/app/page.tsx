import Link from 'next/link';
import { Metadata } from 'next';
import {
  BookOpen, Users, Award, Globe, ArrowRight, FileText, Calendar, ChevronRight,
  UploadCloud, SearchCheck, PenLine, BadgeCheck, ShieldCheck, Link2, Quote,
  UserCheck, Library,
  Eye, Download, Sparkles, ArrowDown, Quote as QuoteIcon,
} from 'lucide-react';
import { publicationsApi, conferencesApi } from '@/lib/api';
import { JOURNALS } from '@/lib/journals';
import { Publication, Conference } from '@/types';
import { formatDate, truncate } from '@/lib/utils';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';

export const metadata: Metadata = {
  title: 'Prudent Journals - Academic Publishing and Research',
};

async function getHomeData() {
  try {
    const [pubsRes, confsRes, statsRes] = await Promise.allSettled([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/publications?size=6`, { next: { revalidate: 3600 } }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/conferences`, { next: { revalidate: 3600 } }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/publications/stats`, { next: { revalidate: 3600 } }),
    ]);

    const publications: Publication[] = pubsRes.status === 'fulfilled' && pubsRes.value.ok
      ? await pubsRes.value.json() : [];
    const conferences: Conference[] = confsRes.status === 'fulfilled' && confsRes.value.ok
      ? await confsRes.value.json() : [];
    const stats = statsRes.status === 'fulfilled' && statsRes.value.ok
      ? await statsRes.value.json() : { total_publications: 0, total_views: 0, total_downloads: 0 };

    return { publications, conferences, stats };
  } catch {
    return { publications: [], conferences: [], stats: { total_publications: 0, total_views: 0, total_downloads: 0 } };
  }
}

export default async function HomePage() {
  const { publications, conferences, stats } = await getHomeData();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-hero-gradient hero-pattern overflow-hidden">
        <div className="noise-overlay absolute inset-0" />

        {/* Layered ambient light */}
        <div className="absolute -top-24 right-[6%] w-[32rem] h-[32rem] rounded-full bg-gold-500/10 blur-[120px] animate-float" />
        <div className="absolute bottom-[-6rem] left-[-4rem] w-[36rem] h-[36rem] rounded-full bg-navy-600/25 blur-[120px]" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 left-1/2 w-72 h-72 rounded-full bg-gold-400/5 blur-3xl" />

        {/* Fine gold rule at the very top, a printed-page cue */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 lg:pt-28 lg:pb-20">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">

            {/* Left: the pitch */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-400 text-sm font-sans mb-7 animate-fade-in">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-60 animate-ping" />
                  <span className="relative inline-flex rounded-full w-2 h-2 bg-gold-400" />
                </span>
                Independent Academic Publisher
                <span className="hidden sm:inline text-gold-600">·</span>
                <span className="hidden sm:inline text-parchment-300">Open Access</span>
              </div>

              <h1 className="font-display text-5xl lg:text-[4.75rem] text-parchment-50 leading-[1.04] mb-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
                Advancing Knowledge,
                <br />
                <span className="text-gradient-gold animate-shimmer">Inspiring Discovery</span>
              </h1>

              <p className="font-sans text-lg text-parchment-300 max-w-xl leading-relaxed mb-8 animate-fade-up" style={{ animationDelay: '200ms' }}>
                An independent publisher where peer reviewed research, conference
                proceedings and scholarly discourse converge, and reach the world
                without a paywall in the way.
              </p>

              <div className="flex flex-wrap gap-3 mb-10 animate-fade-up" style={{ animationDelay: '300ms' }}>
                <Link href="/publications" className="btn-gold text-base px-7 py-3">
                  Browse Publications <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/submit" className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-parchment-50 border-2 border-parchment-50/25 hover:border-parchment-50/70 hover:bg-parchment-50/5 transition-all duration-200 text-base font-medium">
                  Submit Your Paper
                </Link>
              </div>

              {/* Trust markers */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 animate-fade-up" style={{ animationDelay: '400ms' }}>
                {[
                  { icon: ShieldCheck, label: 'Peer reviewed' },
                  { icon: Globe, label: 'Indexed for Google Scholar' },
                  { icon: BookOpen, label: 'Free to read and publish' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-2 text-sm font-sans text-parchment-400">
                    <Icon className="w-4 h-4 text-gold-400/80" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: the latest work, real data, layered like a printed issue */}
            <div className="lg:col-span-5 animate-fade-up" style={{ animationDelay: '250ms' }}>
              {publications.length > 0 ? (
                <div className="relative mx-auto max-w-md lg:mr-0">
                  {/* Back cards for depth */}
                  <div className="absolute inset-0 rounded-3xl bg-parchment-50/5 border border-parchment-50/10 rotate-[6deg] scale-[0.97]" />
                  <div className="absolute inset-0 rounded-3xl bg-parchment-50/5 border border-parchment-50/10 rotate-[3deg] scale-[0.985]" />

                  {/* Featured publication */}
                  <Link
                    href={`/publications/${publications[0].slug}`}
                    className="group relative block glass-dark rounded-3xl p-7 hover:border-gold-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-sans font-semibold uppercase tracking-widest text-gold-400">
                        <Sparkles className="w-3.5 h-3.5" /> Latest Research
                      </span>
                      <span className={`badge ${publications[0].paper_type === 'conference' ? 'bg-navy-500/40 text-parchment-200' : 'bg-gold-500/20 text-gold-300'}`}>
                        {publications[0].paper_type === 'conference' ? 'Conference' : 'Journal'}
                      </span>
                    </div>

                    <QuoteIcon className="w-8 h-8 text-gold-500/30 mb-3" />

                    <h2 className="font-serif text-xl text-parchment-50 leading-snug mb-3 group-hover:text-gold-300 transition-colors">
                      {truncate(publications[0].title, 90)}
                    </h2>

                    <p className="font-sans text-sm text-parchment-400 leading-relaxed mb-5">
                      {truncate(publications[0].abstract, 128)}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-parchment-500 font-sans mb-5">
                      <Users className="w-3.5 h-3.5" />
                      <span className="truncate">{publications[0].authors}</span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-parchment-50/10">
                      <div className="flex items-center gap-4 text-xs text-parchment-500 font-sans">
                        {publications[0].volume && (
                          <span className="font-mono">Vol. {publications[0].volume}</span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> {publications[0].view_count}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Download className="w-3.5 h-3.5" /> {publications[0].download_count}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-sans font-medium text-gold-400 group-hover:gap-2 transition-all">
                        Read <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </Link>

                  {/* Floating accolade chip, hanging clear of the card footer */}
                  <div className="absolute -bottom-8 -left-4 sm:-left-8 bg-navy-950/95 backdrop-blur rounded-2xl px-4 py-3 border border-gold-500/25 shadow-2xl hidden sm:flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gold-500/15 flex items-center justify-center">
                      <Award className="w-4.5 h-4.5 text-gold-400" />
                    </div>
                    <div>
                      <p className="font-display text-lg text-parchment-50 leading-none tabular-figures">
                        {(stats.total_publications ?? 0).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-parchment-400 font-sans mt-0.5">papers published</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative mx-auto max-w-md glass-dark rounded-3xl p-8 text-center">
                  <BookOpen className="w-10 h-10 text-gold-400/50 mx-auto mb-4" />
                  <h2 className="font-serif text-xl text-parchment-50 mb-2">The archive is opening</h2>
                  <p className="font-sans text-sm text-parchment-400 leading-relaxed">
                    The first publications are on their way. Be among the first to submit.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-16 lg:mt-20 grid grid-cols-2 lg:grid-cols-4 rounded-2xl overflow-hidden border border-parchment-50/10 divide-x divide-y lg:divide-y-0 divide-parchment-50/10 animate-fade-up" style={{ animationDelay: '450ms' }}>
            {[
              { label: 'Publications', value: stats.total_publications ?? 0, icon: BookOpen },
              { label: 'Total Views', value: stats.total_views ?? 0, icon: Eye },
              { label: 'Downloads', value: stats.total_downloads ?? 0, icon: Download },
              { label: 'Conferences', value: conferences.length, icon: Calendar },
            ].map((stat) => (
              <div key={stat.label} className="bg-navy-800/50 hover:bg-navy-800/80 transition-colors p-6 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                  <stat.icon className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <div className="font-display text-2xl lg:text-3xl text-parchment-50 font-semibold tabular-figures leading-none">
                    {stat.value.toLocaleString()}
                  </div>
                  <div className="text-parchment-400 text-xs lg:text-sm mt-1.5 font-sans">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-6 bg-parchment-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-3">Our Mission</p>
          <div className="space-y-5 font-sans text-navy-700 leading-relaxed text-base lg:text-lg">
            <p>
              Prudent Journals is poised to promote the publication of high quality original
              research, reviews, short communications and technical reports in the fields of
              Applied Sciences, Engineering, Environmental Sciences, Management Sciences,
              Social Sciences and related fields.
            </p>
            <p>
              The Prudent Journals serves as a platform for academics, professionals and industry
              experts to share innovative and creative findings geared towards knowledge
              advancement.
            </p>
            <p>
              The Journals publishes double blind peer reviewed articles biannually and aims to
              enhance global visibility and accessibility through open access publishing in
              compliance with relevant global standards.
            </p>
          </div>
        </div>
      </section>

      {/* Recent Publications */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-2">Latest Research</p>
              <h2 className="font-serif text-3xl lg:text-4xl text-navy-900">Recent Publications</h2>
            </div>
            <Link href="/publications" className="hidden md:flex items-center gap-2 text-navy-600 hover:text-navy-900 font-sans text-sm font-medium transition-colors animated-underline">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {publications.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
              {publications.map((pub) => (
                <Link key={pub.id} href={`/publications/${pub.slug}`} className="group card p-6 flex flex-col gap-3 animate-fade-up min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${pub.paper_type === 'conference' ? 'bg-navy-100 text-navy-700' : 'bg-gold-100 text-gold-700'}`}>
                      {pub.paper_type === 'conference' ? 'Conference' : 'Journal'}
                    </span>
                    {pub.volume && (
                      <span className="text-xs text-navy-400 font-sans">Vol. {pub.volume}</span>
                    )}
                  </div>

                  <h3 className="font-serif text-lg text-navy-900 group-hover:text-gold-700 transition-colors leading-snug">
                    {truncate(pub.title, 80)}
                  </h3>

                  <p className="text-navy-500 text-sm font-sans leading-relaxed flex-1">
                    {truncate(pub.abstract, 120)}
                  </p>

                  <div className="pt-3 border-t border-parchment-200 flex items-center justify-between">
                    <span className="text-xs text-navy-400 font-sans">{pub.authors}</span>
                    <span className="text-xs text-navy-400 font-sans">{formatDate(pub.published_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-navy-400 font-sans">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No publications yet. Be the first to submit!</p>
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Link href="/publications" className="btn-outline">View All Publications</Link>
          </div>
        </div>
      </section>


      {/* Browse by discipline */}
      <section className="py-20 px-6 bg-parchment-50 border-y border-parchment-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-2">Research Areas</p>
            <h2 className="font-serif text-3xl lg:text-4xl text-navy-900">Our Journals</h2>
            <p className="text-navy-500 font-sans mt-3 max-w-xl mx-auto leading-relaxed">
              Three peer-reviewed titles, each with its own editorial focus. Browse a
              journal to see everything published under it.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {JOURNALS.map(({ icon: Icon, title, blurb, topics, q }) => (
              <Link
                key={title}
                href={`/publications?search=${encodeURIComponent(q)}`}
                className="group card p-7 flex flex-col hover:border-gold-400 hover:shadow-lg transition-all min-w-0"
              >
                <div className="w-12 h-12 rounded-2xl bg-navy-900 flex items-center justify-center mb-5 group-hover:bg-gold-500 transition-colors">
                  <Icon className="w-6 h-6 text-gold-400 group-hover:text-navy-900 transition-colors" />
                </div>
                <h3 className="font-serif text-xl text-navy-900 leading-snug mb-2 group-hover:text-gold-700 transition-colors">
                  {title}
                </h3>
                <p className="font-sans text-sm text-navy-500 leading-relaxed mb-5">{blurb}</p>
                <ul className="mt-auto flex flex-wrap gap-1.5">
                  {topics.map((t) => (
                    <li
                      key={t}
                      className="font-sans text-xs text-navy-600 bg-parchment-100 border border-parchment-300 rounded-full px-2.5 py-1"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
                <span className="mt-5 inline-flex items-center gap-1.5 font-sans text-sm font-medium text-gold-700">
                  Browse the journal
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How publishing works */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-2">The Process</p>
            <h2 className="font-serif text-3xl lg:text-4xl text-navy-900">From Submission to Publication</h2>
            <p className="text-navy-500 font-sans mt-3 max-w-2xl mx-auto leading-relaxed">
              Every manuscript follows the same documented path. You can track yours at each
              stage from your dashboard, and you are notified whenever the status changes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: UploadCloud, step: '01', title: 'Submit', desc: 'Upload your manuscript with keywords and co-author details.' },
              { icon: SearchCheck, step: '02', title: 'Peer Review', desc: 'An editor assigns a qualified reviewer who assesses the work against published criteria.' },
              { icon: PenLine, step: '03', title: 'Revise', desc: 'Reviewer feedback is shared with you, and revisions are submitted through the same record.' },
              { icon: BadgeCheck, step: '04', title: 'Publish', desc: 'On acceptance an editor publishes the final version, indexed and openly accessible.' },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="relative card p-6 flex flex-col gap-3">
                <span className="absolute top-5 right-6 font-display text-4xl text-parchment-300 select-none">{step}</span>
                <div className="w-11 h-11 rounded-xl bg-gold-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-gold-700" />
                </div>
                <h3 className="font-serif text-lg text-navy-900">{title}</h3>
                <p className="text-navy-500 text-sm font-sans leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/submit" className="btn-primary text-base px-8 py-3">
              Start a Submission <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Conferences */}
      {conferences.length > 0 && (
        <section className="py-20 px-6 bg-parchment-100">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-2">Academic Events</p>
                <h2 className="font-serif text-3xl lg:text-4xl text-navy-900">Upcoming Conferences</h2>
              </div>
              <Link href="/conferences" className="hidden md:flex items-center gap-2 text-navy-600 hover:text-navy-900 font-sans text-sm font-medium transition-colors animated-underline">
                All events <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {conferences.slice(0, 4).map((conf) => (
                <Link key={conf.id} href={`/conferences/${conf.id}`} className="group card overflow-hidden flex flex-col md:flex-row min-w-0">
                  <div className="bg-hero-gradient p-6 flex items-center justify-center min-w-[100px]">
                    <Calendar className="w-8 h-8 text-gold-400" />
                  </div>
                  <div className="p-6 flex-1">
                    <div className={`badge mb-2 ${
                      conf.status === 'open' ? 'bg-green-100 text-green-700' :
                      conf.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {conf.status.charAt(0).toUpperCase() + conf.status.slice(1)}
                    </div>
                    <h3 className="font-serif text-lg text-navy-900 group-hover:text-gold-700 transition-colors mb-1">
                      {conf.title}
                    </h3>
                    {conf.venue && <p className="text-sm text-navy-500 font-sans">{conf.venue}</p>}
                    {conf.start_date && (
                      <p className="text-xs text-navy-400 font-sans mt-2">{formatDate(conf.start_date)}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Prudent Journals */}
      <section className="py-20 px-6 bg-navy-900 relative overflow-hidden">
        <div className="absolute inset-0 hero-pattern opacity-30" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-gold-400 text-sm font-sans font-semibold uppercase tracking-widest mb-3">Our Platform</p>
            <h2 className="font-display text-4xl text-parchment-50">Why Prudent Journals?</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {[
              { icon: BookOpen, title: 'Open Access', desc: 'All publications freely accessible to researchers worldwide, no subscription required.' },
              { icon: Award, title: 'Peer Reviewed', desc: 'Rigorous multi-stage review process ensuring the highest academic standards.' },
              { icon: Globe, title: 'Indexed & Discoverable', desc: 'SEO-optimized pages ensure your work reaches the global scholarly community.' },
              { icon: Users, title: 'Collaborative', desc: 'Connect with reviewers, attend conferences, and grow your academic network.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-dark rounded-2xl p-6 text-center animate-fade-up group hover:border-gold-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-gold-500/15 flex items-center justify-center mx-auto mb-4 group-hover:bg-gold-500/25 transition-colors">
                  <Icon className="w-6 h-6 text-gold-400" />
                </div>
                <h3 className="font-serif text-lg text-parchment-100 mb-2">{title}</h3>
                <p className="text-parchment-400 text-sm font-sans leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Editorial standards */}
      <section className="py-20 px-6 bg-parchment-100">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-2">Editorial Standards</p>
            <h2 className="font-serif text-3xl lg:text-4xl text-navy-900 mb-5">Published With Rigour</h2>
            <p className="text-navy-600 font-sans leading-relaxed mb-8">
              Editorial decisions rest on the assessment of the work alone. Reviewers declare
              conflicts of interest before accepting an assignment, and every decision is
              recorded against the manuscript so the process stays accountable.
            </p>

            <ul className="space-y-4">
              {[
                { icon: ShieldCheck, title: 'Independent review', desc: 'Reviewers are assigned by an editor and assess work against published criteria.' },
                { icon: Quote, title: 'Attribution and integrity', desc: 'Submissions are checked for correct attribution before they enter review.' },
                { icon: Link2, title: 'Durable citation', desc: 'Published articles carry stable identifiers and structured citation metadata.' },
              ].map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-white flex items-center justify-center border border-parchment-300">
                    <Icon className="w-5 h-5 text-navy-700" />
                  </div>
                  <div>
                    <p className="font-sans font-semibold text-navy-900 text-sm">{title}</p>
                    <p className="font-sans text-sm text-navy-500 leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-8 bg-white">
            <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-4">Discoverability</p>
            <h3 className="font-serif text-2xl text-navy-900 mb-4">Built to Be Found and Cited</h3>
            <p className="text-navy-600 font-sans text-sm leading-relaxed mb-6">
              Every article page carries structured scholarly metadata, so indexing services and
              reference managers can read it directly rather than guessing from the layout.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Structured data', 'ScholarlyArticle markup'],
                ['Citation metadata', 'Title, authors, PDF'],
                ['Open access', 'No paywall, no account'],
                ['Stable URLs', 'Permanent article links'],
              ].map(([t, d]) => (
                <div key={t} className="rounded-xl bg-parchment-50 border border-parchment-200 p-4">
                  <p className="font-sans text-sm font-semibold text-navy-900">{t}</p>
                  <p className="font-sans text-xs text-navy-500 mt-1 leading-relaxed">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>



      {/* For authors and reviewers */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-gold-600 text-sm font-sans font-semibold uppercase tracking-widest mb-2">Get Involved</p>
            <h2 className="font-serif text-3xl lg:text-4xl text-navy-900">However You Work With Us</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: PenLine, title: 'For Authors',
                desc: 'Submit a manuscript, track it through review, respond to feedback and reach an open readership.',
                href: '/submit', cta: 'Submit a paper',
              },
              {
                icon: UserCheck, title: 'For Reviewers',
                desc: 'Assess submissions in your field, record structured scores and shape what gets published.',
                href: '/auth/register', cta: 'Join as a reviewer',
              },
              {
                icon: Library, title: 'For Readers',
                desc: 'Read the full text of every article in the browser, or take only the pages you need.',
                href: '/publications', cta: 'Browse the catalogue',
              },
            ].map(({ icon: Icon, title, desc, href, cta }) => (
              <div key={title} className="card p-7 flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-gold-400" />
                </div>
                <h3 className="font-serif text-xl text-navy-900">{title}</h3>
                <p className="text-navy-500 text-sm font-sans leading-relaxed flex-1">{desc}</p>
                <Link href={href} className="inline-flex items-center gap-2 text-sm font-sans font-medium text-navy-800 hover:text-gold-700 transition-colors animated-underline w-fit min-h-[40px]">
                  {cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-parchment-100 border-t border-parchment-300">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl lg:text-4xl text-navy-900 mb-4">Ready to Share Your Research?</h2>
          <p className="text-navy-600 font-sans mb-8 leading-relaxed">
            Submit your manuscript today and contribute to the growing body of open access knowledge.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/auth/register" className="btn-primary text-base px-8 py-3">
              Create Account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/publications" className="btn-outline text-base px-8 py-3">
              Browse Research
            </Link>
          </div>
        </div>
      </section>

      <Footer full />
      <MobileNav />
    </div>
  );
}
