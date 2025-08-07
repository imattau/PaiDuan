import SideNav from './SideNav';
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SideNav />
      <div className="lg:ml-48 pt-6 pb-24 flex justify-center">
        <div className="w-full max-w-[640px] space-y-8 px-4">{children}</div>
      </div>
    </>
  );
}
