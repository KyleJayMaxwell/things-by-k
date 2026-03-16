# Things by K

> A full-stack e-commerce storefront for handmade goods and original photography, built with Next.js, Supabase, and Stripe.

## Overview

Things by K is a personal online shop built as both a portfolio piece and a real revenue-generating store. It supports guest and authenticated checkout, order history, and a product catalog backed by a Postgres database. Payments are handled entirely through Stripe Hosted Checkout — no card data ever touches the app.

The codebase is an MVP built to a spec ([PRD](./things-by-k-prd.docx)), with a clear phase-by-phase structure that makes it easy to extend with new product categories, an admin dashboard, or email notifications down the road.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend + API | Next.js 15 (App Router) |
| Database + Auth | Supabase (Postgres + Auth + Storage) |
| Payments | Stripe Hosted Checkout + Webhooks |
| Hosting | Vercel |
| Styling | Tailwind CSS |

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account
- The [Stripe CLI](https://stripe.com/docs/stripe-cli) for local webhook testing

## Installation

**1. Clone the repo and install dependencies:**

```bash
git clone https://github.com/your-username/things-by-k.git
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
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

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
│   ├── page.tsx                    # Landing page
│   ├── shop/
│   │   ├── page.tsx                # Product catalog
│   │   └── [slug]/                 # Product detail page
│   ├── cart/page.tsx               # Shopping cart
│   ├── checkout/success/page.tsx   # Order confirmation
│   ├── account/
│   │   ├── login/page.tsx          # Sign in / register
│   │   ├── page.tsx                # Account dashboard
│   │   └── orders/                 # Order history + detail
│   ├── about/page.tsx              # About page
│   └── api/
│       ├── checkout/route.ts       # Creates Stripe Checkout Session
│       ├── webhooks/stripe/        # Handles payment confirmation
│       └── orders/[id]/            # Fetches order for success page
├── components/                     # Shared UI components
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

Copy all variables from your `.env.local` into Vercel's Environment Variables settings. Update `NEXT_PUBLIC_BASE_URL` to your production domain.

**3. Add your production Stripe webhook:**

In the Stripe Dashboard → Developers → Webhooks, add:
```
https://yourdomain.com/api/webhooks/stripe
```
Copy the signing secret into `STRIPE_WEBHOOK_SECRET` in Vercel.

**4. Point your Namecheap domain to Vercel:**

In Vercel: Project Settings → Domains → add your domain.
In Namecheap: Domain → Nameservers → Custom DNS → enter Vercel's nameservers:
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

DNS propagation takes up to 48 hours. Vercel provisions SSL automatically.

## What's Not in the MVP

These are scoped out but straightforward to add:

- Admin dashboard for managing products and orders
- Email notifications (order confirmation, shipping updates)
- Product filtering and search
- Digital downloads (for zines)
- OAuth sign-in (Google)
- Discount codes
- Cart sync to server for logged-in users

## License

Private — all rights reserved.