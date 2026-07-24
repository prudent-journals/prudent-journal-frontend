'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { publicationsApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function DownloadButton({ slug, pdfUrl }: { slug: string; pdfUrl: string }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      await publicationsApi.recordDownload(slug);
      window.open(pdfUrl, '_blank');
    } catch {
      toast.error('Download failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleDownload} disabled={loading} className="btn-gold w-full justify-center">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {loading ? 'Opening...' : 'Download PDF'}
    </button>
  );
}
