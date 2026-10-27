// Stripe Tax adds sales tax at checkout. Stays off until the shop holds a
// California seller's permit and that registration is added in Stripe's Tax settings.
export const SALES_TAX_ENABLED = process.env.NEXT_PUBLIC_SALES_TAX_ENABLED === 'true'
