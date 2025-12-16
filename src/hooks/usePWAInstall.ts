import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const getIsInstalled = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const matchMedia = window.matchMedia?.('(display-mode: standalone)')?.matches ?? false;
  const iosStandalone = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return matchMedia || iosStandalone;
};

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState<boolean>(() => !getIsInstalled());
  const [isInstalled, setIsInstalled] = useState<boolean>(() => getIsInstalled());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateInstallState = () => {
      const installed = getIsInstalled();
      setIsInstalled(installed);
      if (installed) {
        setShowInstallButton(false);
      }
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    updateInstallState();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', updateInstallState);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', updateInstallState);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowInstallButton(false);
        setIsInstalled(true);
      }

      setDeferredPrompt(null);
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    if (/iPhone|iPad|iPod/.test(window.navigator.userAgent)) {
      if (getIsInstalled()) {
        setShowInstallButton(false);
        setIsInstalled(true);
        return;
      }

      const isSafari = /Safari/.test(window.navigator.userAgent) && !/CriOS|FxiOS|EdgiOS/.test(window.navigator.userAgent);

      if (!isSafari) {
        window.alert('⚠️ يجب استخدام Safari لتثبيت التطبيق\n\nمتصفح Chrome لا يدعم التثبيت على iPhone.\n\n📱 الخطوات:\n1️⃣ افتح التطبيق في Safari\n2️⃣ اضغط زر المشاركة ⬆️\n3️⃣ اختر "إضافة إلى الشاشة الرئيسية"');
      } else {
        window.alert('📱 كيفية إضافة التطبيق للشاشة الرئيسية:\n\n1️⃣ اضغط على زر المشاركة ⬆️ في أسفل المتصفح\n2️⃣ مرر للأسفل واختر "إضافة إلى الشاشة الرئيسية"\n3️⃣ اضغط "إضافة" في الأعلى\n\n✨ ستجد أيقونة التطبيق على شاشتك الرئيسية!');
      }
      return;
    }

    window.alert('💡 لتثبيت التطبيق:\n\n• في Chrome: ابحث عن أيقونة التثبيت في شريط العنوان\n• في Safari: استخدم قائمة المشاركة واختر "إضافة إلى الشاشة الرئيسية"');
  }, [deferredPrompt]);

  return { showInstallButton, isInstalled, promptInstall };
};