'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

/**
 * Registers the service worker and shows two pieces of ambient state:
 * when the connection has dropped, and when a newer version is ready.
 *
 * Both are deliberately quiet. They sit above the safe area so they do not
 * collide with the mobile navigation.
 */
export default function ServiceWorkerRegistrar() {
  const [offline, setOffline] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // An update was found while the page is open.
          reg.addEventListener('updatefound', () => {
            const installing = reg.installing;
            if (!installing) return;
            installing.addEventListener('statechange', () => {
              if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                setWaiting(installing);
                setUpdateReady(true);
              }
            });
          });
        })
        .catch(() => {
          // Registration failing must never break the page.
        });
    };

    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad);

    return () => window.removeEventListener('load', onLoad);
  }, []);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    setOffline(typeof navigator !== 'undefined' && !navigator.onLine);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  const applyUpdate = () => {
    waiting?.postMessage('skip-waiting');
    window.location.reload();
  };

  if (!offline && !updateReady) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] md:bottom-6 z-[70] flex justify-center px-4 pointer-events-none">
      {offline ? (
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-navy-900 text-parchment-100 px-4 py-2.5 shadow-lg border border-navy-700">
          <WifiOff className="w-4 h-4 text-gold-400 flex-shrink-0" />
          <span className="font-sans text-sm">
            You are offline. Saved pages are still available.
          </span>
        </div>
      ) : (
        <button
          onClick={applyUpdate}
          className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-navy-900 text-parchment-100 px-4 py-2.5 shadow-lg border border-navy-700 hover:bg-navy-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-gold-400 flex-shrink-0" />
          <span className="font-sans text-sm">A new version is ready. Tap to update.</span>
        </button>
      )}
    </div>
  );
}
