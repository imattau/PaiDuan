import { useRouter } from 'next/router';

export default function FabUpload() {
  const router = useRouter();
  return (
    <button
      className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-[var(--accent)] text-white shadow-xl lg:hidden"
      onClick={() => router.push('/en/create')}
    >
      +
    </button>
  );
}
