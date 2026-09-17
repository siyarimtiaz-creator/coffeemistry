# Coffeemistry — Specialty Coffee, Crafted Moments

Coffeemistry is a luxury specialty coffee café web application in F-8/1, Islamabad. The platform provides an editorial digital café experience with full menu browsing, product details, customizable cart, pickup/delivery checkout with persistent order generation, WhatsApp order routing (+92 307 8263333), owner order management, and rich media delivery.

---

## Features

- **Cinematic Hero & Atmosphere**: Ambient steam and parallax effects, luxury espresso and champagne dark-glass visual aesthetic.
- **24-Product Curated Menu**: 6 confirmed categories (Espresso Based, Slow Bar, Sandwiches, Desserts, Beverages, Bakery Items) with accurate sizes, descriptions, and PKR pricing.
- **Product Details & Customization**: Modal view with high-definition product imagery, descriptions, and quick-add controls.
- **Cart & Order System**: Persistent localStorage cart with quantity adjustments (+/-), subtotal calculation, and instant drawer preview.
- **Checkout & WhatsApp Integration**: Guest checkout with contact validation, pickup/delivery address handling, order confirmation tracking (`CFM-XXXXXX`), and pre-formatted WhatsApp order dispatching.
- **Authentic Review Hub**: 4.4 rating, 469 customer reviews, authentic customer quotes, and interactive topic signals.
- **Location & Visit**: Exact café location at Shop 1 & 2, Block 8 Allahwali Market, F-8/1, Islamabad, Pakistan with interactive map, operating hours, and amenities.
- **Role-Gated Administration**: Protected owner order dashboard to view incoming orders and transition status (`new` → `confirmed` → `preparing` → `ready` → `completed`).
- **Comprehensive Image & Media System**: All 24 products backed by local high-resolution assets in `public/assets/products/` and `public/product/`, with responsive lazy loading and fallback placeholders.
- **SEO & Performance**: Open Graph metadata, semantic HTML5, Twitter cards, schema.org JSON-LD local business markup, sitemap.xml, robots.txt, and fast bundle chunking.

---

## Tech Stack

- **Frontend**: React 19, Vite 7, Tailwind CSS v4, Framer Motion, Wouter, Radix UI primitives, Lucide icons, Sonner toast notifications.
- **Backend**: Node.js, Express, tRPC v11, SuperJSON.
- **Database / ORM**: Drizzle ORM, MySQL2 (with built-in zero-config in-memory fallback for standalone development and offline testing).
- **Testing**: Vitest, TypeScript 5.9.

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+ (`npm install -g pnpm`)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment configuration
cp .env.example .env
```

### Development

```bash
# Start local development server with HMR
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Quality & Tests

```bash
# Type check with TypeScript compiler
pnpm check

# Run automated Vitest test suite
pnpm test
```

### Production Build & Run

```bash
# Compile client assets and server bundle
pnpm build

# Launch production server
pnpm start
```

---

## Deployment

The application compiles to a standalone Node.js server with bundled static assets in `dist/`:

- **Build Command**: `pnpm build`
- **Start Command**: `pnpm start`
- **Output Directory**: `dist/` (client bundle in `dist/public`)
- **Hosting Targets**: Node.js runtime (Railway, Render, AWS ECS/App Runner, DigitalOcean, Docker, Vercel Serverless).

---

## License

MIT © Coffeemistry
