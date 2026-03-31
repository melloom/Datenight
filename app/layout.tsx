import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { AuthProvider } from '@/lib/auth-context'
import { TutorialProvider } from '@/lib/tutorial-context'
import { LegalProvider } from '@/lib/legal-context'
import { TutorialOverlay } from '@/components/tutorial/tutorial-overlay'
import { FullscreenToggle } from '@/components/fullscreen-toggle'
import { getAppUrl } from '@/lib/utils'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: 'swap',
  preload: true
});

const geistMono = Geist_Mono({ 
  subsets: ["latin"], 
  variable: "--font-geist-mono", 
  preload: false,
  display: 'swap'
});

const appUrl = getAppUrl()

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#ede9f6',
}

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'Dat3Night - AI Date Night Planner & Romantic Venue Recommendations',
    template: '%s | Dat3Night'
  },
  description: 'Dat3Night uses AI to plan perfect date nights. Get personalized restaurant recommendations, fun couple activities, and unique venues based on your preferences. Create unforgettable dates in seconds.',
  keywords: [
    'Dat3Night',
    'date night planner',
    'AI date planner',
    'date ideas',
    'romantic restaurants',
    'couples activities',
    'date night ideas',
    'venue recommendations',
    'date planning app',
    'romantic date spots',
    'date night generator',
    'AI dating assistant',
    'fun couple activities',
    'dinner date ideas'
  ],
  authors: [{ name: 'Dat3Night Team' }],
  creator: 'Dat3Night',
  publisher: 'Dat3Night',
  generator: 'Next.js',
  applicationName: 'Dat3Night',
  referrer: 'strict-origin-when-cross-origin',
  category: 'Lifestyle',
  classification: 'Dating & Relationships',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Dat3Night',
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: appUrl,
    siteName: 'Dat3Night',
    title: 'Dat3Night - AI Date Night Planner & Romantic Venue Recommendations',
    description: 'Dat3Night uses AI to plan perfect date nights. Get personalized restaurant recommendations, fun couple activities, and unique venues based on your preferences.',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'Dat3Night logo and share preview',
        type: 'image/png',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dat3Night - AI Date Night Planner',
    description: 'Dat3Night uses AI to plan perfect date nights with personalized restaurant and venue recommendations.',
    images: ['/api/og'],
    creator: '@dat3night',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      {
        url: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Date Night Planner',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Discover the perfect date night with AI-powered recommendations. Find romantic restaurants, fun activities, and unique venues tailored to your preferences.',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1250',
    },
    author: {
      '@type': 'Organization',
      name: 'Date Night Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Date Night Planner',
      logo: {
        '@type': 'ImageObject',
        url: `${appUrl}/android-chrome-512x512.png`,
      },
    },
  }

  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">
        <LegalProvider>
          <AuthProvider>
            <TutorialProvider>
              {children}
              <TutorialOverlay />
            </TutorialProvider>
          </AuthProvider>
        </LegalProvider>
        <FullscreenToggle />
      </body>
    </html>
  )
}
