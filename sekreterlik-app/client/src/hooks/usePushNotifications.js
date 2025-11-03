import { useState, useEffect, useCallback } from 'react';
import ApiService from '../utils/ApiService';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [vapidKey, setVapidKey] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if push notifications are supported
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
    }
  }, []);

  // Get VAPID key
  useEffect(() => {
    if (isSupported) {
      getVapidKey();
    }
  }, [isSupported]);

  const getVapidKey = async () => {
    try {
      const response = await ApiService.getVapidKey();
      if (response.success) {
        setVapidKey(response.publicKey);
      }
    } catch (error) {
      console.error('Error getting VAPID key:', error);
    }
  };

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported || !vapidKey) {
      setError('Push notifications desteklenmiyor veya VAPID anahtarı alınamadı');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);

      // Get existing subscription
      let existingSubscription = await registration.pushManager.getSubscription();

      if (existingSubscription) {
        setSubscription(existingSubscription);
        setIsSubscribed(true);
        setIsLoading(false);
        return true;
      }

      // Create new subscription
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });

      // Send subscription to server
      const response = await ApiService.subscribeToPush({
        subscription: newSubscription
      });

      if (response.success) {
        setSubscription(newSubscription);
        setIsSubscribed(true);
        console.log('Successfully subscribed to push notifications');
        return true;
      } else {
        throw new Error(response.message || 'Subscription failed');
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      setError(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, vapidKey]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!subscription) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Unsubscribe from browser
      await subscription.unsubscribe();

      // Notify server
      await ApiService.unsubscribeFromPush();

      setSubscription(null);
      setIsSubscribed(false);
      console.log('Successfully unsubscribed from push notifications');
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      setError(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [subscription]);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    if (!isSubscribed) {
      setError('Önce push notification aboneliği yapmalısınız');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await ApiService.sendTestNotification();
      if (response.success) {
        console.log('Test notification sent successfully');
        return true;
      } else {
        throw new Error(response.message || 'Test notification failed');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      setError(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSubscribed]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setError('Push notifications desteklenmiyor');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        return true;
      } else {
        setError('Bildirim izni verilmedi');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setError(error.message);
      return false;
    }
  }, [isSupported]);

  return {
    isSupported,
    isSubscribed,
    subscription,
    vapidKey,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
    requestPermission
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
