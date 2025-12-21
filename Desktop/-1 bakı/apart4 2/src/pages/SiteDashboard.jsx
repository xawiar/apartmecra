import React, { useState, useEffect } from 'react';
import { getSiteData, getSites, getCompanies, getPanelImages, getAgreements, getTransactions, createSiteUpdateRequest, getNotifications } from '../services/api';
import logger from '../utils/logger';
import { getUser } from '../utils/auth';
import SiteHelpers from '../components/Sites/SiteHelpers';
import { getCurrentUser } from '../services/firebaseAuth';
import { auth } from '../config/firebase.js';
import { initializePushNotifications, requestNotificationPermission } from '../services/notifications';

const SiteDashboard = () => {
  const [siteData, setSiteData] = useState({
    site: null,
    agreements: [],
    transactions: []
  });
  const [companies, setCompanies] = useState([]);
  const [panelImages, setPanelImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPanels: 0,
    usedPanels: 0,
    activeAgreements: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    totalPendingAmount: 0,
    totalPaidAmount: 0
  });
  const [futurePayments, setFuturePayments] = useState([]);
  const [paymentFilter, setPaymentFilter] = useState({
    dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    showPaid: true,
    showUnpaid: true
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditSiteModal, setShowEditSiteModal] = useState(false);
  const [siteFormData, setSiteFormData] = useState({
    name: '',
    manager: '',
    phone: '',
    blocks: '',
    elevatorsPerBlock: '',
    apartmentCount: '',
    bankAccountName: '',
    iban: '',
    notes: ''
  });
  const [notifications, setNotifications] = useState([]);
  const [notificationsCollapsed, setNotificationsCollapsed] = useState(false);

  const user = getUser();
  const siteId = user?.siteId;
  
  // Function to play notification sound
  const playNotificationSound = () => {
    try {
      // Try to play notification sound file first
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.7;
      audio.play().catch(() => {
        // If file doesn't exist, use Web Audio API fallback
        playBeepSound();
      });
    } catch (error) {
      console.warn('Could not play notification sound using HTML5 Audio:', error);
      playBeepSound();
    }
  };

  // Fallback beep sound using Web Audio API
  const playBeepSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Resume audio context if suspended (required by some browsers)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.warn('Could not play notification sound using Web Audio API:', e);
    }
  };

  // Listen for service worker messages (for notification sound from push notifications)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event) => {
        if (event.data && event.data.type === 'play-notification-sound') {
          playNotificationSound();
        }
      };
      
      navigator.serviceWorker.addEventListener('message', handleMessage);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  // Function to show push notification
  const showPushNotification = (notification) => {
    if (Notification.permission === 'granted') {
      const title = notification.title || 'Yeni Bildirim';
      const body = notification.message || 'Yeni bir bildiriminiz var';
      const icon = '/icon-192x192.png';
      const badge = '/icon-72x72.png';
      
      const notificationOptions = {
        body: body,
        icon: icon,
        badge: badge,
        tag: notification.id || notification._docId || 'apartmecra-notification',
        requireInteraction: false,
        silent: false, // Enable sound - browser will play default notification sound
        sound: '/notification-sound.mp3', // Custom sound file (if supported by browser)
        vibrate: [200, 100, 200, 100, 200],
        renotify: true, // Re-notify if notification with same tag exists
        data: {
          notificationId: notification.id || notification._docId,
          link: notification.link || '/site-dashboard',
          type: notification.type || 'info'
        }
      };
      
      const pushNotification = new Notification(title, notificationOptions);
      
      // Play notification sound
      playNotificationSound();
      
      // Handle notification click
      pushNotification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        pushNotification.close();
        
        if (notification.link) {
          window.location.href = notification.link;
        } else {
          window.location.href = '/site-dashboard';
        }
      };
    }
  };
  
  // Function to play notification sound
  const playNotificationSound = () => {
    try {
      // Try to play a notification sound using HTML5 Audio
      // This works better than Web Audio API for notifications
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.7;
      
      // Play sound
      audio.play().catch(error => {
        console.warn('Could not play notification sound file, trying fallback:', error);
        
        // Fallback: Use Web Audio API to create a beep
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          
          // Resume audio context if suspended (required by some browsers)
          if (audioContext.state === 'suspended') {
            audioContext.resume();
          }
          
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
        } catch (fallbackError) {
          console.warn('Could not play notification sound with fallback:', fallbackError);
        }
      });
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!siteId) {
        setLoading(false);
        return;
      }

      try {
        const [data, companiesData, allPanelImages, allAgreements, allTransactions] = await Promise.all([
          getSiteData(siteId),
          getCompanies(),
          getPanelImages(),
          getAgreements(),
          getTransactions()
        ]);
        
        setSiteData(data);
        setCompanies(companiesData);
        setPanelImages(allPanelImages);
        
        // Fetch notifications for site user
        if (auth && auth.currentUser) {
          const currentUser = getCurrentUser();
          if (currentUser && currentUser.uid) {
            try {
              // Get user document ID from Firestore users collection
              // First try to find user by email or uid
              const { getDocs, query, where, collection } = await import('firebase/firestore');
              const { db } = await import('../config/firebase.js');
              const usersRef = collection(db, 'users');
              
              // Try to find user by email first (site users have email like siteId@site.local)
              const emailQuery = query(usersRef, where('email', '==', currentUser.email || ''));
              const emailSnapshot = await getDocs(emailQuery);
              
              let userDocId = null;
              if (!emailSnapshot.empty) {
                userDocId = emailSnapshot.docs[0].id;
              } else {
                // If not found by email, try to find by siteId (for site users)
                if (siteId) {
                  const siteIdQuery = query(usersRef, where('siteId', '==', siteId), where('role', '==', 'site_user'));
                  const siteIdSnapshot = await getDocs(siteIdQuery);
                  if (!siteIdSnapshot.empty) {
                    userDocId = siteIdSnapshot.docs[0].id;
                  }
                }
              }
              
              // If still not found, use currentUser.uid as fallback
              const userIdToUse = userDocId || currentUser.uid;
              
              // Get initial notifications
              const userNotifications = await getNotifications(userIdToUse, false);
              setNotifications(userNotifications || []);
              
              // Set up real-time listener for new notifications
              const { onSnapshot } = await import('firebase/firestore');
              const notificationsRef = collection(db, 'notifications');
              const notificationsQuery = query(
                notificationsRef,
                where('userId', '==', userIdToUse)
              );
              
              const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
                const newNotifications = [];
                snapshot.forEach((doc) => {
                  newNotifications.push({
                    _docId: doc.id,
                    ...doc.data(),
                    id: doc.data().id || doc.id
                  });
                });
                
                // Sort by createdAt descending
                newNotifications.sort((a, b) => {
                  const aTime = a.createdAt?.seconds || a.createdAt || 0;
                  const bTime = b.createdAt?.seconds || b.createdAt || 0;
                  return bTime - aTime;
                });
                
                // Check for new unread notifications and show push notification
                const previousNotifications = userNotifications || [];
                const newUnreadNotifications = newNotifications.filter(n => 
                  !n.read && 
                  !previousNotifications.find(p => (p.id || p._docId) === (n.id || n._docId))
                );
                
                setNotifications(newNotifications);
                
                // Show push notification for new unread notifications
                newUnreadNotifications.forEach(notification => {
                  showPushNotification(notification);
                });
              }, (error) => {
                console.error('Error in notifications listener:', error);
              });
              
              // Store unsubscribe function for cleanup
              return () => {
                if (unsubscribe) unsubscribe();
              };
            } catch (error) {
              console.error('Error fetching notifications:', error);
            }
          }
        }
        
        // Initialize push notifications
        if ('serviceWorker' in navigator && 'Notification' in window) {
          initializePushNotifications().catch(error => {
            console.error('Error initializing push notifications:', error);
          });
        }
        
        // Set initial site form data
        if (data.site) {
          setSiteFormData({
            name: data.site.name || '',
            manager: data.site.manager || '',
            phone: data.site.phone || '',
            blocks: data.site.blocks || '',
            elevatorsPerBlock: data.site.elevatorsPerBlock || '',
            apartmentCount: data.site.apartmentCount || '',
            bankAccountName: data.site.bankAccountName || '',
            iban: data.site.iban || '',
            notes: data.site.notes || ''
          });
        }
        
        // Debug: Log panel images with full details
        console.log('SiteDashboard - Loaded panel images:', allPanelImages);
        console.log('SiteDashboard - Site ID:', siteId);
        if (allPanelImages && allPanelImages.length > 0) {
          allPanelImages.forEach((img, index) => {
            console.log(`SiteDashboard - Panel image ${index + 1} FULL DETAILS:`, {
              id: img.id,
              agreementId: img.agreementId,
              agreementIdType: typeof img.agreementId,
              agreementIdString: String(img.agreementId),
              siteId: img.siteId,
              siteIdType: typeof img.siteId,
              blockId: img.blockId,
              blockIdType: typeof img.blockId,
              panelId: img.panelId,
              panelIdType: typeof img.panelId,
              panelIdString: String(img.panelId),
              url: img.url,
              fullObject: img
            });
          });
        }
        
        // Also log agreements to see what we're searching for
        console.log('SiteDashboard - ALL agreements:', data.agreements.length);
        console.log('SiteDashboard - ALL agreements details:', data.agreements.map(a => ({
          id: a.id,
          idType: typeof a.id,
          idString: String(a.id),
          status: a.status,
          paymentReceived: a.paymentReceived,
          creditPaymentReceived: a.creditPaymentReceived,
          siteIds: a.siteIds,
          siteIdsType: Array.isArray(a.siteIds) ? 'array' : typeof a.siteIds,
          siteIdsIncludesADA52: Array.isArray(a.siteIds) ? a.siteIds.includes(siteId) : false
        })));
        
        const activeAgreements = data.agreements.filter(a => 
          a.status === 'active' && 
          (a.paymentReceived || a.creditPaymentReceived) && 
          Array.isArray(a.siteIds) && a.siteIds.includes(siteId)
        );
        
        console.log('SiteDashboard - Active agreements for site:', activeAgreements.length);
        console.log('SiteDashboard - Active agreements details:', activeAgreements.map(a => ({
          id: a.id,
          idType: typeof a.id,
          idString: String(a.id),
          companyId: a.companyId,
          siteIds: a.siteIds,
          sitePanelSelections: a.sitePanelSelections ? Object.keys(a.sitePanelSelections) : null
        })));
        
        // Calculate statistics
        if (data.site) {
          const totalPanels = parseInt(data.site.panels) || 0;
          
          // Count only panels from active and paid agreements
          const isAgreementPaid = (agreement) => agreement.paymentReceived || agreement.creditPaymentReceived;
          
          // Count used panels by checking all active and paid agreements
          let usedPanels = 0;
          data.agreements
            .filter(a => a.status === 'active' && isAgreementPaid(a) && Array.isArray(a.siteIds) && a.siteIds.includes(siteId))
            .forEach(agreement => {
              // Add the panel count for this site in this agreement
              usedPanels += agreement.sitePanelCounts?.[siteId] || 0;
            });
          
          const activeAgreements = data.agreements.filter(a => a.status === 'active' && Array.isArray(a.siteIds) && a.siteIds.includes(siteId)).length;
          
          // Calculate total revenue from both income and expense transactions
          // Income: payments received from companies for agreements
          // Expense: payments made to sites (these count as revenue for the site)
          const incomeTransactions = data.transactions.filter(t => 
            t.type === 'income' && 
            t.source?.includes('Anlaşma Ödemesi') &&
            // Make sure this transaction is related to an agreement for this site
            data.agreements.some(a => 
              Array.isArray(a.siteIds) && a.siteIds.includes(siteId) && 
              t.source?.includes(a.id)
            )
          );
          
          const expenseTransactions = data.transactions.filter(t => 
            t.type === 'expense' && 
            t.source?.includes('Site Ödemesi') && 
            t.source?.includes(data.site.name)
          );
          
          const totalRevenue = [
            ...incomeTransactions,
            ...expenseTransactions
          ].reduce((sum, t) => sum + Math.abs(t.amount), 0);
          
          
          // Calculate future payments using the same logic as SitesMain
          const helpers = SiteHelpers({
            companies: companiesData,
            sites: [data.site],
            agreements: allAgreements,
            transactions: allTransactions
          });
          const calculatedFuturePayments = helpers.calculatePendingPayments(data.site, allAgreements, companiesData, allTransactions);
          const totalFutureAmount = calculatedFuturePayments.reduce((sum, payment) => {
            const amount = parseFloat(payment.amount) || 0;
            return sum + (isNaN(amount) ? 0 : amount);
          }, 0);

          setFuturePayments(calculatedFuturePayments);
          setStats({
            totalPanels,
            usedPanels,
            activeAgreements,
            totalRevenue: totalRevenue || 0,
            futurePayments: calculatedFuturePayments.length,
            totalFutureAmount: isNaN(totalFutureAmount) ? 0 : totalFutureAmount
          });
        } else {
          // Site not found - show error message
          logger.error('Site not found for siteId:', siteId);
          setStats({
            totalPanels: 0,
            usedPanels: 0,
            activeAgreements: 0,
            totalRevenue: 0,
            futurePayments: 0,
            totalFutureAmount: 0
          });
        }
      } catch (error) {
        logger.error('Error fetching site data:', error);
        setStats({
          totalPanels: 0,
          usedPanels: 0,
          activeAgreements: 0,
          totalRevenue: 0,
          futurePayments: 0,
          totalFutureAmount: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [siteId]);

  // Get company name by ID
  const getCompanyName = (companyId) => {
    const company = companies.find(c => String(c.id) === String(companyId));
    return company ? company.name : 'Unknown';
  };

  // Get panel image from personnel uploads - EXACT SAME LOGIC AS CompanyDashboard
  const getPanelImage = (agreementId, siteId, blockId, panelId, panelImagesArray) => {
    const images = panelImagesArray || panelImages;
    if (!images || images.length === 0) {
      console.log('getPanelImage: No images available');
      return null;
    }
    
    const searchAgreementId = agreementId?.toString();
    const searchSiteId = siteId;
    const searchBlockId = blockId;
    const searchPanelId = panelId?.toString();
    
    console.log('getPanelImage: Searching for', {
      agreementId: searchAgreementId,
      siteId: searchSiteId,
      blockId: searchBlockId,
      panelId: searchPanelId
    });
    
    const found = images.find(img => {
      const imgAgreementId = img.agreementId?.toString();
      const imgSiteId = img.siteId;
      const imgBlockId = img.blockId;
      const imgPanelId = img.panelId?.toString();
      
      const match = imgAgreementId === searchAgreementId && 
                    imgSiteId === searchSiteId && 
                    imgBlockId === searchBlockId && 
                    imgPanelId === searchPanelId;
      
      if (match) {
        console.log('getPanelImage: FOUND MATCH', img);
      }
      
      return match;
    });
    
    if (!found) {
      console.log('getPanelImage: NO MATCH FOUND. Available images:', images.map(img => ({
        agreementId: img.agreementId?.toString(),
        siteId: img.siteId,
        blockId: img.blockId,
        panelId: img.panelId?.toString()
      })));
    }
    
    return found || null;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };
  
  // Handle edit site
  const handleEditSite = () => {
    if (siteData.site) {
      setSiteFormData({
        name: siteData.site.name || '',
        manager: siteData.site.manager || '',
        phone: siteData.site.phone || '',
        blocks: siteData.site.blocks || '',
        elevatorsPerBlock: siteData.site.elevatorsPerBlock || '',
        apartmentCount: siteData.site.apartmentCount || '',
        bankAccountName: siteData.site.bankAccountName || '',
        iban: siteData.site.iban || '',
        notes: siteData.site.notes || ''
      });
      setShowEditSiteModal(true);
    }
  };
  
  // Handle site form change
  const handleSiteFormChange = (e) => {
    const { name, value } = e.target;
    setSiteFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle site form submit - Create update request instead of direct update
  const handleSiteFormSubmit = async (e) => {
    e.preventDefault();
    if (!siteData.site) return;
    
    try {
      // Create update request instead of direct update
      // Helper function to remove undefined values (Firestore doesn't accept undefined)
      const cleanData = (data) => {
        const cleaned = {};
        Object.keys(data).forEach(key => {
          if (data[key] !== undefined) {
            cleaned[key] = data[key] ?? null; // Convert undefined to null
          }
        });
        return cleaned;
      };
      
      const requestData = {
        siteId: siteData.site.id,
        siteName: siteData.site.name,
        requestedBy: user?.email || user?.username || 'Site User',
        requestedByRole: 'site_user',
        currentData: cleanData({
          name: siteData.site.name || '',
          manager: siteData.site.manager || '',
          phone: siteData.site.phone || '',
          blocks: siteData.site.blocks || 0,
          elevatorsPerBlock: siteData.site.elevatorsPerBlock || 0,
          apartmentCount: siteData.site.apartmentCount || 0,
          bankAccountName: siteData.site.bankAccountName || '',
          iban: siteData.site.iban || '',
          notes: siteData.site.notes || ''
        }),
        requestedData: cleanData(siteFormData),
        changes: {} // Will be calculated
      };
      
      // Calculate changes
      const changes = {};
      Object.keys(siteFormData).forEach(key => {
        if (siteFormData[key] !== requestData.currentData[key]) {
          changes[key] = {
            old: requestData.currentData[key],
            new: siteFormData[key]
          };
        }
      });
      
      requestData.changes = changes;
      
      if (Object.keys(changes).length === 0) {
        await window.showAlert('Bilgi', 'Değişiklik yapılmadı.', 'info');
        setShowEditSiteModal(false);
        return;
      }
      
      const request = await createSiteUpdateRequest(requestData);
      if (request) {
        setShowEditSiteModal(false);
        await window.showAlert(
          'Başarılı', 
          'Site bilgileri güncelleme talebi oluşturuldu. Admin onayından sonra değişiklikler uygulanacaktır.', 
          'success'
        );
      }
    } catch (error) {
      console.error('Error creating site update request:', error);
      await window.showAlert('Hata', 'Güncelleme talebi oluşturulurken bir hata oluştu.', 'error');
    }
  };

  // Generate block labels (A, B, C, etc.)
  const generateBlockLabels = (blockCount) => {
    const labels = [];
    for (let i = 0; i < blockCount; i++) {
      labels.push(String.fromCharCode(65 + i)); // A, B, C, etc.
    }
    return labels;
  };

  // Calculate panel distribution across blocks
  const getPanelBlockInfo = () => {
    if (!siteData.site) return [];
    
    const isBusinessCenter = siteData.site.siteType === 'business_center';

    // İş merkezleri için blok/panel hesabı farklı:
    // - Her iş merkezi tek blok gibi düşünülür (A)
    // - Panel sayısı doğrudan site.panels alanından alınır
    const blocks = isBusinessCenter ? 1 : (parseInt(siteData.site.blocks) || 0);
    const elevatorsPerBlock = isBusinessCenter ? 0 : (parseInt(siteData.site.elevatorsPerBlock) || 0);
    const panelsPerElevator = 2; // Siteler için her asansörde 2 panel
    const panelsPerBlock = isBusinessCenter
      ? (parseInt(siteData.site.panels) || 0)
      : elevatorsPerBlock * panelsPerElevator;
    
    const blockInfo = [];
    let panelCounter = 1;
    
    const blockLabels = isBusinessCenter ? ['A'] : generateBlockLabels(blocks);
    
    for (let blockIndex = 0; blockIndex < blocks; blockIndex++) {
      const blockNumber = blockIndex + 1;
      const blockLabel = blockLabels[blockIndex] || 'A';
      const blockPanels = [];
      
      for (let panelInBlock = 0; panelInBlock < panelsPerBlock; panelInBlock++) {
        if (panelCounter <= stats.totalPanels) {
          const panelId = `panel-${panelInBlock + 1}`; // Panel IDs are 1-based
          const isActive = isPanelUsedInActiveAgreements(blockIndex, panelInBlock);
          blockPanels.push({
            panelNumber: panelCounter,
            panelId: panelId,
            isActive,
            blockIndex,
            panelInBlock,
            elevatorNumber: Math.floor(panelInBlock / panelsPerElevator) + 1,
            panelInElevator: (panelInBlock % panelsPerElevator) + 1
          });
          panelCounter++;
        }
      }
      
      if (blockPanels.length > 0) {
        blockInfo.push({
          blockNumber,
          blockLabel,
          panels: blockPanels,
          activePanels: blockPanels.filter(p => p.isActive).length,
          totalPanels: blockPanels.length
        });
      }
    }
    
    return blockInfo;
  };

  // Check if a panel is used in any active agreement
  // An agreement is active if it's status is 'active' and payment has been received
  const isPanelUsedInActiveAgreements = (blockIndex, panelInBlock) => {
    const isAgreementPaid = (agreement) => agreement.paymentReceived || agreement.creditPaymentReceived;
    // Filter for active agreements that are also paid and include this site
    const activeAgreements = siteData.agreements.filter(a => 
      a.status === 'active' && 
      isAgreementPaid(a) && 
      Array.isArray(a.siteIds) && a.siteIds.includes(siteId)
    );
    
    const blockLabel = String.fromCharCode(65 + blockIndex); // A, B, C, etc.
    const blockId = `${siteId}-block-${blockLabel}`; // Format: siteId-block-A, siteId-block-B, etc.
    const panelId = `panel-${panelInBlock + 1}`; // Panel IDs are 1-based
    
    for (const agreement of activeAgreements) {
      // Check if this site has panel selections for this agreement
      if (agreement.sitePanelSelections && agreement.sitePanelSelections[siteId]) {
        const sitePanelData = agreement.sitePanelSelections[siteId];
        
        // Check if this block is selected for this site in this agreement
        if (sitePanelData[blockId]) {
          // Check if new format (with date ranges)
          if (agreement.dateRanges && Array.isArray(agreement.dateRanges) && agreement.dateRanges.length > 0) {
            // New format: check all date ranges
            for (let rangeIndex = 0; rangeIndex < agreement.dateRanges.length; rangeIndex++) {
              const rangeKey = `range-${rangeIndex}`;
              const rangePanels = sitePanelData[blockId]?.[rangeKey] || [];
              if (Array.isArray(rangePanels) && rangePanels.includes(panelId)) {
                return true;
              }
            }
          } else {
            // Old format: direct array check
            if (Array.isArray(sitePanelData[blockId]) && sitePanelData[blockId].includes(panelId)) {
              return true;
            }
          }
        }
      }
    }
    
    return false;
  };

  // Get panel usage information
  // An agreement is active if it's status is 'active' and payment has been received
  const getPanelUsageInfo = (blockIndex, panelInBlock) => {
    const isAgreementPaid = (agreement) => agreement.paymentReceived || agreement.creditPaymentReceived;
    // Filter for active agreements that are also paid and include this site
    const activeAgreements = siteData.agreements.filter(a => 
      a.status === 'active' && 
      isAgreementPaid(a) && 
      Array.isArray(a.siteIds) && a.siteIds.includes(siteId)
    );
    
    const blockLabel = String.fromCharCode(65 + blockIndex); // A, B, C, etc.
    const blockId = `${siteId}-block-${blockLabel}`; // Format: siteId-block-A, siteId-block-B, etc.
    const panelId = `panel-${panelInBlock + 1}`; // Panel IDs are 1-based
    
    console.log('getPanelUsageInfo: Searching for panel:', {
      blockIndex,
      panelInBlock,
      blockLabel,
      blockId,
      panelId,
      activeAgreementsCount: activeAgreements.length
    });
    
    for (const agreement of activeAgreements) {
      // Check if this site has panel selections for this agreement
      if (agreement.sitePanelSelections && agreement.sitePanelSelections[siteId]) {
        const sitePanelData = agreement.sitePanelSelections[siteId];
        
        // Check if this block is selected for this site in this agreement
        if (sitePanelData[blockId]) {
          // Check if new format (with date ranges)
          if (agreement.dateRanges && Array.isArray(agreement.dateRanges) && agreement.dateRanges.length > 0) {
            // New format: check all date ranges
            for (let rangeIndex = 0; rangeIndex < agreement.dateRanges.length; rangeIndex++) {
              const rangeKey = `range-${rangeIndex}`;
              const rangePanels = sitePanelData[blockId]?.[rangeKey] || [];
              if (Array.isArray(rangePanels) && rangePanels.includes(panelId)) {
                console.log('getPanelUsageInfo: FOUND in new format:', {
                  agreementId: agreement.id,
                  blockId,
                  panelId,
                  rangeKey
                });
                return {
                  agreementId: agreement.id,
                  companyName: getCompanyName(agreement.companyId),
                  startDate: agreement.startDate,
                  endDate: agreement.endDate,
                  photoUrl: agreement.photoUrl
                };
              }
            }
          } else {
            // Old format: direct array check
            if (Array.isArray(sitePanelData[blockId]) && sitePanelData[blockId].includes(panelId)) {
              console.log('getPanelUsageInfo: FOUND in old format:', {
                agreementId: agreement.id,
                blockId,
                panelId
              });
              return {
                agreementId: agreement.id,
                companyName: getCompanyName(agreement.companyId),
                startDate: agreement.startDate,
                endDate: agreement.endDate,
                photoUrl: agreement.photoUrl
              };
            }
          }
        }
      }
    }
    
    console.log('getPanelUsageInfo: NOT FOUND for panel:', { blockIndex, panelInBlock, blockId, panelId });
    return null;
  };

  // Filter agreements based on payment filter and site
  const getFilteredAgreements = () => {
    let filtered = siteData.agreements.filter(a => Array.isArray(a.siteIds) && a.siteIds.includes(siteId));
    
    // Filter by payment status
    if (!paymentFilter.showPaid || !paymentFilter.showUnpaid) {
      const isAgreementPaid = (agreement) => agreement.paymentReceived || agreement.creditPaymentReceived;
      
      if (!paymentFilter.showPaid) {
        filtered = filtered.filter(a => !isAgreementPaid(a));
      }
      if (!paymentFilter.showUnpaid) {
        filtered = filtered.filter(a => isAgreementPaid(a));
      }
    }
    
    // Filter by date range
    if (paymentFilter.dateFrom) {
      filtered = filtered.filter(a => 
        new Date(a.startDate) >= new Date(paymentFilter.dateFrom)
      );
    }
    if (paymentFilter.dateTo) {
      filtered = filtered.filter(a => 
        new Date(a.endDate) <= new Date(paymentFilter.dateTo)
      );
    }
    
    return filtered;
  };

  // Handle payment filter changes
  const handleFilterChange = (field, value) => {
    setPaymentFilter(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setPaymentFilter({
      dateFrom: '',
      dateTo: '',
      showPaid: true,
      showUnpaid: true
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="loading-spinner mx-auto"></div>
          <p className="mt-3 text-muted">Site bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Show error if site not found
  if (!siteData.site) {
    return (
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card border-danger shadow-sm mt-5">
              <div className="card-header bg-danger text-white">
                <h5 className="mb-0">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Site Bulunamadı
                </h5>
              </div>
              <div className="card-body">
                <div className="alert alert-danger">
                  <h6 className="alert-heading">Site bilgileri yüklenemedi</h6>
                  <p className="mb-2">
                    <strong>Site ID:</strong> {siteId || 'Belirtilmemiş'}
                  </p>
                  <p className="mb-0 small">
                    Bu site ID'si ile kayıtlı bir site bulunamadı. Lütfen:
                  </p>
                  <ul className="mb-0 mt-2 small">
                    <li>Site ID'nizin doğru olduğundan emin olun</li>
                    <li>Site'in Firebase'de kayıtlı olduğunu kontrol edin</li>
                    <li>Yönetici ile iletişime geçin</li>
                  </ul>
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                      window.location.href = '/';
                    }}
                  >
                    <i className="bi bi-arrow-left me-1"></i>
                    Ana Sayfaya Dön
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => window.location.reload()}
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Sayfayı Yenile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-2 px-md-3 px-lg-4">
      {/* Site Header - Responsive */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 mb-md-4 gap-2">
        <div className="flex-grow-1">
          <h2 className="h3 h4-md fw-bold mb-1">{siteData.site?.name || 'Site Panosu'}</h2>
          <p className="text-muted mb-0 small">Site ID: {siteData.site?.id || siteId}</p>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2 w-100 w-md-auto">
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={handleEditSite}
            title="Site Bilgilerini Düzenle"
          >
            <i className="bi bi-pencil me-1"></i>
            <span className="d-none d-sm-inline">Bilgilerimi Düzenle</span>
            <span className="d-sm-none">Düzenle</span>
          </button>
          {/* Dropdown Menu */}
          <div className="dropdown">
            <button
              className="btn btn-outline-primary btn-sm dropdown-toggle"
              type="button"
              id="siteMenuDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="bi bi-list me-1 me-md-2"></i>
              <span className="d-none d-sm-inline">Menü</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="siteMenuDropdown">
              <li>
                <a className="dropdown-item active" href="#">
                  <i className="bi bi-speedometer2 me-2"></i>
                  Site Panosu
                </a>
              </li>
            </ul>
          </div>
          <button 
            className="btn btn-outline-danger btn-sm"
            onClick={async () => {
              // Stop keep-alive mechanism
              const { cleanupKeepAlive } = await import('../utils/keepAlive');
              await cleanupKeepAlive();
              
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/';
            }}
          >
            <i className="bi bi-box-arrow-right me-1"></i>
            <span className="d-none d-sm-inline">Çıkış Yap</span>
            <span className="d-sm-none">Çıkış</span>
          </button>
        </div>
      </div>

      {/* Notification Permission Request - Responsive */}
      {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
        <div className="alert alert-info border-0 shadow-sm mb-3 mb-md-4" style={{ borderRadius: '12px' }}>
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2">
            <div className="d-flex align-items-center flex-grow-1">
              <i className="bi bi-bell fs-4 fs-5-md me-2 me-md-3"></i>
              <div>
                <h6 className="mb-1 fw-bold small">Bildirim İzni</h6>
                <p className="mb-0 small d-none d-md-block">Yeni duyuruları anında almak için bildirim izni verin.</p>
                <p className="mb-0 small d-md-none">Bildirim izni verin.</p>
              </div>
            </div>
            <button
              className="btn btn-sm btn-primary w-100 w-md-auto"
              onClick={async () => {
                const result = await requestNotificationPermission();
                if (result.granted) {
                  await initializePushNotifications();
                  await window.showAlert('Başarılı', 'Bildirim izni verildi. Artık yeni duyuruları anında alacaksınız.', 'success');
                  window.location.reload();
                } else {
                  await window.showAlert('Bildirim İzni', 'Bildirim izni verilmedi. Lütfen tarayıcı ayarlarından izin verin.', 'warning');
                }
              }}
            >
              <i className="bi bi-check-circle me-1"></i>
              İzin Ver
            </button>
          </div>
        </div>
      )}

      {/* Notifications Section - Modern Design */}
      {notifications.length > 0 && (
        <div className={`alert alert-${notifications.filter(n => !n.read).length > 0 ? 'primary' : 'info'} border-0 shadow-sm mb-4`} style={{ borderRadius: '12px' }}>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center flex-grow-1">
              <div className="me-3">
                <i className={`bi bi-${notifications.filter(n => !n.read).length > 0 ? 'bell-fill' : 'bell'} fs-4`} style={{ color: notifications.filter(n => !n.read).length > 0 ? '#0d6efd' : '#6c757d' }}></i>
              </div>
              <div className="flex-grow-1">
                <div className="d-flex align-items-center mb-1">
                  <h6 className="mb-0 fw-bold me-2">Duyurular ve Bildirimler</h6>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="badge bg-danger rounded-pill">
                      {notifications.filter(n => !n.read).length} Yeni
                    </span>
                  )}
                </div>
                {!notificationsCollapsed && (
                  <div className="mt-2">
                    {notifications.slice(0, 3).map((notification) => (
                      <div
                        key={notification.id || notification._docId}
                        className={`mb-2 p-2 rounded ${!notification.read ? 'bg-light border-start border-3 border-primary' : 'bg-white'}`}
                        style={{ fontSize: '0.9rem' }}
                      >
                        <div className="d-flex align-items-start">
                          <div className={`badge ${notification.type === 'payment' ? 'bg-success' : notification.type === 'warning' ? 'bg-warning' : notification.type === 'error' ? 'bg-danger' : 'bg-info'} me-2 mt-1`} style={{ fontSize: '0.7rem' }}>
                            <i className={`bi ${notification.type === 'payment' ? 'bi-cash-coin' : notification.type === 'warning' ? 'bi-exclamation-triangle' : notification.type === 'error' ? 'bi-x-circle' : 'bi-info-circle'}`}></i>
                          </div>
                          <div className="flex-grow-1">
                            <div className="fw-semibold">{notification.title}</div>
                            <div className="text-muted small">{notification.message}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                              {notification.createdAt 
                                ? new Date(notification.createdAt.seconds * 1000 || notification.createdAt).toLocaleDateString('tr-TR', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : 'Yeni'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {notifications.length > 3 && (
                      <div className="text-muted small mt-2">
                        <i className="bi bi-three-dots me-1"></i>
                        {notifications.length - 3} bildirim daha var. Tüm bildirimleri görmek için üstteki bildirim ikonuna tıklayın.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button
              className="btn btn-sm btn-link text-decoration-none ms-2"
              onClick={() => setNotificationsCollapsed(!notificationsCollapsed)}
              title={notificationsCollapsed ? "Genişlet" : "Daralt"}
            >
              <i className={`bi bi-chevron-${notificationsCollapsed ? 'down' : 'up'}`}></i>
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards - Responsive */}
      <div className="row g-2 g-md-3 mb-3 mb-md-4">
        <div className="col-6 col-sm-4 col-md-3 col-lg-2">
          <div className="card custom-card bg-primary text-white h-100">
            <div className="card-body text-center p-2 p-md-3">
              <i className="bi bi-building fs-3 fs-4-md mb-1 mb-md-2"></i>
              <h6 className="card-title small mb-1 mb-md-2">Toplam Panel</h6>
              <h3 className="card-text mb-0 fs-5 fs-4-md">{stats.totalPanels}</h3>
            </div>
          </div>
        </div>
        <div className="col-6 col-sm-4 col-md-3 col-lg-2">
          <div className="card custom-card bg-success text-white h-100">
            <div className="card-body text-center p-2 p-md-3">
              <i className="bi bi-tv fs-3 fs-4-md mb-1 mb-md-2"></i>
              <h6 className="card-title small mb-1 mb-md-2">Kullanılan Panel</h6>
              <h3 className="card-text mb-0 fs-5 fs-4-md">{stats.usedPanels}</h3>
            </div>
          </div>
        </div>
        <div className="col-6 col-sm-4 col-md-3 col-lg-2">
          <div className="card custom-card bg-info text-white h-100">
            <div className="card-body text-center p-2 p-md-3">
              <i className="bi bi-file-earmark-text fs-3 fs-4-md mb-1 mb-md-2"></i>
              <h6 className="card-title small mb-1 mb-md-2">Aktif Anlaşma</h6>
              <h3 className="card-text mb-0 fs-5 fs-4-md">{stats.activeAgreements}</h3>
            </div>
          </div>
        </div>
        <div className="col-6 col-sm-6 col-md-4 col-lg-3">
          <div className="card custom-card bg-warning text-white h-100">
            <div className="card-body text-center p-2 p-md-3">
              <i className="bi bi-currency-dollar fs-3 fs-4-md mb-1 mb-md-2"></i>
              <h6 className="card-title small mb-1 mb-md-2">Toplam Gelir</h6>
              <h4 className="card-text mb-0 fs-6 fs-5-md">{formatCurrency(stats.totalRevenue)}</h4>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-md-4 col-lg-3">
          <div className="card custom-card bg-success text-white h-100">
            <div className="card-body text-center p-2 p-md-3">
              <i className="bi bi-arrow-down-circle fs-3 fs-4-md mb-1 mb-md-2"></i>
              <h6 className="card-title small mb-1 mb-md-2">Gelecek Ödeme</h6>
              <h3 className="card-text mb-0 fs-5 fs-4-md">{stats.futurePayments}</h3>
              <div className="small">{formatCurrency(stats.totalFutureAmount)}</div>
            </div>
          </div>
        </div>
      </div>


      {/* Site Panels - Show all panels for this site - Responsive */}
      {siteData.site && (
        <div className="row g-2 g-md-3 g-lg-4 mb-3 mb-md-4">
          <div className="col-12">
            <div className="card custom-card shadow-sm">
              <div className="card-header bg-primary-subtle">
                <h5 className="mb-0 fw-bold small">
                  <i className="bi bi-grid-3x3-gap me-2"></i>
                  Site Panelleri
                </h5>
              </div>
              <div className="card-body p-2 p-md-3">
                {(() => {
                  const site = siteData.site;
                  
                  // Calculate panels based on site type
                  let blockCount, panelsPerBlock, blockLabels;
                  
                  if (site.siteType === 'business_center') {
                    blockCount = 1;
                    panelsPerBlock = parseInt(site.panels) || 0;
                    blockLabels = ['A'];
                  } else {
                    blockCount = parseInt(site.blocks) || 0;
                    const elevatorsPerBlock = parseInt(site.elevatorsPerBlock) || 0;
                    panelsPerBlock = elevatorsPerBlock * 2;
                    blockLabels = generateBlockLabels(blockCount);
                  }
                  
                  // Collect all used blocks and panels from all active agreements
                  const allUsedBlocks = new Set();
                  const allPanelSelections = {};
                  
                  siteData.agreements
                    .filter(a => 
                      a.status === 'active' && 
                      Array.isArray(a.siteIds) && a.siteIds.includes(siteId)
                    )
                    .forEach((agreement) => {
                      let usedBlocks = [];
                      let panelSelections = {};
                      
                      if (agreement.dateRanges && Array.isArray(agreement.dateRanges) && agreement.dateRanges.length > 0) {
                        agreement.dateRanges.forEach((range, rangeIndex) => {
                          const rangeKey = `range-${rangeIndex}`;
                          const rangeBlocks = agreement.siteBlockSelections?.[rangeKey]?.[siteId] || [];
                          usedBlocks = [...new Set([...usedBlocks, ...rangeBlocks])];
                          
                          const sitePanelData = agreement.sitePanelSelections?.[siteId] || {};
                          Object.keys(sitePanelData).forEach(blockKey => {
                            if (!panelSelections[blockKey]) {
                              panelSelections[blockKey] = [];
                            }
                            const rangePanels = sitePanelData[blockKey]?.[rangeKey] || [];
                            panelSelections[blockKey] = [...new Set([...panelSelections[blockKey], ...rangePanels])];
                          });
                        });
                      } else {
                        usedBlocks = agreement.siteBlockSelections?.[siteId] || [];
                        panelSelections = agreement.sitePanelSelections?.[siteId] || {};
                      }
                      
                      usedBlocks.forEach(blockId => allUsedBlocks.add(blockId));
                      Object.keys(panelSelections).forEach(blockKey => {
                        if (!allPanelSelections[blockKey]) {
                          allPanelSelections[blockKey] = [];
                        }
                        allPanelSelections[blockKey] = [...new Set([...allPanelSelections[blockKey], ...panelSelections[blockKey]])];
                      });
                    });
                  
                  // Generate all block keys for this site
                  const allBlockKeys = blockLabels.map(label => `site-${siteId}-${label}`);
                  
                  return (
                    <div className="row g-2 g-md-3">
                      {allBlockKeys.map((blockId) => {
                        const blockLabel = blockId.split('-')[2];
                        const usedPanels = allPanelSelections[blockId] || [];
                        const isBlockUsed = allUsedBlocks.has(blockId);
                        
                        // Find which agreement uses this block (for panel images)
                        const agreementForBlock = siteData.agreements.find(a => {
                          if (a.status !== 'active' || !Array.isArray(a.siteIds) || !a.siteIds.includes(siteId)) return false;
                          
                          if (a.dateRanges && Array.isArray(a.dateRanges) && a.dateRanges.length > 0) {
                            return a.dateRanges.some((range, rangeIndex) => {
                              const rangeKey = `range-${rangeIndex}`;
                              const rangeBlocks = a.siteBlockSelections?.[rangeKey]?.[siteId] || [];
                              return rangeBlocks.includes(blockId);
                            });
                          } else {
                            const blocks = a.siteBlockSelections?.[siteId] || [];
                            return blocks.includes(blockId);
                          }
                        });
                        
                        return (
                          <div key={blockId} className="col-12 col-sm-6 col-md-6 col-lg-4 col-xl-3">
                            <div className="card border-info h-100">
                              <div className="card-header bg-info-subtle p-2 p-md-3">
                                <h6 className="mb-0 fw-bold small">
                                  <i className="bi bi-grid-3x3-gap me-1"></i>
                                  {blockLabel} Blok
                                  {isBlockUsed && agreementForBlock && (
                                    <span className="badge bg-primary ms-2 small">
                                      <span className="d-none d-md-inline">{getCompanyName(agreementForBlock.companyId)}</span>
                                      <span className="d-md-none">Firma</span>
                                    </span>
                                  )}
                                </h6>
                              </div>
                              <div className="card-body p-2 p-md-3">
                                <div className="small text-muted mb-2">
                                  Kullanılan: {usedPanels.length} / {panelsPerBlock}
                                </div>
                                <div className="d-flex flex-wrap gap-1">
                                  {Array.from({ length: panelsPerBlock }, (_, panelIndex) => {
                                    const panelId = panelIndex + 1;
                                    const panelKey = `panel-${panelId}`;
                                    const isPanelUsed = usedPanels.includes(panelKey);
                                    const fullPanelNumber = `${siteId}${blockLabel}${panelId}`;
                                    
                                    // Try to find panel image from any agreement for this site/block/panel
                                    let panelImage = null;
                                    if (agreementForBlock) {
                                      panelImage = getPanelImage(agreementForBlock.id.toString(), siteId, blockId, panelId.toString(), panelImages);
                                    }
                                    
                                    // If not found, search in all panel images for this site/block/panel
                                    if (!panelImage) {
                                      panelImage = panelImages.find(img => 
                                        img.siteId === siteId && 
                                        img.blockId === blockId && 
                                        img.panelId?.toString() === panelId.toString()
                                      );
                                    }
                                    
                                    return (
                                      <div
                                        key={panelKey}
                                        className={`d-flex align-items-center justify-content-center ${
                                          isPanelUsed ? 'bg-primary text-white' : 'bg-light text-muted'
                                        } border rounded position-relative`}
                                        style={{
                                          width: panelImage ? '70px' : '50px',
                                          height: panelImage ? '100px' : '70px',
                                          fontSize: '7px',
                                          fontWeight: 'bold',
                                          flexDirection: 'column',
                                          cursor: 'default',
                                          backgroundImage: panelImage ? `url(${panelImage.url})` : 'none',
                                          backgroundSize: 'cover',
                                          backgroundPosition: 'center',
                                          backgroundRepeat: 'no-repeat',
                                          minHeight: panelImage ? '100px' : '70px'
                                        }}
                                        className="panel-box"
                                        title={isPanelUsed ? `Panel ${fullPanelNumber} - ${agreementForBlock ? getCompanyName(agreementForBlock.companyId) : 'Kullanılıyor'}${panelImage ? ' (Fotoğraf var)' : ''}` : `Panel ${panelId} - Boş`}
                                      >
                                        {!panelImage && (
                                          <>
                                            <div className="fw-bold">{panelId}</div>
                                            {isPanelUsed && (
                                              <div className="text-truncate" style={{ fontSize: '7px', lineHeight: '1', maxWidth: '50px' }}>
                                                {fullPanelNumber}
                                              </div>
                                            )}
                                          </>
                                        )}
                                        {isPanelUsed && (
                                          <div className="position-absolute top-0 end-0" style={{ fontSize: '8px' }}>
                                            {panelImage ? (
                                              <i className="bi bi-camera-fill text-success"></i>
                                            ) : (
                                              <i className="bi bi-lock-fill"></i>
                                            )}
                                          </div>
                                        )}
                                        {panelImage && (
                                          <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white text-center" style={{ fontSize: '6px', padding: '2px' }}>
                                            Panel {panelId}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agreements and Payments - Responsive */}
      <div className="row g-2 g-md-3 g-lg-4">
        <div className="col-12">
          <div className="card custom-card shadow-sm">
            <div className="card-header bg-info-subtle p-2 p-md-3">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
                <h5 className="mb-0 fw-bold small">
                  <i className="bi bi-file-earmark-text me-2"></i>
                  Anlaşmalar ve Ödemeler
                </h5>
                <div className="d-flex flex-wrap gap-2 w-100 w-md-auto">
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    style={{ minWidth: '140px' }}
                    value={paymentFilter.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    placeholder="Başlangıç"
                  />
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    style={{ minWidth: '140px' }}
                    value={paymentFilter.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    placeholder="Bitiş"
                  />
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={clearFilters}
                    title="Filtreleri Temizle"
                  >
                    <i className="bi bi-x-circle"></i>
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body p-2 p-md-3">
              {getFilteredAgreements().length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-file-earmark text-muted fs-1"></i>
                  <p className="text-muted mt-2 small">Seçilen kriterlere uygun anlaşma bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table custom-table table-sm">
                    <thead>
                      <tr>
                        <th className="small">Firma</th>
                        <th className="small d-none d-md-table-cell">Başlangıç</th>
                        <th className="small d-none d-md-table-cell">Bitiş</th>
                        <th className="small">Panel</th>
                        <th className="small d-none d-lg-table-cell">Haftalık</th>
                        <th className="small">Toplam</th>
                        <th className="small">Durum</th>
                        <th className="small">Ödeme</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(getFilteredAgreements() || []).map((agreement) => {
                        const isPaid = agreement.paymentReceived || agreement.creditPaymentReceived;
                        return (
                          <tr key={agreement.id}>
                            <td className="fw-medium small">
                              <div className="d-md-none">
                                <div>{getCompanyName(agreement.companyId)}</div>
                                <small className="text-muted">
                                  {formatDate(agreement.startDate)} - {formatDate(agreement.endDate)}
                                </small>
                              </div>
                              <span className="d-none d-md-inline">{getCompanyName(agreement.companyId)}</span>
                            </td>
                            <td className="small d-none d-md-table-cell">{formatDate(agreement.startDate)}</td>
                            <td className="small d-none d-md-table-cell">{formatDate(agreement.endDate)}</td>
                            <td className="small">{agreement.sitePanelCounts?.[siteId] || 0}</td>
                            <td className="small d-none d-lg-table-cell">{formatCurrency(agreement.weeklyRatePerPanel || 0)}</td>
                            <td className={`small ${isPaid ? 'text-success fw-bold' : 'text-danger fw-bold'}`}>
                              {formatCurrency(agreement.totalAmount || 0)}
                            </td>
                            <td>
                              <span className={`badge small ${
                                agreement.status === 'active' 
                                  ? 'bg-success-subtle text-success-emphasis' 
                                  : 'bg-danger-subtle text-danger-emphasis'
                              }`}>
                                {agreement.status === 'active' ? 'Aktif' : 'Pasif'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge small ${
                                isPaid
                                  ? 'bg-success-subtle text-success-emphasis' 
                                  : 'bg-warning-subtle text-warning-emphasis'
                              }`}>
                                {isPaid ? 'Ödendi' : 'Bekliyor'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment History Section */}
      <div className="row g-4 mt-2">
        <div className="col-md-12">
          <div className="card custom-card shadow-sm">
            <div className="card-header bg-success-subtle">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-clock-history me-2"></i>
                Geçmiş Ödemeler
              </h5>
            </div>
            <div className="card-body">
              {siteData.transactions
                .filter(t => 
                  (t.type === 'income' && t.source?.includes('Anlaşma Ödemesi') && 
                   siteData.agreements.some(a => Array.isArray(a.siteIds) && a.siteIds.includes(siteId) && t.source?.includes(a.id))) ||
                  (t.type === 'expense' && t.source?.includes('Site Ödemesi') && t.source?.includes(siteData.site?.name))
                )
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-clock-history text-muted fs-1"></i>
                  <p className="text-muted mt-2 small">Henüz ödeme bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table custom-table table-sm">
                    <thead>
                      <tr>
                        <th className="small">Tarih</th>
                        <th className="small">Tür</th>
                        <th className="small d-none d-md-table-cell">Açıklama</th>
                        <th className="small">Tutar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {siteData.transactions
                        .filter(t => 
                          (t.type === 'income' && t.source?.includes('Anlaşma Ödemesi') && 
                           siteData.agreements.some(a => Array.isArray(a.siteIds) && a.siteIds.includes(siteId) && t.source?.includes(a.id))) ||
                          (t.type === 'expense' && t.source?.includes('Site Ödemesi') && t.source?.includes(siteData.site?.name))
                        )
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((transaction) => {
                          // Determine transaction type and description
                          let transactionType = '';
                          let description = '';
                          let amountClass = '';
                          
                          if (transaction.type === 'income' && transaction.source?.includes('Anlaşma Ödemesi')) {
                            transactionType = 'Firma Ödemesi';
                            amountClass = 'text-success fw-bold';
                            // Extract company name and agreement ID
                            const companyMatch = transaction.source?.match(/Anlaşma Ödemesi - ([^(]+)/);
                            const agreementMatch = transaction.source?.match(/Anlaşma Ödemesi - [^(]+ \(([^)]+)\)/);
                            const companyName = companyMatch ? companyMatch[1].trim() : 'Bilinmeyen Firma';
                            const agreementId = agreementMatch ? agreementMatch[1] : 'Bilinmiyor';
                            description = `${companyName} - Anlaşma #${agreementId}`;
                          } else if (transaction.type === 'expense' && transaction.source?.includes('Site Ödemesi')) {
                            transactionType = 'Site Ödemesi';
                            amountClass = 'text-primary fw-bold';
                            // Extract company name from description
                            const companyMatch = transaction.description?.match(/([^ ]+) anlaşmasından gelen ödeme/);
                            const companyName = companyMatch ? companyMatch[1] : 'Bilinmeyen Firma';
                            description = `${companyName} tarafından ödeme`;
                          }
                          
                          return (
                            <tr key={transaction.id}>
                              <td className="small">{formatDate(transaction.date)}</td>
                              <td>
                                <span className={`badge small ${
                                  transaction.type === 'income' 
                                    ? 'bg-success-subtle text-success-emphasis' 
                                    : 'bg-primary-subtle text-primary-emphasis'
                                }`}>
                                  {transactionType}
                                </span>
                              </td>
                              <td className="small d-none d-md-table-cell">{description}</td>
                              <td className={`small ${amountClass}`}>
                                {formatCurrency(Math.abs(transaction.amount))}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Future Payments Section */}
      <div className="row g-4 mt-2">
        <div className="col-md-12">
          <div className="card custom-card shadow-sm">
            <div className="card-header bg-success-subtle d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-arrow-down-circle me-2"></i>
                Gelecek Ödemeler
              </h5>
              <div className="fw-bold text-success">
                Toplam Gelecek: {formatCurrency(stats.totalFutureAmount)}
              </div>
            </div>
            <div className="card-body">
              {futurePayments.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-check-circle text-success fs-1"></i>
                  <p className="text-muted mt-2">Gelecek ödeme bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table custom-table">
                    <thead>
                      <tr>
                        <th>Anlaşma ID</th>
                        <th>Firma</th>
                        <th>Panel Sayısı</th>
                        <th>Haftalık Tutar</th>
                        <th>Site Yüzdesi</th>
                        <th>Site Ödemesi</th>
                        <th>Başlangıç Tarihi</th>
                        <th>Bitiş Tarihi</th>
                        <th>Ödeme Durumu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {futurePayments.map((payment, index) => (
                        <tr key={index}>
                          <td>#{payment.agreementId}</td>
                          <td className="fw-medium">{payment.companyName}</td>
                          <td>{payment.panelCount} panel</td>
                          <td>{formatCurrency(payment.weeklyRatePerPanel)}</td>
                          <td>{payment.sitePercentage}%</td>
                          <td className="text-success fw-bold">{formatCurrency(payment.amount)}</td>
                          <td>{formatDate(payment.startDate)}</td>
                          <td>{formatDate(payment.endDate)}</td>
                          <td>
                            <span className={`badge ${
                              payment.paymentReceived
                                ? 'bg-success-subtle text-success-emphasis' 
                                : 'bg-primary-subtle text-primary-emphasis'
                            }`}>
                              {payment.paymentReceived ? 'Nakit Ödendi' : 'Kredi ile Ödendi'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Site Modal */}
      {showEditSiteModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-pencil me-2"></i>
                  Site Bilgilerini Düzenle
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditSiteModal(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSiteFormSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="siteName" className="form-label">Site Adı *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="siteName"
                        name="name"
                        value={siteFormData.name}
                        onChange={handleSiteFormChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="siteManager" className="form-label">Yönetici</label>
                      <input
                        type="text"
                        className="form-control"
                        id="siteManager"
                        name="manager"
                        value={siteFormData.manager}
                        onChange={handleSiteFormChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="sitePhone" className="form-label">Telefon *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="sitePhone"
                        name="phone"
                        value={siteFormData.phone}
                        onChange={handleSiteFormChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="siteBlocks" className="form-label">Blok Sayısı</label>
                      <input
                        type="number"
                        className="form-control"
                        id="siteBlocks"
                        name="blocks"
                        value={siteFormData.blocks}
                        onChange={handleSiteFormChange}
                        min="0"
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="siteElevatorsPerBlock" className="form-label">Blok Başına Asansör Sayısı</label>
                      <input
                        type="number"
                        className="form-control"
                        id="siteElevatorsPerBlock"
                        name="elevatorsPerBlock"
                        value={siteFormData.elevatorsPerBlock}
                        onChange={handleSiteFormChange}
                        min="0"
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="siteApartmentCount" className="form-label">Daire Sayısı</label>
                      <input
                        type="number"
                        className="form-control"
                        id="siteApartmentCount"
                        name="apartmentCount"
                        value={siteFormData.apartmentCount}
                        onChange={handleSiteFormChange}
                        min="0"
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="siteBankAccountName" className="form-label">Banka Hesap Adı</label>
                      <input
                        type="text"
                        className="form-control"
                        id="siteBankAccountName"
                        name="bankAccountName"
                        value={siteFormData.bankAccountName}
                        onChange={handleSiteFormChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="siteIban" className="form-label">IBAN Numarası</label>
                      <input
                        type="text"
                        className="form-control"
                        id="siteIban"
                        name="iban"
                        value={siteFormData.iban}
                        onChange={handleSiteFormChange}
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                      />
                    </div>
                    <div className="col-md-12">
                      <label htmlFor="siteNotes" className="form-label">Notlar</label>
                      <textarea
                        className="form-control"
                        id="siteNotes"
                        name="notes"
                        value={siteFormData.notes}
                        onChange={handleSiteFormChange}
                        rows="3"
                      />
                    </div>
                  </div>
                  <div className="d-flex justify-content-end gap-2 mt-3">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditSiteModal(false)}>
                      İptal
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Kaydet
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteDashboard;