'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { proceedingsApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProceedingsDownloadButton({ slug, fileUrl }: { slug: string; fileUrl: string }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      await proceedingsApi.recordDownload(slug);
      window.open(fileUrl, '_blank');
    } catch {
      toast.error('Download failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleDownload} disabled={loading} className="btn-gold justify-center">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {loading ? 'Opening...' : 'Download Document'}
    </button>
  );
}
