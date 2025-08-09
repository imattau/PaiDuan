"use client";
import React from 'react';
import AppShell from '@/components/layout/AppShell';
import MainNav from '@/components/layout/MainNav';
import { Accordion } from '@/components/ui/Accordion';
import { KeysCard } from '@/components/settings/KeysCard';
import { AccountCard } from '@/components/settings/AccountCard';
import { LightningCard } from '@/components/settings/LightningCard';
import { LightningHistory } from '@/components/settings/LightningHistory';
import { NetworkCard } from '@/components/settings/NetworkCard';
import { AppearanceCard } from '@/components/settings/AppearanceCard';
import { LanguageCard } from '@/components/settings/LanguageCard';
import { StorageCard } from '@/components/settings/StorageCard';
import { DataCard } from '@/components/settings/DataCard';
import { PrivacyCard } from '@/components/settings/PrivacyCard';
import { ProfileCard } from '@/components/settings/ProfileCard';

export default function Settings() {
  const [initialOpenIndex, setInitialOpenIndex] = React.useState<number | null>(
    null,
  );

  React.useEffect(() => {
    if (window.location.hash === '#profile') {
      setInitialOpenIndex(0);
    }
  }, []);

  const nav = <MainNav showSearch={false} showProfile={false} />;

  return (
    <AppShell
      left={nav}
      center={
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-6 min-h-full">
          <Accordion
            initialOpenIndex={initialOpenIndex}
            items={[
              {
                title: 'Profile',
                content: (
                  <div id="profile">
                    <ProfileCard />
                  </div>
                ),
              },
              {
                title: 'Account & Keys',
                content: (
                  <div className="space-y-6">
                    <KeysCard />
                    <AccountCard />
                  </div>
                ),
              },
              {
                title: 'Wallet Management',
                content: (
                  <div className="space-y-6">
                    <LightningCard />
                    <LightningHistory />
                  </div>
                ),
              },
              {
                title: 'Network',
                content: <NetworkCard />,
              },
              {
                title: 'Appearance & Language',
                content: (
                  <div className="space-y-6">
                    <AppearanceCard />
                    <LanguageCard />
                  </div>
                ),
              },
              {
                title: 'Data, Storage & Privacy',
                content: (
                  <div className="space-y-6">
                    <StorageCard />
                    <DataCard />
                    <PrivacyCard />
                  </div>
                ),
              },
            ]}
          />
        </div>
      }
    />
  );
}
