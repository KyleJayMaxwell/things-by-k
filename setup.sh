#!/bin/bash
# Things by K — Phase 1 Setup Script
# Run this to scaffold the project from scratch

echo "🛍️  Setting up Things by K..."

# 1. Create Next.js app
npx create-next-app@latest things-by-k \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-git

cd things-by-k

# 2. Install dependencies
npm install \
  @supabase/supabase-js \
  @supabase/ssr \
  stripe \
  @stripe/stripe-js

npm install -D @types/node

echo "✅ Dependencies installed"
echo ""
echo "Next steps:"
echo "  1. Copy .env.local.example → .env.local and fill in your keys"
echo "  2. Run: npm run dev"
echo "  3. Move on to Phase 2: Database setup"
