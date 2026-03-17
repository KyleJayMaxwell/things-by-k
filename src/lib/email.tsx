// src/lib/email.tsx
// Resend client + transactional email templates
// Server-only — never import in Client Components

import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY environment variable')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'Things by K <hello@things-by-k.com>'

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderItem {
  name: string
  quantity: number
  price: number // in cents
}

interface ShippingAddress {
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
  total: number         // cents
  shippingAddress: ShippingAddress
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

// ── Order Confirmation ────────────────────────────────────────────────────────

export async function sendOrderConfirmation(params: SendOrderConfirmationParams) {
  const {
    to,
    orderNumber,
    items,
    subtotal,
    shippingCost,
    total,
    shippingAddress,
  } = params

  const addr = shippingAddress
  const addressLines = [
    addr.line1,
    addr.line2,
    `${addr.city}, ${addr.state} ${addr.postal_code}`,
    addr.country,
  ]
    .filter(Boolean)
    .join('\n')

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Order confirmed — ${orderNumber}`,
    html: orderConfirmationHtml({
      orderNumber,
      items,
      subtotal,
      shippingCost,
      total,
      addressLines,
    }),
    text: orderConfirmationText({
      orderNumber,
      items,
      subtotal,
      shippingCost,
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
  total: number
  addressLines: string
  to?: string
}

function orderConfirmationHtml(p: TemplateParams): string {
  const itemRows = p.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #E4E0EF;color:#1A1A2E;font-size:14px;">
          ${item.name} &times; ${item.quantity}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #E4E0EF;color:#1A1A2E;font-size:14px;text-align:right;">
          ${formatPrice(item.price * item.quantity)}
        </td>
      </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmed — ${p.orderNumber}</title>
</head>
<body style="margin:0;padding:0;background:#FAF9FC;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9FC;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:0 0 32px 0;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:600;color:#360F5A;letter-spacing:-0.3px;">
                Things by K
              </p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#FFFFFF;border:1px solid #E4E0EF;border-radius:12px;padding:40px;">

              <!-- Checkmark -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;padding-bottom:24px;">
                    <div style="display:inline-block;width:52px;height:52px;background:#ECFDF5;border-radius:50%;line-height:52px;text-align:center;font-size:24px;">
                      ✓
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;padding-bottom:8px;">
                    <h1 style="margin:0;font-size:22px;font-weight:600;color:#1A1A2E;">
                      Order confirmed!
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;padding-bottom:32px;">
                    <p style="margin:0;font-size:14px;color:#6B6A80;">
                      Thanks for your order. We'll get it packed up and on its way soon.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Order number -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#EDE6F5;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:12px 16px;">
                    <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#360F5A;font-weight:600;">
                      Order number
                    </p>
                    <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:#360F5A;">
                      ${p.orderNumber}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Items -->
              <p style="margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#6B6A80;font-weight:600;">
                Items
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                ${itemRows}
              </table>

              <!-- Totals -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E4E0EF;padding-top:16px;margin-bottom:28px;">
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:#6B6A80;">Subtotal</td>
                  <td style="padding:4px 0;font-size:14px;color:#1A1A2E;text-align:right;">${formatPrice(p.subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:#6B6A80;">Shipping</td>
                  <td style="padding:4px 0;font-size:14px;color:#1A1A2E;text-align:right;">${formatPrice(p.shippingCost)}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0 0;font-size:16px;font-weight:600;color:#1A1A2E;">Total</td>
                  <td style="padding:12px 0 0;font-size:16px;font-weight:600;color:#1A1A2E;text-align:right;">${formatPrice(p.total)}</td>
                </tr>
              </table>

              <!-- Shipping address -->
              <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#6B6A80;font-weight:600;">
                Shipping to
              </p>
              <p style="margin:0;font-size:14px;color:#1A1A2E;white-space:pre-line;line-height:1.6;">
                ${p.addressLines}
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#6B6A80;">
                Questions? Reply to this email or reach us at
                <a href="mailto:hello@things-by-k.com" style="color:#360F5A;">hello@things-by-k.com</a>
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#6B6A80;">
                © ${new Date().getFullYear()} Things by K
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

// ── Plain-text fallback ───────────────────────────────────────────────────────

function orderConfirmationText(p: TemplateParams & { to: string }): string {
  const itemLines = p.items
    .map((item) => `  ${item.name} x${item.quantity}  ${formatPrice(item.price * item.quantity)}`)
    .join('\n')

  return `Things by K — Order Confirmed

Order number: ${p.orderNumber}

Thanks for your order! We'll get it packed up and on its way soon.

ITEMS
${itemLines}

Subtotal:  ${formatPrice(p.subtotal)}
Shipping:  ${formatPrice(p.shippingCost)}
Total:     ${formatPrice(p.total)}

SHIPPING TO
${p.addressLines}

Questions? Reply to this email or reach us at hello@things-by-k.com

© ${new Date().getFullYear()} Things by K
`
}