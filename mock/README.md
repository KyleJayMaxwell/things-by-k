# Local mock data

`npm run dev:mock` runs the site at http://localhost:3000 with sample products and orders instead of the real Supabase project.

- 16 postcards with their real photos, Surprise Me, and one hidden draft. Two are sold out and two are low on stock.
- 12 orders over the last few months in every status, a few with handwritten notes.
- Sign in with any email and any password. The admin email opens /admin. `sam@example.com` is a customer with three past orders.
- Everything lives in memory: edits, new products, uploaded photos and sign-ups reset when you stop the server.
- Checkout still needs a Stripe test key in `.env.local`, and the webhook doesn't run, so paid orders won't appear.

Files: `data.mjs` (sample rows), `server.mjs` (the stand-in for Supabase's REST, Auth and Storage APIs), `dev.mjs` (starts both), `images/` (resized photos).
