import Link from 'next/link';
import { BookOpen, Mail, Globe, MapPin } from 'lucide-react';

interface Props {
  /**
   * On a phone the full four column footer is a long scroll past content the
   * bottom navigation already covers. Everywhere except the landing page it
   * collapses to a single compact line. The full footer still renders on
   * tablet and desktop regardless.
   */
  full?: boolean;
}

const PUBLICATION_LINKS = [
  { href: '/publications', label: 'Browse All' },
  { href: '/publications?type=journal', label: 'Journal Articles' },
  { href: '/publications?type=conference', label: 'Conference Papers' },
  { href: '/proceedings', label: 'Book of Proceedings' },
];

const AUTHOR_LINKS = [
  { href: '/submit', label: 'Submit Paper' },
  { href: '/auth/register', label: 'Create Account' },
  { href: '/conferences', label: 'Conferences' },
  { href: '/dashboard', label: 'My Dashboard' },
];

const INFO_LINKS = [
  { href: '/about', label: 'About Prudent Journals' },
  { href: '/about#editorial-board', label: 'Editorial Board' },
  { href: '/contact', label: 'Contact Us' },
];

function LinkColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="text-parchment-100 font-sans font-semibold text-sm uppercase tracking-wider mb-4">
        {title}
      </h2>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm text-parchment-400 hover:text-gold-400 transition-colors animated-underline"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer({ full = false }: Props) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-950 text-parchment-300">
      {/* Compact footer, phones only, on every page except the landing page. */}
      {!full && (
        <div className="md:hidden px-6 py-7 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 min-h-[40px]">
            <div className="w-7 h-7 rounded-lg bg-gold-500/20 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-gold-400" />
            </div>
            <span className="font-serif text-base text-parchment-100">
              Prudent<span className="text-gold-400"> Journals</span>
            </span>
          </Link>

          <div className="flex items-center justify-center gap-4 mb-4">
            {INFO_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs text-parchment-400 hover:text-gold-400 transition-colors inline-flex items-center min-h-[40px] px-1"
              >
                {l.label.replace('About Prudent Journals', 'About')}
              </Link>
            ))}
          </div>

          <p className="text-[11px] text-parchment-600 leading-relaxed">
            © {year} Prudent Journal Ltd
            <span className="mx-1.5 text-parchment-700">·</span>
            RC <span className="font-mono">9613688</span>
          </p>
        </div>
      )}

      {/* Full footer: always on tablet and desktop, and on the landing page. */}
      <div className={`${full ? '' : 'hidden md:block'} max-w-7xl mx-auto px-6 pt-16 pb-8`}>
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 py-1">
              <div className="w-8 h-8 rounded-lg bg-gold-500/20 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-gold-400" />
              </div>
              <span className="font-serif text-lg text-parchment-100">
                Prudent<span className="text-gold-400"> Journals</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-parchment-400 mb-4">
              An independent academic publisher advancing knowledge through open access research.
            </p>
            <div className="flex flex-col gap-2 text-xs text-parchment-500">
              <span className="flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Bori, Rivers State, Nigeria
              </span>
              <span className="flex items-center gap-2">
                <Mail className="w-3 h-3" /> journal@prudentjournals.com
              </span>
              <span className="flex items-center gap-2">
                <Globe className="w-3 h-3" /> prudentjournals.com
              </span>
            </div>
          </div>

          <LinkColumn title="Publications" links={PUBLICATION_LINKS} />
          <LinkColumn title="For Authors" links={AUTHOR_LINKS} />
          <LinkColumn title="Information" links={INFO_LINKS} />
        </div>

        {/* Bottom bar carries the registered entity, per the certificate of incorporation. */}
        <div className="border-t border-navy-800 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="text-xs text-parchment-500 text-center md:text-left space-y-1">
            <p>© {year} Prudent Journal Ltd. All rights reserved.</p>
            <p className="text-parchment-600">
              Incorporated in the Federal Republic of Nigeria
              <span className="mx-1.5 text-parchment-700">·</span>
              RC <span className="font-mono text-parchment-500">9613688</span>
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-parchment-600">ISSN (Online): </span>
            <span className="text-xs text-parchment-400 font-mono">XXXX-XXXX</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
