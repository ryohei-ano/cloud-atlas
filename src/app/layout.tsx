import type { Metadata } from 'next';
import { Geist, Geist_Mono, DotGothic16 } from 'next/font/google';
import './globals.css';

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
  title: '青春はバグだ。｜ ポカリスエット｜大塚製薬',
  description: '青春はバグだ。ポカリスエットの特設サイト。あなたの青春の記憶を3D空間に投稿しよう。',
  keywords: 'ポカリスエット,大塚製薬,青春,バグ,3D,メモリー,投稿',
  authors: [{ name: '大塚製薬' }],
  creator: '大塚製薬',
  publisher: '大塚製薬',
  openGraph: {
    title: '青春はバグだ。｜ ポカリスエット｜大塚製薬',
    description:
      '青春はバグだ。ポカリスエットの特設サイト。あなたの青春の記憶を3D空間に投稿しよう。',
    url: 'https://pocari-youth-is-glitch.vercel.app',
    siteName: '青春はバグだ。',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '青春はバグだ。｜ ポカリスエット｜大塚製薬',
    description:
      '青春はバグだ。ポカリスエットの特設サイト。あなたの青春の記憶を3D空間に投稿しよう。',
    creator: '@pocarisweat_jp',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
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
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${dotGothic.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
