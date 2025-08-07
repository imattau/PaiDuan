import NextDocument, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
  DocumentProps,
} from 'next/document';

function isRTL(locale?: string) {
  return ['ar', 'he', 'fa', 'ur'].includes(locale?.split('-')[0] || '');
}

type Props = DocumentProps & { dir: 'rtl' | 'ltr' };

export default function Document({ dir }: Props) {
  return (
    <Html lang="en">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="icon"
          href="/icons/icon-192.svg"
          sizes="192x192"
          type="image/svg+xml"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {process.env.NEXT_PUBLIC_ANALYTICS === 'enabled' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
if (localStorage.getItem('analytics-consent') === '1') {
  window.plausible = window.plausible || function(){(window.plausible.q = window.plausible.q || []).push(arguments)};
  var s=document.createElement('script');
  s.src='https://stats.paiduan.app/js/script.js';
  s.setAttribute('data-domain','paiduan.app');
  s.setAttribute('data-api','/api/event');
  s.defer=true;
  document.head.appendChild(s);
}
`,
            }}
          />
        )}
      </Head>
      <body dir={dir} className="font-sans">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

Document.getInitialProps = async (ctx: DocumentContext) => {
  const initialProps = await NextDocument.getInitialProps(ctx);
  const locale = (ctx.query?.locale as string) || 'en';
  return { ...initialProps, dir: isRTL(locale) ? 'rtl' : 'ltr' };
};
