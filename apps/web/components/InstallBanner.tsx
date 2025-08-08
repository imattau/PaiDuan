import { useEffect, useRef, useState } from 'react';
import useInstallPrompt from '../hooks/useInstallPrompt';
import { trackEvent } from '../utils/analytics';
import useT from '../hooks/useT';
import useFocusTrap from '../hooks/useFocusTrap';

export default function InstallBanner() {
  const { canInstall, showPrompt } = useInstallPrompt();
  const [visible, setVisible] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const t = useT();

  useFocusTrap(visible, bannerRef);

  useEffect(() => {
    const dismissed = localStorage.getItem('installDismissed');
    if (!dismissed && canInstall) {
      setVisible(true);
      trackEvent('install_prompt_shown');
    }
  }, [canInstall]);

  if (!visible) return null;

  const handleDismiss = () => {
    localStorage.setItem('installDismissed', '1');
    setVisible(false);
  };

  const handleInstall = () => {
    showPrompt();
    trackEvent('install_prompt_accepted');
    handleDismiss();
  };

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-modal="true"
      aria-label={t('install_paiduan')}
      className="fixed bottom-0 inset-x-0 z-50 bg-background/90 p-4 flex items-center justify-between"
    >
      <span>{t('install_paiduan')}</span>
      <div className="space-x-2">
        <button onClick={handleInstall} className="rounded bg-accent px-3 py-1 text-white">
          {t('install')}
        </button>
        <button onClick={handleDismiss} className="rounded bg-gray-200 px-3 py-1">
          {t('dismiss')}
        </button>
      </div>
    </div>
  );
}
