# Prudent Journals Frontend

**Next.js 14 · TypeScript · Tailwind CSS · Framer Motion**

The public-facing and dashboard frontend for the Prudent Journals academic publishing platform.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS (custom academic theme) |
| State Management | Zustand (with persistence) |
| Forms | React Hook Form + Zod |
| HTTP Client | Axios |
| Animations | Framer Motion + CSS keyframes |
| File Upload | React Dropzone |
| Notifications | React Hot Toast |
| Fonts | Playfair Display, DM Sans, Cormorant Garamond, JetBrains Mono |

---

## Project Structure

```
prudent-journal-frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, fonts, toast provider
│   │   ├── globals.css             # Design system: tokens, components, animations
│   │   ├── page.tsx                # Public homepage
│   │   ├── sitemap.ts              # Dynamic SEO sitemap
│   │   ├── robots.ts               # Robots.txt config
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── publications/
│   │   │   ├── page.tsx            # Search + paginated listing
│   │   │   └── [slug]/page.tsx     # SEO-optimised detail page
│   │   ├── conferences/
│   │   │   ├── page.tsx            # All conferences
│   │   │   └── [id]/page.tsx       # Detail + registration
│   │   ├── submit/page.tsx         # Paper submission form
│   │   ├── dashboard/
│   │   │   ├── layout.tsx          # Sidebar layout (auth-guarded)
│   │   │   ├── page.tsx            # Overview stats
│   │   │   ├── papers/page.tsx     # Author's submissions
│   │   │   ├── notifications/page.tsx
│   │   │   └── profile/page.tsx
│   │   └── admin/
│   │       ├── layout.tsx          # Dark sidebar (admin-guarded)
│   │       ├── page.tsx            # Admin overview
│   │       ├── papers/
│   │       │   ├── page.tsx        # All submissions table
│   │       │   └── [id]/page.tsx   # Full paper management
│   │       ├── users/page.tsx
│   │       ├── conferences/page.tsx
│   │       └── blog/page.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx          # Sticky nav, profile dropdown
│   │   │   └── Footer.tsx
│   │   └── ui/
│   │       └── DownloadButton.tsx
│   ├── lib/
│   │   ├── api.ts                  # Axios client + all API methods
│   │   ├── auth-store.ts           # Zustand auth store
│   │   └── utils.ts                # cn(), formatDate(), status helpers
│   └── types/
│       └── index.ts                # All TypeScript types
├── public/
├── tailwind.config.js              # Custom academic color palette + animations
├── next.config.js
├── tsconfig.json
└── Dockerfile
```

---

## Design System

### Color Palette
- **Navy** (`navy-50` to `navy-950`) - primary dark tones
- **Gold** (`gold-50` to `gold-900`) - accent, calls to action
- **Parchment** (`parchment-50` to `parchment-500`) - warm background tones

### Typography
- **Display headings** - Cormorant Garamond (editorial, literary)
- **Section headings** - Playfair Display (serif authority)
- **Body / UI** - DM Sans (clean, readable)
- **Code / IDs** - JetBrains Mono

### Utility Classes
```css
.btn-primary     /* Navy filled button */
.btn-gold        /* Gold accent button */
.btn-outline     /* Navy border button */
.btn-ghost       /* Transparent hover button */
.input-base      /* Consistent form input */
.card            /* White rounded card with shadow */
.badge           /* Inline status/type pill */
.heading-display /* Cormorant Garamond style */
.glass           /* Frosted glass card (light) */
.glass-dark      /* Frosted glass card (dark) */
.text-gradient-gold  /* Animated gold gradient text */
.animated-underline  /* Hover underline animation */
.stagger-children    /* CSS-only staggered entrance */
```

---

## Local Development

### Prerequisites
- Node.js 20+

### Setup

```bash
cd prudent-journal-frontend
npm install

# Configure environment
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

npm run dev
```

Frontend at: http://localhost:3000

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_SITE_NAME` | Site name for metadata |
| `NEXT_PUBLIC_SITE_URL` | Full site URL (for sitemap, OG tags) |

---

## SEO Features

- **Server-side rendering** for all publication pages
- **Dynamic sitemap** at `/sitemap.xml` - auto-includes all publication slugs
- **Robots.txt** - allows scholar crawlers, blocks admin paths
- **OpenGraph** and **Twitter card** metadata on every page
- **Schema.org `ScholarlyArticle`** structured data on publication pages
- **Citation meta tags** (`citation_title`, `citation_author`, `citation_pdf_url`) for Google Scholar indexing
- **Revalidation** - publication pages cache for 1 hour, auto-refresh

---

## Page Structure

### Public Pages (no auth required)
| Route | Description |
|---|---|
| `/` | Homepage with stats, recent pubs, conferences |
| `/publications` | Searchable/filterable publications list |
| `/publications/[slug]` | Full publication detail with PDF download |
| `/conferences` | All conferences |
| `/conferences/[id]` | Conference detail + registration |
| `/news` | Blog/announcements |
| `/submit` | Paper submission form |

### Auth Pages
| Route | Description |
|---|---|
| `/auth/login` | Sign in |
| `/auth/register` | Create account |
| `/auth/forgot-password` | Request reset |
| `/auth/reset-password` | Set new password |

### Dashboard (auth required)
| Route | Description |
|---|---|
| `/dashboard` | Overview + recent activity |
| `/dashboard/papers` | My submissions + status |
| `/dashboard/papers/[id]` | Individual paper detail |
| `/dashboard/notifications` | All notifications |
| `/dashboard/profile` | Edit profile + avatar |

### Admin Panel (admin roles only)
| Route | Description |
|---|---|
| `/admin` | Stats overview |
| `/admin/papers` | All submissions table |
| `/admin/papers/[id]` | Full paper management |
| `/admin/users` | User management |
| `/admin/conferences` | Conference management |
| `/admin/publications` | Published papers |
| `/admin/blog` | Blog post management |
