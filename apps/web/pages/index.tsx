import { NostrLogin } from 'ui/components/NostrLogin';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <NostrLogin />
    </main>
  );
}
