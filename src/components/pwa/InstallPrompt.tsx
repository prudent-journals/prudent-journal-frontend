'use client';

import { useEffect, useState } from 'react';
import { X, Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'pj_install_dismissed';

/**
 * Offers installation once the browser says the app qualifies.
 *
 * Deliberately restrained: it waits for a real visit rather than appearing
 * immediately, and a dismissal is remembered so it does not nag. iOS has no
 * install event, so there it explains the manual step instead.
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    if (localStorage.getItem(DISMISSED_KEY)) return;

    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const safari = /safari/i.test(window.navigator.userAgent) &&
      !/chrome|crios|fxios/i.test(window.navigator.userAgent);
    setIsIos(ios && safari);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      // Let the visitor look around first.
      window.setTimeout(() => setVisible(true), 20000);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);

    if (ios && safari) {
      window.setTimeout(() => setVisible(true), 25000);
    }

    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted' || outcome === 'dismissed') dismiss();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] md:bottom-6 md:right-6 md:left-auto md:inset-x-auto z-[65] px-4 md:px-0">
      <div className="mx-auto md:mx-0 max-w-sm rounded-2xl bg-navy-900 border border-navy-700 shadow-2xl p-4 flex gap-3">
        <div className="w-11 h-11 rounded-xl bg-gold-500/15 flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-gold-400" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-serif text-parchment-50">Install Prudent Journals</p>
          {isIos ? (
            <p className="font-sans text-sm text-parchment-300 leading-relaxed mt-1">
              Tap <Share className="w-3.5 h-3.5 inline mx-0.5 -mt-0.5" /> then
              {' '}<span className="text-parchment-100">Add to Home Screen</span> to read offline.
            </p>
          ) : (
            <p className="font-sans text-sm text-parchment-300 leading-relaxed mt-1">
              Add it to your home screen to read offline and open it like an app.
            </p>
          )}

          {!isIos && (
            <button
              onClick={install}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gold-500 text-navy-950 px-4 py-2 text-sm font-sans font-semibold hover:bg-gold-400 transition-colors"
            >
              <Download className="w-4 h-4" /> Install
            </button>
          )}
        </div>

        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-navy-400 hover:text-parchment-200 hover:bg-navy-800 transition-colors flex-shrink-0 self-start"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
