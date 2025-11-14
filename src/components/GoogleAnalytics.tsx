'use client';

import Script from 'next/script';

interface GoogleAnalyticsProps {
  gaId: string;
}

/**
 * Google Analytics 4 トラッキングコンポーネント
 *
 * 使い方:
 * 1. Google Analytics 4で測定IDを取得
 * 2. .env.localに NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX を追加
 * 3. このコンポーネントをlayout.tsxに配置
 */
export default function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  if (!gaId || process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <>
      {/* Google Analytics Script */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
              send_page_view: true,
            });
          `,
        }}
      />
    </>
  );
}
