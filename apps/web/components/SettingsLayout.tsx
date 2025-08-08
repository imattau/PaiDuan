import AppShell from '@/components/layout/AppShell';
import MainNav from '@/components/layout/MainNav';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      left={<MainNav showSearch={false} showProfile={false} />}
      center={<div className="space-y-8">{children}</div>}
      right={<></>}
    />
  );
}
