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
      </Head>
      <body dir={dir} className="font-sans bg-background-primary text-primary">
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
