import React from 'react';

const DocumentUploadForm = ({ 
  uploadForm, 
  handleUploadFormChange, 
  handleFileChange, 
  handleUploadDocument, 
  closeUploadModal, 
  uploading,
  fileInputRef
}) => {
  return (
    <form onSubmit={handleUploadDocument}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Belge Adı
        </label>
        <input
          type="text"
          name="name"
          value={uploadForm.name}
          onChange={handleUploadFormChange}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          required
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Açıklama
        </label>
        <textarea
          name="description"
          value={uploadForm.description}
          onChange={handleUploadFormChange}
          rows="3"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dosya
        </label>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          Tüm dosya türlerini yükleyebilirsiniz (Maksimum 5MB)
        </p>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={closeUploadModal}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={uploading}
          className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
            uploading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {uploading ? 'Yükleniyor...' : 'Yükle'}
        </button>
      </div>
    </form>
  );
};

export default DocumentUploadForm;