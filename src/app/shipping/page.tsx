// src/app/shipping/page.tsx

import type { Metadata } from 'next'
import { DELIVERY_WEEKS, HANDWRITTEN_POSTCARD_RATES } from '@/lib/shipping'
import { formatPrice } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Shipping & Returns',
  description: 'How handwritten postcards work, when orders ship, and what happens if mail goes missing.',
}

const SECTIONS: { question: string; answer: React.ReactNode }[] = [
  {
    question: 'How do handwritten postcards work?',
    answer: (
      <>
        <p>
          Every handwritten card is written by hand on the postcard you picked, then stamped and
          sent through USPS like a real postcard, no envelope.
        </p>
        <p>When you order one, the note box can go a few ways:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <span className="text-text-primary">A gift for someone.</span> Write your message and
            enter their address at checkout. Your note is copied onto the card for them.
          </li>
          <li>
            <span className="text-text-primary">A surprise for yourself.</span> Share a little
            inspiration (a favorite place, a memory, something you need to hear) and your note is
            written with it in mind.
          </li>
          <li>
            <span className="text-text-primary">Leave it blank.</span> You get a freestyle note in
            the shop&apos;s own words and style.
          </li>
        </ul>
        <p>
          Something fun in the mailbox instead of bills. That&apos;s the whole idea, and it keeps
          snail mail, the post office and small creatives going.
        </p>
      </>
    ),
  },
  {
    question: 'Are there notes the shop won’t write?',
    answer: (
      <p>
        Yes. If a note&apos;s subject or wording isn&apos;t something Things by K is comfortable
        writing, you&apos;ll get an email and a full refund for that card.
      </p>
    ),
  },
  {
    question: 'When will my order ship?',
    answer: (
      <p>
        Every order is mailed within one business week. An order placed on a Monday goes out by the
        following Monday. Weekend orders count from the next business day, and holidays don&apos;t
        count.
      </p>
    ),
  },
  {
    question: 'How much is shipping?',
    answer: (
      <>
        <p>
          Handwritten postcards travel on their own as real postcards:{' '}
          {formatPrice(HANDWRITTEN_POSTCARD_RATES.domestic)} each in the US and{' '}
          {formatPrice(HANDWRITTEN_POSTCARD_RATES.international)} each internationally.
        </p>
        <p>
          Blank postcards and everything else ship together, protected in a padded envelope or box,
          for one flat rate per order. You&apos;ll see the exact amount in your cart before checkout.
        </p>
      </>
    ),
  },
  {
    question: 'How long does mail take?',
    answer: (
      <p>
        Once it&apos;s in the mail it&apos;s in the postal service&apos;s hands, so timing depends on
        where it&apos;s going. Most mail within the US arrives within {DELIVERY_WEEKS.domestic} weeks,
        and international mail within {DELIVERY_WEEKS.international} weeks. Postcards don&apos;t have
        tracking. You&apos;ll get an email when your order ships.
      </p>
    ),
  },
  {
    question: 'What if it gets lost?',
    answer: (
      <p>
        If it hasn&apos;t arrived {DELIVERY_WEEKS.domestic} weeks after the shipping email (US), or{' '}
        {DELIVERY_WEEKS.international} weeks (international), just reply to that email for a free
        replacement.
      </p>
    ),
  },
  {
    question: 'What if it arrives damaged?',
    answer: (
      <p>
        If a blank postcard or anything else shipped in an envelope or box arrives damaged, email a
        photo within 3 months of your purchase and, depending on the damage, it&apos;s replaced for
        free. Handwritten postcards travel through the mail on their own, so a little wear from
        handling is part of the charm and isn&apos;t covered.
      </p>
    ),
  },
  {
    question: 'Can I return something?',
    answer: (
      <p>
        Things by K doesn&apos;t accept returns. Postcards are easily damaged on the way back, so
        instead anything that&apos;s lost or arrives damaged is replaced, as above.
      </p>
    ),
  },
]

export default function ShippingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <p className="text-xs tracking-widest text-text-secondary uppercase mb-4">Help</p>
      <h1 className="text-4xl sm:text-5xl font-light text-text-primary leading-tight mb-12">
        Shipping &amp; Returns
      </h1>

      {/* Each question opens on click so the page stays short */}
      <div className="divide-y divide-border border-y border-border">
        {SECTIONS.map(section => (
          <details key={section.question} className="group">
            <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden font-medium text-text-primary hover:text-primary transition-colors focus-ring rounded">
              {section.question}
              <svg
                className="w-4 h-4 flex-shrink-0 text-text-secondary transition-transform duration-200 group-open:rotate-180"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </summary>
            <div className="pb-6 space-y-3 text-text-secondary text-sm leading-relaxed">
              {section.answer}
            </div>
          </details>
        ))}
      </div>

      <div className="mt-12 space-y-4 text-text-primary leading-relaxed">
        <p>
          Thank you for your support and the time you spent looking. Even if you aren&apos;t buying
          anything, it means a lot that you stopped by.
        </p>
        <p>– Things by K</p>
      </div>
    </div>
  )
}
