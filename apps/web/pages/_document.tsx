import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon-192.svg" sizes="192x192" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        {process.env.NEXT_PUBLIC_ANALYTICS === 'enabled' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
if (localStorage.getItem('analytics-consent') === '1') {
  window.plausible = window.plausible || function(){(window.plausible.q = window.plausible.q || []).push(arguments)};
  var s=document.createElement('script');
  s.src='https://stats.zapstr.app/js/script.js';
  s.setAttribute('data-domain','zapstr.app');
  s.setAttribute('data-api','/api/event');
  s.defer=true;
  document.head.appendChild(s);
}
`,
            }}
          />
        )}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
