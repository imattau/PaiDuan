import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

function hasVault(cookieValues: Record<string, string>) {
  // If you store in localStorage only, we can't read it here.
  // Fallback client-side redirect (below). Keep SSR simple:
  return false;
}

export default async function GetStartedPage() {
  const cookieStore = await cookies();
  const cookieObject = Object.fromEntries(
    cookieStore.getAll().map(({ name, value }) => [name, value]),
  );

  if (hasVault(cookieObject)) {
    redirect('/feed');
  }

  redirect('/onboarding/key');
}
