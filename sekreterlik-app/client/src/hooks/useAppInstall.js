import { useState, useEffect } from 'react';

export const useAppInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check if running in standalone mode (installed PWA)
      if (window.matchMedia('(display-mode: standalone)').matches || 
          window.navigator.standalone === true) {
        setIsInstalled(true);
        setShowInstallBanner(false);
        return true;
      }
      return false;
    };

    // Check if already installed
    if (checkIfInstalled()) {
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('beforeinstallprompt event fired');
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setIsInstallable(true);
      setShowInstallBanner(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      setIsInstallable(false);
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if app is installed on load
    checkIfInstalled();

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      console.log('No install prompt available');
      return false;
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`User response to the install prompt: ${outcome}`);
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsInstalled(true);
        setShowInstallBanner(false);
        setDeferredPrompt(null);
        setIsInstallable(false);
        return true;
      } else {
        console.log('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Error during app installation:', error);
      return false;
    }
  };

  const dismissBanner = () => {
    setShowInstallBanner(false);
    // Store dismissal in localStorage to not show again for this session
    localStorage.setItem('install-banner-dismissed', 'true');
  };

  const checkBannerDismissed = () => {
    return localStorage.getItem('install-banner-dismissed') === 'true';
  };

  const resetBannerDismissal = () => {
    localStorage.removeItem('install-banner-dismissed');
  };

  return {
    isInstallable,
    isInstalled,
    showInstallBanner: showInstallBanner && !checkBannerDismissed(),
    installApp,
    dismissBanner,
    resetBannerDismissal
  };
};
