import { GetServerSideProps } from 'next';

function hasVault(cookies: Record<string, string>) {
  // If you store in localStorage only, we can't read it here.
  // Fallback client-side redirect (below). Keep SSR simple:
  return false;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  if (hasVault(ctx.req.cookies)) {
    return { redirect: { destination: '/en/feed', permanent: false } };
  }
  // No server-stored keys → go to Settings Keys section
  return { redirect: { destination: '/en/settings#keys', permanent: false } };
};

export default function GetStarted() { return null; }
