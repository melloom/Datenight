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
```

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

**Live App:** [https://datenight.app](https://datenight.app)
