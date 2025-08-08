import dynamic from 'next/dynamic';

const CreatorWizard = dynamic(() => import('@/components/create/CreatorWizard'), { ssr: false });

export const config = { hideFab: true };

export default function CreatePage() {
  return <CreatorWizard />;
}
