// src/app/terms/page.tsx

import type { Metadata } from 'next'
import Link from 'next/link'
import { CONTACT_EMAIL, LOCATION } from '@/lib/site'
import { DELIVERY_WEEKS } from '@/lib/shipping'

export const metadata: Metadata = {
  title: 'Terms',
  description: 'The terms for ordering from and using Things by K.',
}

const LINK = 'text-text-primary underline underline-offset-4 hover:text-botan transition-colors focus-ring rounded'

const SECTIONS: { heading: string; body: React.ReactNode }[] = [
  {
    heading: 'Orders and payment',
    body: (
      <>
        <p>
          All prices are in US dollars. Shipping is shown in your cart before you check out. Payment
          is handled by Stripe, and your order is confirmed once you get an order email with a TBK
          number.
        </p>
        <p>
          I may cancel an order and give you a full refund if an item sells out, a price was listed
          by mistake, or I can&apos;t fill the order for another reason. If that happens, I&apos;ll
          email you.
        </p>
      </>
    ),
  },
  {
    heading: 'Handwritten notes',
    body: (
      <p>
        If you order a handwritten postcard, you&apos;re responsible for what you ask me to write and
        who you send it to. I may decline a note I&apos;m not comfortable writing, such as one
        that&apos;s hateful, threatening or harassing. If I do, I&apos;ll refund that item in full.
        Every note is written by hand, so the handwriting and layout will vary a little from card
        to card.
      </p>
    ),
  },
  {
    heading: 'Shipping, returns and refunds',
    body: (
      <>
        <p>
          Orders usually go out within one business week. Delivery times and rates are on the{' '}
          <Link href="/shipping" className={LINK}>Shipping &amp; Returns</Link> page, which is part
          of these terms.
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <span className="text-text-primary">Returns:</span> I don&apos;t accept returns.
          </li>
          <li>
            <span className="text-text-primary">Lost mail:</span> If your order hasn&apos;t arrived
            after {DELIVERY_WEEKS.domestic} weeks in the US or {DELIVERY_WEEKS.international} weeks
            internationally, email me and I&apos;ll send it again for free.
          </li>
          <li>
            <span className="text-text-primary">Damaged items:</span> If a blank postcard or anything
            else I ship in an envelope or box arrives damaged, email me a photo within 3 months and
            I&apos;ll send a free replacement. Handwritten postcards travel through the mail on their
            own with no envelope, so wear from handling is part of the charm and isn&apos;t covered.
          </li>
          <li>
            <span className="text-text-primary">Refunds:</span> Any refund goes back to your original
            payment method through Stripe.
          </li>
        </ul>
        <p>
          Colors can look a little different on screen than in print. Each card is trimmed after
          printing, so the edges may be cropped slightly differently than the photos on the site.
        </p>
      </>
    ),
  },
  {
    heading: 'Accounts',
    body: (
      <p>
        You can check out as a guest, so you never need an account to order. If you make one, keep
        your login private, since you&apos;re responsible for orders placed with it. I may close an
        account that&apos;s being misused. To delete your account, email me.
      </p>
    ),
  },
  {
    heading: 'Age',
    body: (
      <p>
        You need to be 18 or older to order, or have a parent or guardian place the order for you.
        This site isn&apos;t meant for children under 13, and I don&apos;t knowingly collect their
        information.
      </p>
    ),
  },
  {
    heading: 'Photos and designs',
    body: (
      <p>
        Every photo, design and piece of writing on this site belongs to Things by K. When you buy a
        postcard, you own that card and can mail it, frame it or give it away. Buying a card
        doesn&apos;t let you copy, resell or reproduce the image, and that includes using it for AI
        training.
      </p>
    ),
  },
  {
    heading: 'Limits',
    body: (
      <p>
        I work hard to keep the site accurate and running, but it&apos;s provided as is, and there
        may be the occasional typo or outage. As far as the law allows, Things by K isn&apos;t liable
        for indirect losses. My total responsibility for any order is limited to what you paid for
        it. Nothing here takes away rights you have under consumer protection law.
      </p>
    ),
  },
  {
    heading: 'Governing law',
    body: <p>These terms are governed by the laws of the State of California, USA.</p>,
  },
  {
    heading: 'Changes',
    body: (
      <p>
        I may update these terms as the shop grows. The date at the top of this page shows the last
        change, and the terms in effect when you placed your order apply to that order.
      </p>
    ),
  },
  {
    heading: 'Contact',
    body: (
      <p>
        Things by K is a small shop based in {LOCATION}. If you have questions, email{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className={LINK}>{CONTACT_EMAIL}</a>.
      </p>
    ),
  },
]

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <p className="text-xs tracking-widest text-text-secondary uppercase mb-4">Help</p>
      <h1 className="text-4xl sm:text-5xl font-light text-text-primary leading-tight mb-4">Terms of Service</h1>
      <p className="text-sm text-text-secondary mb-6">Last updated October 2026</p>
      <p className="text-text-secondary text-sm leading-relaxed mb-12">
        These terms apply to everyone who uses things-by-k.com or places an order. By placing an
        order or creating an account, you agree to them and to the{' '}
        <Link href="/privacy" className={LINK}>Privacy</Link> policy.
      </p>
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
