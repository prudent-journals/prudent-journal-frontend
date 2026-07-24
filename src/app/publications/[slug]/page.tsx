import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Download, Eye, Calendar, Tag, BookOpen, ArrowLeft, ExternalLink, Hash } from 'lucide-react';
import { Publication } from '@/types';
import { formatDate } from '@/lib/utils';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import DownloadButton from '@/components/ui/DownloadButton';
import PdfReaderPanel from '@/components/pdf/PdfReaderPanel';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function getPublication(slug: string): Promise<Publication | null> {
  try {
    const res = await fetch(`${API}/publications/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pub = await getPublication(slug);
  if (!pub) return { title: 'Publication Not Found' };
  return {
    title: pub.title,
    description: pub.abstract.slice(0, 160),
    keywords: pub.keywords?.split(',').map(k => k.trim()),
    authors: pub.authors.split(',').map(a => ({ name: a.trim() })),
    openGraph: {
      title: pub.title,
      description: pub.abstract.slice(0, 200),
      type: 'article',
      publishedTime: pub.published_at,
      authors: pub.authors.split(','),
    },
    other: {
      'citation_title': pub.title,
      'citation_author': pub.authors,
      'citation_publication_date': pub.published_at,
      'citation_pdf_url': pub.pdf_url,
      ...(pub.doi ? { 'citation_doi': pub.doi } : {}),
    },
  };
}

export default async function PublicationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pub = await getPublication(slug);
  if (!pub) notFound();

  const keywords = pub.keywords?.split(',').map(k => k.trim()).filter(Boolean) || [];
  const authors = pub.authors.split(',').map(a => a.trim());

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Structured data for Google Scholar */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ScholarlyArticle',
        headline: pub.title,
        abstract: pub.abstract,
        author: authors.map(a => ({ '@type': 'Person', name: a })),
        datePublished: pub.published_at,
        publisher: { '@type': 'Organization', name: 'Prudent Journals - Prudent Journals' },
        keywords: pub.keywords,
        ...(pub.doi ? { identifier: { '@type': 'PropertyValue', propertyID: 'DOI', value: pub.doi } } : {}),
      })}} />

      <main className="flex-1">
        {/* Hero strip */}
        <div className="bg-hero-gradient py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <Link href="/publications" className="inline-flex items-center gap-2 text-parchment-400 hover:text-gold-400 text-sm font-sans mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Publications
            </Link>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`badge ${pub.paper_type === 'conference' ? 'bg-navy-700 text-parchment-200' : 'bg-gold-800/50 text-gold-300'}`}>
                {pub.paper_type === 'conference' ? 'Conference Paper' : 'Journal Article'}
              </span>
              {pub.volume && (
                <span className="badge bg-navy-700/50 text-parchment-300 font-mono">
                  Vol. {pub.volume}{pub.issue ? `, No. ${pub.issue}` : ''}
                </span>
              )}
              {pub.pages && (
                <span className="badge bg-navy-700/50 text-parchment-300">pp. {pub.pages}</span>
              )}
            </div>

            <h1 className="font-serif text-2xl lg:text-4xl text-parchment-50 leading-tight mb-6">
              {pub.title}
            </h1>

            {/* Authors */}
            <div className="flex flex-wrap gap-2 mb-6">
              {authors.map(author => (
                <span key={author} className="flex items-center gap-1 text-parchment-300 font-sans text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-500 inline-block" />
                  {author}
                </span>
              ))}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-6 text-sm font-sans text-parchment-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> {formatDate(pub.published_at)}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> {pub.view_count.toLocaleString()} views
              </span>
              <span className="flex items-center gap-1.5">
                <Download className="w-4 h-4" /> {pub.download_count.toLocaleString()} downloads
              </span>
              {pub.doi && (
                <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener"
                  className="flex items-center gap-1.5 text-gold-400 hover:text-gold-300 transition-colors">
                  <Hash className="w-4 h-4" /> {pub.doi} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Abstract */}
              <section>
                <h2 className="font-serif text-xl text-navy-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-gold-500 rounded-full inline-block" />
                  Abstract
                </h2>
                <p className="text-navy-700 font-sans leading-relaxed text-base">{pub.abstract}</p>
              </section>

              {/* Keywords */}
              {keywords.length > 0 && (
                <section>
                  <h3 className="font-sans font-semibold text-sm text-navy-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4" /> Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map(kw => (
                      <Link key={kw} href={`/publications?search=${encodeURIComponent(kw)}`}
                        className="px-3 py-1 rounded-full border border-parchment-300 text-sm text-navy-600 hover:bg-gold-50 hover:border-gold-400 hover:text-gold-700 transition-all">
                        {kw}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Full text, readable in place */}
              {pub.pdf_url && (
                <section>
                  <h2 className="font-serif text-xl text-navy-900 mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-gold-500 rounded-full inline-block" />
                    Full Text
                  </h2>
                  <PdfReaderPanel url={pub.pdf_url} title={pub.title} slug={pub.slug} />
                </section>
              )}

              {/* Citation */}
              <section className="bg-parchment-100 rounded-2xl p-6 border border-parchment-300">
                <h3 className="font-sans font-semibold text-sm text-navy-500 uppercase tracking-wider mb-3">
                  How to Cite
                </h3>
                <p className="font-mono text-xs text-navy-700 leading-relaxed select-all">
                  {authors.join(', ')}. ({new Date(pub.published_at).getFullYear()}). {pub.title}.
                  {pub.volume ? ` Prudent Journals, ${pub.volume}` : ' Prudent Journals'}
                  {pub.issue ? `(${pub.issue})` : ''}
                  {pub.pages ? `, ${pub.pages}` : ''}.
                  {pub.doi ? ` https://doi.org/${pub.doi}` : ''}
                </p>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Download */}
              <div className="card p-6 text-center">
                <BookOpen className="w-10 h-10 text-gold-500 mx-auto mb-3" />
                <h3 className="font-serif text-lg text-navy-900 mb-2">Full Text</h3>
                <p className="text-sm text-navy-500 font-sans mb-4">
                  Read it above, or take a copy. You can choose which pages.
                </p>
                <DownloadButton slug={pub.slug} pdfUrl={pub.pdf_url} />
              </div>

              {/* Details */}
              <div className="card p-6 space-y-4">
                <h3 className="font-sans font-semibold text-sm text-navy-500 uppercase tracking-wider">Details</h3>
                {[
                  { label: 'Published', value: formatDate(pub.published_at) },
                  { label: 'Type', value: pub.paper_type === 'conference' ? 'Conference Paper' : 'Journal Article' },
                  ...(pub.volume ? [{ label: 'Volume', value: pub.volume }] : []),
                  ...(pub.issue ? [{ label: 'Issue', value: pub.issue }] : []),
                  ...(pub.pages ? [{ label: 'Pages', value: pub.pages }] : []),
                  ...(pub.doi ? [{ label: 'DOI', value: pub.doi }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-xs text-navy-400 font-sans">{label}</span>
                    <span className="text-xs text-navy-700 font-sans text-right">{value}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
