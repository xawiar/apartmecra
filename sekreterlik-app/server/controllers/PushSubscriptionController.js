const PushSubscription = require('../models/PushSubscription');
const PushNotificationService = require('../services/pushNotificationService');

class PushSubscriptionController {
  // Subscribe user to push notifications
  static async subscribe(req, res) {
    try {
      const { userId, subscription } = req.body;
      
      if (!userId || !subscription || !subscription.endpoint) {
        return res.status(400).json({ 
          success: false, 
          message: 'Kullanıcı ID ve subscription bilgileri gerekli' 
        });
      }

      const subscriptionData = {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: req.headers['user-agent']
      };

      // Check if user already has a subscription
      const existingSubscriptions = await PushSubscription.getByUserId(userId);
      
      if (existingSubscriptions.length > 0) {
        // Update existing subscription
        await PushSubscription.update(userId, subscriptionData);
        console.log(`Updated push subscription for user ${userId}`);
      } else {
        // Create new subscription
        await PushSubscription.create(subscriptionData);
        console.log(`Created new push subscription for user ${userId}`);
      }

      res.json({ 
        success: true, 
        message: 'Push notification aboneliği başarılı' 
      });
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Push notification aboneliği sırasında hata oluştu' 
      });
    }
  }

  // Unsubscribe user from push notifications
  static async unsubscribe(req, res) {
    try {
      const { userId } = req.params;
      
      await PushSubscription.delete(userId);
      
      res.json({ 
        success: true, 
        message: 'Push notification aboneliği iptal edildi' 
      });
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Push notification aboneliği iptal edilirken hata oluştu' 
      });
    }
  }

  // Get VAPID public key
  static async getVapidKey(req, res) {
    try {
      res.json({ 
        success: true, 
        publicKey: 'BO9vjwvHvLDxeP-H2IY92hsQlWGYTCW7NpX3M0GAyooyTbT30Y_0q_ahIsomr38bsL2Nbh7DHEZKMD7YTsiEYf8'
      });
    } catch (error) {
      console.error('Error getting VAPID key:', error);
      res.status(500).json({ 
        success: false, 
        message: 'VAPID anahtarı alınırken hata oluştu' 
      });
    }
  }

  // Send test notification
  static async sendTestNotification(req, res) {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Kullanıcı ID gerekli' 
        });
      }

      const subscriptions = await PushSubscription.getByUserId(userId);
      
      if (subscriptions.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Kullanıcının aktif push subscription\'ı bulunamadı' 
        });
      }

      const payload = PushNotificationService.createPayload(
        'Test Bildirimi',
        'Bu bir test bildirimidir. Push notification sistemi çalışıyor!',
        '/icon-192x192.png',
        '/badge-72x72.png',
        { type: 'test', action: 'view' }
      );

      const results = await PushNotificationService.sendToMultipleUsers(subscriptions, payload);
      
      res.json({ 
        success: true, 
        message: 'Test bildirimi gönderildi',
        results 
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Test bildirimi gönderilirken hata oluştu' 
      });
    }
  }

  // Send notification to all users
  static async sendToAll(req, res) {
    try {
      const { title, body } = req.body;
      
      if (!title || !body) {
        return res.status(400).json({ 
          success: false, 
          message: 'Başlık ve içerik gerekli' 
        });
      }

      const subscriptions = await PushSubscription.getAll();
      
      if (subscriptions.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Aktif push subscription bulunamadı' 
        });
      }

      const results = await PushNotificationService.sendGeneralNotification(
        subscriptions, 
        title, 
        body
      );
      
      res.json({ 
        success: true, 
        message: 'Bildirim tüm kullanıcılara gönderildi',
        sentCount: results.filter(r => r.success).length,
        totalCount: subscriptions.length,
        results 
      });
    } catch (error) {
      console.error('Error sending notification to all:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Bildirim gönderilirken hata oluştu' 
      });
    }
  }

  // Get all subscriptions (admin only)
  static async getAll(req, res) {
    try {
      const subscriptions = await PushSubscription.getAll();
      
      res.json({ 
        success: true, 
        subscriptions 
      });
    } catch (error) {
      console.error('Error getting all subscriptions:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Abonelikler alınırken hata oluştu' 
      });
    }
  }
}

module.exports = PushSubscriptionController;
