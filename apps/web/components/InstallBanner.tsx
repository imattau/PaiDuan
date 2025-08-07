import { useEffect, useState } from 'react';
import useInstallPrompt from '../hooks/useInstallPrompt';

export default function InstallBanner() {
  const { showPrompt, deferredPrompt } = useInstallPrompt();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('install-dismissed');
    if (!dismissed && deferredPrompt) {
      setVisible(true);
    }
  }, [deferredPrompt]);

  if (!visible) return null;

  const handleDismiss = () => {
    localStorage.setItem('install-dismissed', '1');
    setVisible(false);
  };

  const handleInstall = () => {
    showPrompt();
    handleDismiss();
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-background/90 p-4 flex items-center justify-between">
      <span>Install Zapstr</span>
      <div className="space-x-2">
        <button onClick={handleInstall} className="rounded bg-accent px-3 py-1 text-white">
          Install
        </button>
        <button onClick={handleDismiss} className="rounded bg-gray-200 px-3 py-1">
          Dismiss
        </button>
      </div>
    </div>
  );
}
