import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { TutorialProvider } from '@/lib/tutorial-context'
import { TutorialOverlay } from '@/components/tutorial/tutorial-overlay'
import { FullscreenToggle } from '@/components/fullscreen-toggle'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#000000',
}

export const metadata: Metadata = {
  title: 'Date Night Planner',
  description: 'Plan your perfect date night experience with AI-powered recommendations',
  generator: 'Next.js',
  applicationName: 'Date Night Planner',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Date Night',
  },
  formatDetection: {
    telephone: false,
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
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <TutorialProvider>
            {children}
            <TutorialOverlay />
          </TutorialProvider>
        </AuthProvider>
        <FullscreenToggle />
        <Analytics />
      </body>
    </html>
  )
}
