# Things by K

> A full-stack e-commerce storefront for handmade goods and original photography, built with Next.js, Supabase, and Stripe.

## Overview

Things by K is a personal online shop and a real revenue-generating store. It supports guest and authenticated checkout, order history, and a product catalog backed by a Postgres database. Payments are handled entirely through Stripe Hosted Checkout — no card data ever touches the app.

The codebase is built to a spec with a clear structure that makes it easy to extend with new product categories, an admin dashboard, or email notifications down the road.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend + API | Next.js 16 (App Router, TypeScript) |
| Database + Auth | Supabase (Postgres + Auth + Storage) |
| Payments | Stripe Hosted Checkout + Webhooks |
| Hosting | Vercel |
| Styling | Tailwind CSS v3 |

## Prerequisites

- Node.js 20.9+
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account
- The [Stripe CLI](https://stripe.com/docs/stripe-cli) for local webhook testing

## Installation

**1. Clone the repo and install dependencies:**

```bash
git clone https://github.com/KyleJayMaxwell/things-by-k.git
cd things-by-k
npm install
```

**2. Set up environment variables:**

```bash
cp .env.local.example .env.local
```

Fill in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**3. Set up the database:**

Run these SQL files in order in your Supabase project's SQL Editor:

```
supabase/schema.sql          # tables, triggers, RLS policies
supabase/storage.sql         # product-images storage bucket
supabase/decrement-stock.sql # stock decrement function
supabase/seed.sql            # MVP postcard product
```

**4. Start the dev server:**

```bash
npm run dev
```

**5. Start the Stripe webhook listener** (in a separate terminal):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The CLI will print a `whsec_...` key — paste that into `STRIPE_WEBHOOK_SECRET` in your `.env.local`.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page (hero, featured products, about teaser)
│   ├── about/page.tsx              # About page
│   ├── shop/
│   │   ├── page.tsx                # Product catalog
│   │   └── [slug]/                 # Product detail page
│   ├── cart/page.tsx               # Shopping cart
│   ├── checkout/success/page.tsx   # Order confirmation
│   ├── account/
│   │   ├── login/page.tsx          # Sign in / register
│   │   ├── page.tsx                # Account dashboard
│   │   └── orders/                 # Order history + detail
│   └── api/
│       ├── checkout/route.ts       # Creates Stripe Checkout Session (rate-limited)
│       ├── webhooks/stripe/        # Handles payment confirmation → writes to Supabase
│       └── orders/[id]/            # Fetches order for success page
├── components/
│   ├── FadeIn.tsx                  # Scroll-triggered fade-in (IntersectionObserver)
│   ├── Navbar.tsx                  # Sticky nav with cart badge pop animation
│   ├── ProductCard.tsx             # Product grid card with hover lift
│   ├── CartItem.tsx                # Cart row with slide-out remove animation
│   └── ...                        # Button, Badge, Toast, QuantitySelector, etc.
├── context/CartContext.tsx         # Global cart state (localStorage)
├── lib/
│   ├── supabase/                   # Supabase client + server helpers
│   └── stripe.ts                  # Stripe singleton
└── types/index.ts                  # Shared TypeScript types
```

## Key User Flows

**Guest checkout:** Browse → Add to cart → Stripe Checkout → Order confirmation

**Registered checkout:** Same as above, with the order automatically linked to the user's account

**Account creation:** `/account/login` → Create Account tab → email confirmation → sign in

## Adding Products

1. Upload your photo to Supabase Storage under `product-images/your-product-slug/main.jpg`
2. Copy the public URL from the Storage dashboard
3. Insert a row into the `products` table via the Supabase Table Editor or SQL:

```sql
insert into public.products (name, slug, description, long_description, price, category, images, stock)
values (
  'Your Product Name',
  'your-product-slug',
  'Short description for the product card.',
  'Full description shown on the detail page.',
  1500,  -- price in cents ($15.00)
  'postcard',
  array['https://your-project.supabase.co/storage/v1/object/public/product-images/your-product-slug/main.jpg'],
  25
);
```

## Deployment

**1. Push to GitHub and import into Vercel:**

Connect your GitHub repo at [vercel.com/new](https://vercel.com/new). Vercel auto-detects Next.js.

**2. Add environment variables in Vercel:**

Copy all variables from your `.env.local` into Vercel's Environment Variables settings. Update `NEXT_PUBLIC_BASE_URL` to your production domain (e.g. `https://things-by-k.com`).

**3. Add your production Stripe webhook:**

In the Stripe Dashboard → Developers → Event Destinations → Add destination → Webhook endpoint:

```
https://things-by-k.com/api/webhooks/stripe
```

Select the `checkout.session.completed` event. Copy the signing secret into `STRIPE_WEBHOOK_SECRET` in Vercel, then redeploy.

**4. Point your domain to Vercel:**

In Vercel: Project Settings → Domains → add your domain.
In your registrar (e.g. Namecheap): switch to Custom DNS and enter:

```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

DNS propagation takes up to 48 hours. Vercel provisions SSL automatically.

**5. Switch to live Stripe keys:**

When ready to accept real payments, replace your test keys (`sk_test_...`, `pk_test_...`) with live keys (`sk_live_...`, `pk_live_...`) in Vercel's environment variables. Add a second webhook in Stripe live mode pointing at your domain. Redeploy.

> **Note:** Stripe requires business verification before live keys process real payments. Complete this in the Stripe Dashboard before switching keys.

## Security

- All tables have Row Level Security (RLS) enabled in Supabase
- The checkout API route is rate-limited to 5 requests per IP per minute
- Stripe webhook signature verification is enforced on every webhook request
- The Supabase service role key is server-side only — never prefixed with `NEXT_PUBLIC_`
- `.env.local` is gitignored — never committed

## What's Not in the MVP

These are straightforward to add:

- Admin dashboard for managing products and orders
- Order confirmation emails to customers
- Product filtering and search
- Digital downloads (for zines)
- OAuth sign-in (Google)
- Discount codes
- Cart sync to server for logged-in users

## License

Private — all rights reserved.