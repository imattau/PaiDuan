import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="icon"
          href="https://placehold.co/192x192/png"
          sizes="192x192"
        />
        <link
          rel="apple-touch-icon"
          href="https://placehold.co/192x192/png"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
