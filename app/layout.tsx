import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { GeistPixelGrid } from 'geist/font/pixel'
import { ThemeProvider } from '@/components/theme-provider'

import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'PROTON Association | NMAMIT Cybersecurity Node',
  description:
    'Official Cybersecurity Association of NMAMIT Nitte. Dedicated to red-teaming, defensive security, technical workshops, capture-the-flags, hackathons, and cyber awareness.',
  keywords: [
    'PROTON',
    'PROTON NMAMIT',
    'Cybersecurity Association',
    'NMAMIT Nitte',
    'Ethical Hacking',
    'CTF',
    'Capture The Flag',
    'Cyber Awareness',
    'Information Security',
    'Computer Science Cybersecurity',
  ],
  authors: [{ name: 'PROTON Association NMAMIT' }],
  creator: 'PROTON Association',
  publisher: 'PROTON Association NMAMIT',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'PROTON Association | NMAMIT Cybersecurity Node',
    description:
      'Official Cybersecurity Association of NMAMIT Nitte. Dedicated to red-teaming, defensive security, technical workshops, capture-the-flags, hackathons, and cyber awareness.',
    siteName: 'PROTON NMAMIT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PROTON Association | NMAMIT Cybersecurity Node',
    description:
      'Official Cybersecurity Association of NMAMIT Nitte. Dedicated to red-teaming, defensive security, technical workshops, capture-the-flags, hackathons, and cyber awareness.',
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  category: 'technology',
}

export const viewport: Viewport = {
  themeColor: '#F2F1EA',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

import { LoadingScreen } from '@/components/loading-screen'
import { GlobalAsciiBackground } from '@/components/global-ascii-background'
import { GlobalTerminal } from '@/components/global-terminal'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${GeistPixelGrid.variable}`} suppressHydrationWarning>
      <body className="font-mono antialiased relative min-h-screen bg-black">
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false} disableTransitionOnChange>
          <GlobalAsciiBackground />
          <GlobalTerminal />
          <LoadingScreen />
          <div className="relative z-10">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
