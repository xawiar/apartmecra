// src/services/firebaseStorage.js
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll,
  getMetadata
} from 'firebase/storage';
import { doc, addDoc, collection, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { storage, db } from '../config/firebase.js';

// Storage paths
const STORAGE_PATHS = {
  PANEL_IMAGES: 'panel-images',
  COMPANY_LOGO: 'company-logos',
  SITE_IMAGES: 'site-images',
  AGREEMENT_DOCS: 'agreement-documents'
};

// Panel Image Functions
export const uploadPanelImage = async (file, metadata) => {
  try {
    const { agreementId, siteId, blockId, panelId, companyId } = metadata;
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const fileExtension = file.name.split('.').pop();
    const filename = `panel-${agreementId}-${siteId}-${blockId}-${panelId}-${timestamp}-${randomSuffix}.${fileExtension}`;
    
    // Create storage reference
    const storageRef = ref(storage, `${STORAGE_PATHS.PANEL_IMAGES}/${filename}`);
    
    // Upload file
    const uploadResult = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    // Create metadata object
    const imageInfo = {
      filename: filename,
      originalName: file.name,
      size: file.size,
      url: downloadURL,
      agreementId: agreementId,
      siteId: siteId,
      blockId: blockId,
      panelId: panelId,
      companyId: companyId,
      uploadedAt: new Date().toISOString(),
      storagePath: uploadResult.ref.fullPath
    };
    
    // Save metadata to Firestore
    const docRef = await addDoc(collection(db, 'panelImages'), imageInfo);
    
    return {
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: downloadURL,
      imageInfo: {
        id: docRef.id,
        ...imageInfo
      }
    };
  } catch (error) {
    console.error('Error uploading panel image:', error);
    return {
      success: false,
      error: 'Failed to upload image: ' + error.message
    };
  }
};

export const getPanelImages = async (filters = {}) => {
  try {
    let q = collection(db, 'panelImages');
    
    // Apply filters
    if (filters.agreementId) {
      q = query(q, where('agreementId', '==', filters.agreementId));
    }
    if (filters.siteId) {
      q = query(q, where('siteId', '==', filters.siteId));
    }
    if (filters.companyId) {
      q = query(q, where('companyId', '==', filters.companyId));
    }
    
    const querySnapshot = await getDocs(q);
    const images = [];
    
    querySnapshot.forEach((doc) => {
      images.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      data: images
    };
  } catch (error) {
    console.error('Error fetching panel images:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

export const deletePanelImage = async (imageId) => {
  try {
    // Get image metadata from Firestore
    const imageDoc = await getDocs(query(collection(db, 'panelImages'), where('__name__', '==', imageId)));
    
    if (imageDoc.empty) {
      return {
        success: false,
        error: 'Image not found'
      };
    }
    
    const imageData = imageDoc.docs[0].data();
    
    // Delete from Firebase Storage
    const storageRef = ref(storage, imageData.storagePath);
    await deleteObject(storageRef);
    
    // Delete from Firestore
    await deleteDoc(doc(db, 'panelImages', imageId));
    
    return {
      success: true,
      message: 'Image deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting panel image:', error);
    return {
      success: false,
      error: 'Failed to delete image: ' + error.message
    };
  }
};

export const cleanupExpiredImages = async () => {
  try {
    const { getAgreements } = await import('./firebaseDb');
    
    // Get all agreements to check expiration
    const agreements = await getAgreements();
    const currentDate = new Date();
    
    // Find expired agreements
    const expiredAgreements = agreements.filter(agreement => {
      if (!agreement.endDate) return false;
      return new Date(agreement.endDate) < currentDate;
    });
    
    const expiredAgreementIds = expiredAgreements.map(ag => ag.id);
    
    // Get all panel images
    const imagesResult = await getPanelImages();
    if (!imagesResult.success) {
      return {
        success: false,
        error: 'Failed to fetch images'
      };
    }
    
    const images = imagesResult.data;
    let deletedCount = 0;
    
    // Delete images from expired agreements
    for (const image of images) {
      if (expiredAgreementIds.includes(image.agreementId)) {
        const deleteResult = await deletePanelImage(image.id);
        if (deleteResult.success) {
          deletedCount++;
        }
      }
    }
    
    return {
      success: true,
      message: `Cleanup completed. Deleted ${deletedCount} expired images.`,
      deletedCount
    };
  } catch (error) {
    console.error('Error cleaning up expired images:', error);
    return {
      success: false,
      error: 'Failed to cleanup expired images: ' + error.message
    };
  }
};

// Company Logo Functions
export const uploadCompanyLogo = async (file, companyId) => {
  try {
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `logo-${companyId}-${timestamp}.${fileExtension}`;
    
    const storageRef = ref(storage, `${STORAGE_PATHS.COMPANY_LOGO}/${filename}`);
    const uploadResult = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    return {
      success: true,
      url: downloadURL,
      filename: filename
    };
  } catch (error) {
    console.error('Error uploading company logo:', error);
    return {
      success: false,
      error: 'Failed to upload logo: ' + error.message
    };
  }
};

// Site Image Functions
export const uploadSiteImage = async (file, siteId) => {
  try {
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `site-${siteId}-${timestamp}.${fileExtension}`;
    
    const storageRef = ref(storage, `${STORAGE_PATHS.SITE_IMAGES}/${filename}`);
    const uploadResult = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    return {
      success: true,
      url: downloadURL,
      filename: filename
    };
  } catch (error) {
    console.error('Error uploading site image:', error);
    return {
      success: false,
      error: 'Failed to upload site image: ' + error.message
    };
  }
};

// Agreement Document Functions
export const uploadAgreementDocument = async (file, agreementId) => {
  try {
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `agreement-${agreementId}-${timestamp}.${fileExtension}`;
    
    const storageRef = ref(storage, `${STORAGE_PATHS.AGREEMENT_DOCS}/${filename}`);
    const uploadResult = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    // Save document info to Firestore
    const docInfo = {
      filename: filename,
      originalName: file.name,
      size: file.size,
      url: downloadURL,
      agreementId: agreementId,
      uploadedAt: new Date().toISOString(),
      storagePath: uploadResult.ref.fullPath
    };
    
    const docRef = await addDoc(collection(db, 'agreementDocuments'), docInfo);
    
    return {
      success: true,
      url: downloadURL,
      filename: filename,
      documentId: docRef.id
    };
  } catch (error) {
    console.error('Error uploading agreement document:', error);
    return {
      success: false,
      error: 'Failed to upload document: ' + error.message
    };
  }
};

// Generic file upload function
export const uploadFile = async (file, path, metadata = {}) => {
  try {
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const fileExtension = file.name.split('.').pop();
    const filename = `${timestamp}-${randomSuffix}.${fileExtension}`;
    
    const storageRef = ref(storage, `${path}/${filename}`);
    const uploadResult = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    return {
      success: true,
      url: downloadURL,
      filename: filename,
      path: uploadResult.ref.fullPath,
      size: file.size,
      metadata: metadata
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: 'Failed to upload file: ' + error.message
    };
  }
};

// Generic file delete function
export const deleteFile = async (filePath) => {
  try {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
    
    return {
      success: true,
      message: 'File deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting file:', error);
    return {
      success: false,
      error: 'Failed to delete file: ' + error.message
    };
  }
};

// List files in a directory
export const listFiles = async (path) => {
  try {
    const listRef = ref(storage, path);
    const result = await listAll(listRef);
    
    const files = [];
    
    // Get file metadata for each file
    for (const itemRef of result.items) {
      try {
        const metadata = await getMetadata(itemRef);
        const downloadURL = await getDownloadURL(itemRef);
        
        files.push({
          name: itemRef.name,
          fullPath: itemRef.fullPath,
          size: metadata.size,
          contentType: metadata.contentType,
          timeCreated: metadata.timeCreated,
          updated: metadata.updated,
          url: downloadURL
        });
      } catch (error) {
        console.warn('Error getting metadata for file:', itemRef.name, error);
      }
    }
    
    return {
      success: true,
      files: files
    };
  } catch (error) {
    console.error('Error listing files:', error);
    return {
      success: false,
      error: error.message,
      files: []
    };
  }
};

// Get file metadata
export const getFileMetadata = async (filePath) => {
  try {
    const storageRef = ref(storage, filePath);
    const metadata = await getMetadata(storageRef);
    const downloadURL = await getDownloadURL(storageRef);
    
    return {
      success: true,
      metadata: {
        name: metadata.name,
        size: metadata.size,
        contentType: metadata.contentType,
        timeCreated: metadata.timeCreated,
        updated: metadata.updated,
        url: downloadURL
      }
    };
  } catch (error) {
    console.error('Error getting file metadata:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
