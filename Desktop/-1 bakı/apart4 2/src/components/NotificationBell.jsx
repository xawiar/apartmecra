import React, { useState, useEffect } from 'react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../services/api';
import { getCurrentUser } from '../services/firebaseAuth';
import { auth } from '../config/firebase.js';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.uid) {
        setNotifications([]);
        return;
      }

      const unreadNotifications = await getNotifications(currentUser.uid, true);
      setNotifications(unreadNotifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth && auth.currentUser) {
      fetchNotifications();
      
      // Refresh notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      
      return () => clearInterval(interval);
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id || notification._docId);
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id || n._docId === notification._docId 
              ? { ...n, read: true } 
              : n
          )
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate if link is provided
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.uid) {
        await markAllNotificationsAsRead(currentUser.uid);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => (n.id || n._docId) !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'payment':
        return 'bi-cash-coin';
      case 'success':
        return 'bi-check-circle';
      case 'warning':
        return 'bi-exclamation-triangle';
      case 'error':
        return 'bi-x-circle';
      default:
        return 'bi-bell';
    }
  };

  const getNotificationBadgeClass = (type) => {
    switch (type) {
      case 'payment':
        return 'bg-success';
      case 'success':
        return 'bg-success';
      case 'warning':
        return 'bg-warning';
      case 'error':
        return 'bg-danger';
      default:
        return 'bg-info';
    }
  };

  // Don't show for non-site users (for now)
  const currentUser = getCurrentUser();
  if (!currentUser || !auth.currentUser) {
    return null;
  }

  return (
    <div className="dropdown position-relative me-2">
      <button
        className="btn btn-sm btn-outline-primary position-relative"
        type="button"
        onClick={() => {
          setShowDropdown(!showDropdown);
          if (!showDropdown) {
            fetchNotifications();
          }
        }}
        style={{ borderRadius: '50%', width: '40px', height: '40px' }}
      >
        <i className="bi bi-bell"></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div 
            className="offcanvas-backdrop show" 
            style={{ zIndex: 1040 }}
            onClick={() => setShowDropdown(false)}
          ></div>
          <div 
            className="dropdown-menu dropdown-menu-end show position-absolute"
            style={{ 
              minWidth: '350px', 
              maxWidth: '400px',
              maxHeight: '500px',
              overflowY: 'auto',
              zIndex: 1050,
              top: '100%',
              right: 0,
              marginTop: '0.5rem'
            }}
          >
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
              <h6 className="mb-0 fw-bold">Bildirimler</h6>
              {unreadCount > 0 && (
                <button
                  className="btn btn-sm btn-link text-primary p-0"
                  onClick={handleMarkAllAsRead}
                >
                  Tümünü Okundu İşaretle
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center p-4">
                <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-4 text-muted">
                <i className="bi bi-bell-slash fs-3 d-block mb-2"></i>
                <p className="mb-0">Yeni bildirim yok</p>
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {notifications.map((notification) => (
                  <div
                    key={notification.id || notification._docId}
                    className={`list-group-item list-group-item-action ${!notification.read ? 'bg-light' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="d-flex align-items-start">
                      <div className={`badge ${getNotificationBadgeClass(notification.type)} me-2 mt-1`}>
                        <i className={`bi ${getNotificationIcon(notification.type)}`}></i>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-1 fw-bold">{notification.title}</h6>
                        <p className="mb-1 small text-muted">{notification.message}</p>
                        <small className="text-muted">
                          {notification.createdAt 
                            ? new Date(notification.createdAt.seconds * 1000 || notification.createdAt).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Yeni'}
                        </small>
                      </div>
                      <button
                        className="btn btn-sm btn-link text-danger p-0 ms-2"
                        onClick={(e) => handleDeleteNotification(notification.id || notification._docId, e)}
                        title="Sil"
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;

