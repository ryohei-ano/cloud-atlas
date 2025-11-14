import type { Metadata } from 'next';
import { Geist, Geist_Mono, DotGothic16 } from 'next/font/google';
import './globals.css';
import GoogleAnalytics from '@/components/GoogleAnalytics';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const dotGothic = DotGothic16({
  weight: '400',
  variable: '--font-dot-gothic',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Cloud Atlas',
  description:
    'A collective memory space where thoughts float in 3D. Share your memories in the cloud.',
  keywords: 'Cloud Atlas,memory,3D,space,thoughts,collective',
  authors: [{ name: 'Cloud Atlas' }],
  creator: 'Cloud Atlas',
  publisher: 'Cloud Atlas',
  openGraph: {
    title: 'Cloud Atlas',
    description:
      'A collective memory space where thoughts float in 3D. Share your memories in the cloud.',
    url: 'https://cloud-atlas.vercel.app',
    siteName: 'Cloud Atlas',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cloud Atlas',
    description:
      'A collective memory space where thoughts float in 3D. Share your memories in the cloud.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${dotGothic.variable} antialiased`}
      >
        {gaId && <GoogleAnalytics gaId={gaId} />}
        {children}
      </body>
    </html>
  );
}
