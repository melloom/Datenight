import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { AuthProvider } from '@/lib/auth-context'
import { TutorialProvider } from '@/lib/tutorial-context'
import { TutorialOverlay } from '@/components/tutorial/tutorial-overlay'
import { FullscreenToggle } from '@/components/fullscreen-toggle'
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

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#ede9f6',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://datenight.app'),
  title: {
    default: 'Date Night Planner - AI-Powered Date Ideas & Venue Recommendations',
    template: '%s | Date Night Planner'
  },
  description: 'Discover the perfect date night with AI-powered recommendations. Find romantic restaurants, fun activities, and unique venues tailored to your preferences. Plan unforgettable dates effortlessly.',
  keywords: [
    'date night planner',
    'date ideas',
    'romantic restaurants',
    'date night ideas',
    'couples activities',
    'AI date planner',
    'venue recommendations',
    'romantic date spots',
    'date planning app',
    'relationship activities',
    'dinner date ideas',
    'fun date activities'
  ],
  authors: [{ name: 'Date Night Team' }],
  creator: 'Date Night Planner',
  publisher: 'Date Night Planner',
  generator: 'Next.js',
  applicationName: 'Date Night Planner',
  referrer: 'strict-origin-when-cross-origin',
  category: 'Lifestyle',
  classification: 'Dating & Relationships',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Date Night',
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://datenight.app',
    siteName: 'Date Night Planner',
    title: 'Date Night Planner - AI-Powered Date Ideas & Venue Recommendations',
    description: 'Discover the perfect date night with AI-powered recommendations. Find romantic restaurants, fun activities, and unique venues tailored to your preferences.',
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: 'Date Night Planner Logo',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Date Night Planner - AI-Powered Date Ideas',
    description: 'Discover the perfect date night with AI-powered recommendations. Find romantic restaurants and unique venues.',
    images: ['/android-chrome-512x512.png'],
    creator: '@datenightapp',
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
        url: 'https://datenight.app/android-chrome-512x512.png',
      },
    },
  }

  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable}`}>
      <head>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="renderer" content="webkit" />
        <meta name="format-detection" content="telephone=no" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          <TutorialProvider>
            {children}
            <TutorialOverlay />
          </TutorialProvider>
        </AuthProvider>
        <FullscreenToggle />
      </body>
    </html>
  )
}
