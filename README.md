# 🌙 Date Night Planner

**AI-Powered Date Ideas & Venue Recommendations**

Discover the perfect date night with intelligent recommendations tailored to your preferences. Find romantic restaurants, fun activities, and unique venues effortlessly.

## ✨ Features

- 🤖 **AI-Powered Recommendations** - Get personalized date suggestions using Google's Gemini AI
- 📍 **Location-Based Search** - Find venues near you with real-time geolocation
- 🎯 **Smart Filtering** - Filter by budget, vibes, time, and party size
- 💝 **Save Favorites** - Bookmark your favorite venues and date ideas
- 📱 **Progressive Web App** - Install on mobile for a native app experience
- 🌐 **Offline Support** - Access saved dates even without internet
- 🎨 **Beautiful UI** - Modern, dark-themed interface with smooth animations

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/melloom/Datenight.git

# Navigate to project directory
cd Datenight

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your API keys to .env.local

# Run development server
pnpm dev
```

### Environment Variables

Create a `.env.local` file with the following:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
GEMINI_API_KEY=your_gemini_api_key

# Firebase Admin (server-side secrets only)
# Store these in your host secret manager or CI secrets. Do not commit JSON key files.
FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
# or use the split vars instead of FIREBASE_SERVICE_ACCOUNT_KEY:
# FIREBASE_PROJECT_ID=your_project_id
# FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your_project.iam.gserviceaccount.com
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Stripe Billing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx_or_pk_live_xxx
STRIPE_SECRET_KEY=sk_test_xxx_or_sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_MONTHLY=price_1TH6kyEykVDCxwrv7i14qTAM
STRIPE_PRICE_YEARLY=price_1TH6kyEykVDCxwrva1gKcy0L

# SMTP billing emails (Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=contact@mellowsites.com
SMTP_PASS=replace_me
SMTP_FROM="DateNight <contact@mellowsites.com>"
BILLING_ALERT_EMAIL=contact@mellowsites.com

# Forever Pro users (optional allowlist)
# Comma-separated Firebase Auth UIDs and/or emails that always keep premium access
FOREVER_PRO_UIDS=
FOREVER_PRO_EMAILS=
```

Current live plan setup:
- Product: DateNight Pro
- Monthly: DateNight Pro - Monthly (USD 9.99)
- Yearly: DateNight Pro - Yearly (USD 99.99)
- Effective monthly cost on yearly: USD 8.33 (USD 99.99 / 12)

### Stripe Webhook Route

- Endpoint: /api/stripe/webhook
- Required events:
	- checkout.session.completed
	- checkout.session.async_payment_succeeded
	- checkout.session.async_payment_failed
	- checkout.session.expired
	- customer.subscription.created
	- customer.subscription.updated
	- customer.subscription.deleted
	- customer.subscription.paused
	- customer.subscription.resumed
	- customer.subscription.trial_will_end
	- invoice.paid
	- invoice.payment_succeeded
	- invoice.payment_failed
	- invoice.finalization_failed
	- invoice.marked_uncollectible
	- invoice.voided

For local testing, use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Billing API routes:
- POST /api/stripe/checkout
- POST /api/stripe/portal
- POST /api/stripe/cancel (sets cancel_at_period_end)
- GET /api/stripe/status
- POST /api/stripe/webhook

Webhook-driven billing emails are sent when SMTP variables are configured:
- New subscription purchase confirmation
- Payment failure notice
- Cancellation and cancel-at-period-end notices

Never commit live Stripe keys or webhook secrets to source control.

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** Radix UI + shadcn/ui
- **AI:** Google Gemini API
- **Database:** Firebase Realtime Database
- **Authentication:** Firebase Auth
- **Analytics:** Vercel Analytics
- **PWA:** next-pwa

## 📱 PWA Installation

### Desktop
1. Visit the app in Chrome/Edge
2. Click the install icon in the address bar
3. Click "Install"

### Mobile
1. Visit the app in Safari/Chrome
2. Tap "Share" → "Add to Home Screen"
3. Tap "Add"

## 🏗️ Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout with SEO
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── mystery-date/     # Date planner components
├── lib/                   # Utility functions
│   ├── firebase.ts       # Firebase configuration
│   ├── gemini.ts         # AI integration
│   └── venue-search.ts   # Venue search logic
├── public/               # Static assets
│   ├── manifest.json     # PWA manifest
│   └── robots.txt        # SEO robots file
└── styles/               # Global styles
```

## 🎯 SEO Features

- Comprehensive meta tags (Open Graph, Twitter Cards)
- Structured data (JSON-LD) for rich snippets
- Dynamic sitemap generation
- Robots.txt configuration
- Optimized for search engines

## 📄 License

This project is private and proprietary.

## 👥 Team

Built with ❤️ by the Date Night Team

---

**Live App:** [https://dat3night.com](https://dat3night.com)
