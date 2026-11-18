// src/lib/email.tsx
// Resend client + transactional email templates
// Server-only — never import in Client Components

import { Resend } from 'resend'
import { CARRIER_NAMES, trackingUrl, type Carrier } from '@/lib/tracking'
import { untrackedMailNote, type Destination } from '@/lib/shipping'
import { formatPrice } from '@/lib/format'

let client: Resend | null = null

// Created on first send rather than at import, so `next build` doesn't need the key
function getResend(): Resend {
  if (!client) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('Missing RESEND_API_KEY environment variable')
    }
    client = new Resend(process.env.RESEND_API_KEY)
  }
  return client
}

const FROM = 'Things by K <hello@things-by-k.com>'

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderItem {
  name: string
  quantity: number
  price: number // in cents
}

interface ShippingAddress {
  name?: string
  line1: string
  line2?: string | null
  city: string
  state: string
  postal_code: string
  country: string
}

interface SendOrderConfirmationParams {
  to: string
  orderNumber: string
  items: OrderItem[]
  subtotal: number      // cents
  shippingCost: number  // cents
  tax: number           // cents
  total: number         // cents
  shippingAddress: ShippingAddress
}

// ── Shared layout ─────────────────────────────────────────────────────────────
// Same look as the Supabase sign-in emails: purple header with the wordmark image
// (email apps can't load the Old London font), white card, footer. Site palette colors.

const SITE_URL = 'https://www.things-by-k.com'

function emailLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F4F3F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F3F1;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:12px;overflow:hidden;">
          <tr>
            <td align="center" style="background:#5F4489;padding:22px 24px 18px;border-bottom:2px solid #935B66;">
              <a href="${SITE_URL}" style="text-decoration:none;color:#FFFFFF;">
                <img src="${SITE_URL}/email/wordmark.png" width="200" alt="Things by K" style="display:block;width:200px;height:auto;border:0;color:#FFFFFF;font-family:Georgia,serif;font-size:26px;">
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 36px 36px;">
${body}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 36px 28px;border-top:1px solid #ECEAE8;">
              <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#6E6A6A;">
                Questions? Reply to this email or reach Things by K at
                <a href="mailto:hello@things-by-k.com" style="color:#6E6A6A;text-decoration:underline;">hello@things-by-k.com</a>.
              </p>
              <p style="margin:0;font-size:12px;line-height:1.6;color:#6E6A6A;">
                Things by K &middot; San Francisco, California &middot;
                <a href="${SITE_URL}" style="color:#6E6A6A;text-decoration:underline;">things-by-k.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ── Order Confirmation ────────────────────────────────────────────────────────

export async function sendOrderConfirmation(params: SendOrderConfirmationParams) {
  const {
    to,
    orderNumber,
    items,
    subtotal,
    shippingCost,
    tax,
    total,
    shippingAddress,
  } = params

  const addr = shippingAddress
  const addressLines = [
    addr.name,
    addr.line1,
    addr.line2,
    `${addr.city}, ${addr.state} ${addr.postal_code}`,
    addr.country,
  ]
    .filter(Boolean)
    .join('\n')

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `Order confirmed — ${orderNumber}`,
    html: orderConfirmationHtml({
      orderNumber,
      items,
      subtotal,
      shippingCost,
      tax,
      total,
      addressLines,
    }),
    text: orderConfirmationText({
      orderNumber,
      items,
      subtotal,
      shippingCost,
      tax,
      total,
      addressLines,
      to,
    }),
  })

  if (error) {
    console.error('Failed to send order confirmation email:', error)
    throw new Error(`Email send failed: ${error.message}`)
  }

  return data
}

// ── HTML Template ─────────────────────────────────────────────────────────────

interface TemplateParams {
  orderNumber: string
  items: OrderItem[]
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  addressLines: string
  to?: string
}

function orderConfirmationHtml(p: TemplateParams): string {
  const itemRows = p.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #ECEAE8;color:#171717;font-size:14px;">
          ${escapeHtml(item.name)} &times; ${item.quantity}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #ECEAE8;color:#171717;font-size:14px;text-align:right;">
          ${formatPrice(item.price * item.quantity)}
        </td>
      </tr>`
    )
    .join('')

  return emailLayout(`Order Confirmed — ${p.orderNumber}`, `

              <!-- Checkmark -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;padding-bottom:24px;">
                    <div style="display:inline-block;width:52px;height:52px;background:#F4F3F1;color:#171717;border-radius:50%;line-height:52px;text-align:center;font-size:24px;">
                      ✓
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;padding-bottom:8px;">
                    <h1 style="margin:0;font-size:22px;font-weight:600;color:#171717;">
                      Order confirmed!
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;padding-bottom:32px;">
                    <p style="margin:0;font-size:14px;color:#6E6A6A;">
                      Thanks for your order. It'll be packed up and on its way soon.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Order number -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F3F1;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:12px 16px;">
                    <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#171717;font-weight:600;">
                      Order number
                    </p>
                    <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:#171717;">
                      ${p.orderNumber}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Items -->
              <p style="margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#6E6A6A;font-weight:600;">
                Items
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                ${itemRows}
              </table>

              <!-- Totals -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #ECEAE8;padding-top:16px;margin-bottom:28px;">
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:#6E6A6A;">Subtotal</td>
                  <td style="padding:4px 0;font-size:14px;color:#171717;text-align:right;">${formatPrice(p.subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:#6E6A6A;">Shipping</td>
                  <td style="padding:4px 0;font-size:14px;color:#171717;text-align:right;">${formatPrice(p.shippingCost)}</td>
                </tr>
                ${p.tax > 0 ? `<tr>
                  <td style="padding:4px 0;font-size:14px;color:#6E6A6A;">Sales tax</td>
                  <td style="padding:4px 0;font-size:14px;color:#171717;text-align:right;">${formatPrice(p.tax)}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding:12px 0 0;font-size:16px;font-weight:600;color:#171717;">Total</td>
                  <td style="padding:12px 0 0;font-size:16px;font-weight:600;color:#171717;text-align:right;">${formatPrice(p.total)}</td>
                </tr>
              </table>

              <!-- Shipping address -->
              <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#6E6A6A;font-weight:600;">
                Shipping to
              </p>
              <p style="margin:0;font-size:14px;color:#171717;white-space:pre-line;line-height:1.6;">${escapeHtml(p.addressLines)}</p>
`)
}

// ── Plain-text fallback ───────────────────────────────────────────────────────

function orderConfirmationText(p: TemplateParams & { to: string }): string {
  const itemLines = p.items
    .map((item) => `  ${item.name} x${item.quantity}  ${formatPrice(item.price * item.quantity)}`)
    .join('\n')

  return `Things by K — Order Confirmed

Order number: ${p.orderNumber}

Thanks for your order! It'll be packed up and on its way soon.

ITEMS
${itemLines}

Subtotal:  ${formatPrice(p.subtotal)}
Shipping:  ${formatPrice(p.shippingCost)}
${p.tax > 0 ? `Sales tax: ${formatPrice(p.tax)}\n` : ''}Total:     ${formatPrice(p.total)}

SHIPPING TO
${p.addressLines}

Questions? Reply to this email or reach Things by K at hello@things-by-k.com

© ${new Date().getFullYear()} Things by K
`
}
// ── Shipping Update ───────────────────────────────────────────────────────────

interface SendShippingUpdateParams {
  to: string
  orderNumber: string
  recipientName?: string
  items: OrderItem[]
  carrier?: Carrier | null
  trackingNumber?: string | null
  destination: Destination
}

export async function sendShippingUpdate(params: SendShippingUpdateParams) {
  const { to, orderNumber, recipientName, items, carrier, trackingNumber, destination } = params

  const tracking = carrier && trackingNumber
    ? {
        carrierName: carrier === 'other' ? 'Carrier' : CARRIER_NAMES[carrier],
        number: trackingNumber,
        url: trackingUrl(carrier, trackingNumber),
      }
    : null

  // No tracking number: explain how it was sent and when to reach out
  const untrackedNote = tracking ? null : untrackedMailNote(destination)

  const firstName = recipientName?.trim().split(/\s+/)[0] ?? ''
  const greeting = firstName ? `Good news, ${firstName}!` : 'Good news!'

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `Your order has shipped — ${orderNumber}`,
    html: shippingUpdateHtml({ orderNumber, greeting, items, tracking, untrackedNote }),
    text: shippingUpdateText({ orderNumber, greeting, items, tracking, untrackedNote }),
  })

  if (error) {
    console.error('Failed to send shipping update email:', error)
    throw new Error(`Email send failed: ${error.message}`)
  }

  return data
}

interface ShippingTemplateParams {
  orderNumber: string
  greeting: string
  items: OrderItem[]
  tracking: { carrierName: string; number: string; url: string | null } | null
  untrackedNote: string | null
}

function shippingUpdateHtml(p: ShippingTemplateParams): string {
  const itemRows = p.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #ECEAE8;color:#171717;font-size:14px;">
          ${escapeHtml(item.name)} &times; ${item.quantity}
        </td>
      </tr>`
    )
    .join('')

  const trackingBlock = p.tracking
    ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F3F1;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:12px 16px;">
                    <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#171717;font-weight:600;">
                      Tracking (${escapeHtml(p.tracking.carrierName)})
                    </p>
                    <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:#171717;">
                      ${escapeHtml(p.tracking.number)}
                    </p>
                  </td>
                </tr>
              </table>
              ${p.tracking.url ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="text-align:center;">
                    <a href="${escapeHtml(p.tracking.url)}" style="display:inline-block;background:#171717;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
                      Track your package
                    </a>
                  </td>
                </tr>
              </table>` : ''}`
    : p.untrackedNote
    ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F3F1;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:14px 16px;font-size:14px;line-height:1.6;color:#171717;">
                    ${escapeHtml(p.untrackedNote)}
                  </td>
                </tr>
              </table>`
    : ''

  return emailLayout(`Your order has shipped — ${p.orderNumber}`, `

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;padding-bottom:8px;">
                    <h1 style="margin:0;font-size:22px;font-weight:600;color:#171717;">
                      ${escapeHtml(p.greeting)}
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;padding-bottom:32px;">
                    <p style="margin:0;font-size:14px;color:#6E6A6A;">
                      Your order ${p.orderNumber} is packed up and on its way.
                    </p>
                  </td>
                </tr>
              </table>
${trackingBlock}
              <!-- Items -->
              <p style="margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#6E6A6A;font-weight:600;">
                In this package
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemRows}
              </table>
`)
}

function shippingUpdateText(p: ShippingTemplateParams): string {
  const itemLines = p.items.map((item) => `  ${item.name} x${item.quantity}`).join('\n')
  const trackingLines = p.tracking
    ? `\nTRACKING (${p.tracking.carrierName})\n${p.tracking.number}${p.tracking.url ? `\n${p.tracking.url}` : ''}\n`
    : p.untrackedNote
    ? `\n${p.untrackedNote}\n`
    : ''

  return `Things by K — Your order has shipped

${p.greeting} Your order ${p.orderNumber} is packed up and on its way.
${trackingLines}
IN THIS PACKAGE
${itemLines}

Questions? Reply to this email or reach Things by K at hello@things-by-k.com

© ${new Date().getFullYear()} Things by K
`
}

// ── Refund Notice ─────────────────────────────────────────────────────────────

interface SendRefundNoticeParams {
  to: string
  orderNumber: string
  recipientName?: string
  amount: number  // cents
}

export async function sendRefundNotice(params: SendRefundNoticeParams) {
  const { to, orderNumber, recipientName, amount } = params
  const firstName = recipientName?.trim().split(/\s+/)[0] ?? ''
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,'
  const body = `Your order ${orderNumber} has been refunded. ${formatPrice(amount)} is on its way back to your original payment method. Depending on your bank, it can take 5–10 business days to show up.`

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `Your refund is on its way — ${orderNumber}`,
    html: refundNoticeHtml({ orderNumber, greeting, body }),
    text: `Things by K — Your refund is on its way

${greeting}

${body}

Questions? Reply to this email or reach Things by K at hello@things-by-k.com

© ${new Date().getFullYear()} Things by K
`,
  })

  if (error) {
    console.error('Failed to send refund email:', error)
    throw new Error(`Email send failed: ${error.message}`)
  }

  return data
}

function refundNoticeHtml(p: { orderNumber: string; greeting: string; body: string }): string {
  return emailLayout(`Your refund is on its way — ${escapeHtml(p.orderNumber)}`, `
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#171717;">
                ${escapeHtml(p.greeting)}
              </h1>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#171717;">
                ${escapeHtml(p.body)}
              </p>`)
}
