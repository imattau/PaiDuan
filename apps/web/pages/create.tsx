import { useEffect, useState } from 'react';
import CreatorWizard from '../components/CreatorWizard';
import SideNav from '../components/SideNav';
import { CurrentVideoProvider } from '../hooks/useCurrentVideo';

export default function CreatePage() {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (!open) window.location.href = '/en/feed';
  }, [open]);
  return (
    <CurrentVideoProvider>
      <SideNav />
      <div className="lg:ml-48 pt-6 flex justify-center">
        {open && <CreatorWizard onClose={() => setOpen(false)} />}
      </div>
    </CurrentVideoProvider>
  );
}
