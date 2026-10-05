// src/app/privacy/page.tsx

import type { Metadata } from 'next'
import { CONTACT_EMAIL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What Things by K collects, why, and who it’s shared with.',
}

const SECTIONS: { heading: string; body: React.ReactNode }[] = [
  {
    heading: 'What I collect',
    body: (
      <>
        <p>Only what&apos;s needed to get your order to you:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Your name, email and shipping address.</li>
          <li>What you ordered, and any note you asked me to handwrite.</li>
          <li>If you make an account: your email, first name and your order history.</li>
        </ul>
      </>
    ),
  },
  {
    heading: 'Payments',
    body: (
      <p>
        Checkout is handled by Stripe. Your card details go straight to Stripe and never touch this
        site, and I never see or store them.
      </p>
    ),
  },
  {
    heading: 'Who it’s shared with',
    body: (
      <>
        <p>I never sell your information. It&apos;s only shared with the services that run the shop:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Stripe, to take payment.</li>
          <li>Supabase, which stores orders and accounts.</li>
          <li>Resend, which sends your order and shipping emails.</li>
          <li>Vercel, which hosts the site.</li>
          <li>USPS, which sees the address on your mail.</li>
        </ul>
      </>
    ),
  },
  {
    heading: 'Cookies',
    body: (
      <p>
        There are no ads or tracking cookies. The site only uses what it needs to work: your cart is
        saved in your browser, and a login cookie keeps you signed in if you have an account.
      </p>
    ),
  },
  {
    heading: 'Your choices',
    body: (
      <p>
        You can check out as a guest without an account. To see, change or delete what I have about
        you, email{' '}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-text-primary underline underline-offset-4 hover:text-primary transition-colors"
        >
          {CONTACT_EMAIL}
        </a>{' '}
        and I&apos;ll take care of it. I keep order records only as long as I need them for my
        business and taxes.
      </p>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <p className="text-xs tracking-widest text-text-secondary uppercase mb-4">Help</p>
      <h1 className="text-4xl sm:text-5xl font-light text-text-primary leading-tight mb-4">Privacy</h1>
      <p className="text-sm text-text-secondary mb-12">Last updated October 2026</p>

      <div className="divide-y divide-border border-y border-border">
        {SECTIONS.map(section => (
          <section key={section.heading} className="py-8">
            <h2 className="font-medium text-text-primary mb-3">{section.heading}</h2>
            <div className="space-y-3 text-text-secondary text-sm leading-relaxed">{section.body}</div>
          </section>
        ))}
      </div>
    </div>
  )
}
