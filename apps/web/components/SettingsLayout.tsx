import AppShell from '@/components/layout/AppShell';
import SideNav from './SideNav';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell left={<SideNav />} center={<div className="space-y-8">{children}</div>} right={<></>} />
  );
}
