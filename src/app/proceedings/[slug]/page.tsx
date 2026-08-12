import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Eye, Download, ArrowLeft, FileText } from 'lucide-react';
import { ConferenceProceedings } from '@/types';
import { formatDate } from '@/lib/utils';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import ProceedingsPdfPanel from './PdfPanel';
import ProceedingsDownloadButton from './DownloadButton';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function getProceedings(slug: string): Promise<ConferenceProceedings | null> {
  try {
    const res = await fetch(`${API}/proceedings/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getProceedings(slug);
  if (!item) return { title: 'Proceedings Not Found' };
  return {
    title: `${item.title} - Book of Proceedings`,
    description: item.conference_title
      ? `Book of proceedings for ${item.conference_title}, published by Prudent Journals.`
      : `${item.title}, published by Prudent Journals.`,
  };
}

export default async function ProceedingsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getProceedings(slug);
  if (!item) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="bg-hero-gradient py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <Link href="/proceedings" className="inline-flex items-center gap-2 text-parchment-400 hover:text-gold-400 text-sm font-sans mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Proceedings
            </Link>

            <span className="badge bg-gold-800/50 text-gold-300 inline-flex items-center gap-1 mb-4">
              <FileText className="w-3 h-3" /> {item.file_type.toUpperCase()}
            </span>

            <h1 className="font-serif text-2xl lg:text-4xl text-parchment-50 leading-tight mb-3">
              {item.title}
            </h1>

            {item.conference_title && (
              <p className="text-parchment-300 font-sans mb-6">{item.conference_title}</p>
            )}

            <div className="flex flex-wrap gap-6 text-sm font-sans text-parchment-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> {formatDate(item.created_at)}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> {item.view_count.toLocaleString()} views
              </span>
              <span className="flex items-center gap-1.5">
                <Download className="w-4 h-4" /> {item.download_count.toLocaleString()} downloads
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-10">
          {item.file_type === 'pdf' ? (
            <ProceedingsPdfPanel url={item.file_url} title={item.title} slug={item.slug} />
          ) : (
            <div className="card p-10 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-navy-300" />
              <p className="font-sans text-navy-600 mb-6">
                This book of proceedings is a Word document. Download it to read the full text.
              </p>
              <ProceedingsDownloadButton slug={item.slug} fileUrl={item.file_url} />
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
