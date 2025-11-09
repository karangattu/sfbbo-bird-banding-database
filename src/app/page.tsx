'use client';

import React, { useState, useEffect } from 'react';
import { PhotoCard } from '@/components/PhotoCard';
import { PhotoDetail } from '@/components/PhotoDetail';
import { SearchFilter } from '@/components/SearchFilter';
import { TagForm } from '@/components/TagForm';
import PhotoUpload from '@/components/PhotoUpload';
import { usePhotoStore } from '@/store/photoStore';
import { Photo, PhotoTag, FilterCriteria } from '@/types';

export default function Home() {
  const {
    photos,
    filteredPhotos,
    selectedPhoto,
    filters,
    selectPhoto,
    setFilters,
    clearFilters,
    applyFilters,
    deleteTag,
    setPhotos,
    loadPhotoTags,
  } = usePhotoStore();

  const [showTagForm, setShowTagForm] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const googleDriveFolderId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID;

  // Fix hydration mismatch
  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleFilterChange = (newFilters: FilterCriteria) => {
    setFilters(newFilters);
    applyFilters();
  };

  const handleClearFilters = () => {
    clearFilters();
    applyFilters();
  };

  const handleAddTag = () => {
    setEditingTagId(null);
    setShowTagForm(true);
  };

  const handleEditTag = (tagId: string) => {
    setEditingTagId(tagId);
    setShowTagForm(true);
  };

  const handleDeleteTag = (tagId: string) => {
    if (selectedPhoto) {
      deleteTag(selectedPhoto.id, tagId);
    }
  };

  const loadPhotosFromGoogle = async (folderId: string) => {
    if (!folderId.trim()) {
      setLoadError('Google Drive folder ID not configured. Please add GOOGLE_DRIVE_FOLDER_ID to your .env.local file.');
      setIsLoadingPhotos(false);
      return;
    }

    setIsLoadingPhotos(true);
    setLoadError(null);
    try {
      const response = await fetch('/api/photos/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
      });

      if (!response.ok) {
        throw new Error('Failed to load photos');
      }

      const data = await response.json();
      console.log('Loaded photos:', data);

      if (data.photos && Array.isArray(data.photos)) {
        const formattedPhotos: Photo[] = await Promise.all(
          data.photos.map(async (photo: any) => {
            const tags = await loadPhotoTags(photo.id);
            return {
              id: photo.id,
              googleDriveId: photo.id,
              name: photo.name,
              imageUrl: photo.imageUrl,
              webViewLink: photo.webViewLink,
              createdTime: photo.createdTime,
              modifiedTime: photo.modifiedTime,
              tags: tags || [],
              createdAt: photo.createdTime || new Date().toISOString(),
            };
          })
        );

        setPhotos(formattedPhotos);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
      setLoadError('Failed to load photos. Check your configuration and credentials.');
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  // Auto-load photos on component mount
  useEffect(() => {
    if (googleDriveFolderId) {
      loadPhotosFromGoogle(googleDriveFolderId);
    } else {
      setLoadError('Google Drive folder ID not configured. Please add GOOGLE_DRIVE_FOLDER_ID to your .env.local file.');
      setIsLoadingPhotos(false);
    }
  }, []);

  const handleRefreshPhotos = () => {
    if (googleDriveFolderId) {
      loadPhotosFromGoogle(googleDriveFolderId);
    }
  };

  const displayPhotos = Object.keys(filters).some((key) => filters[key as keyof FilterCriteria])
    ? filteredPhotos
    : photos;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTiobb2xOyQrc_sA_qErPkHnfX7vVHmkOjTQT3slcnVFuORzlE5Kmjw8rW6g4gRBtpqxPM&usqp=CAU"
              alt="CCFS Logo"
              className="h-10 w-10 object-contain"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CCFS Bird Tagger</h1>
              <p className="text-gray-600 text-sm mt-1">Tag and search bird banding photos with multiple filters</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Google Drive Status */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📁 Google Drive Photos</h2>
          
          {loadError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              <p className="font-semibold mb-2">⚠️ Configuration Issue</p>
              <p className="text-sm mb-3">{loadError}</p>
              <details className="text-sm">
                <summary className="cursor-pointer font-medium">How to fix:</summary>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-red-700">
                  <li>Edit your <code className="bg-red-100 px-1 rounded">.env.local</code> file</li>
                  <li>Add: <code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID=your_folder_id</code></li>
                  <li>Restart the development server</li>
                  <li>Reload this page</li>
                </ol>
              </details>
            </div>
          ) : isLoadingPhotos ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin">⟳</div>
              <p className="text-gray-600">Loading photos from Google Drive...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  <span className="font-semibold text-green-600">✓</span> Connected and loaded {photos.length} photo{photos.length !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleRefreshPhotos}
                    className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>
              {googleDriveFolderId && (
                <div className="flex gap-2 flex-wrap mt-2">
                  <PhotoUpload
                    folderId={googleDriveFolderId}
                    onUploadSuccess={() => {
                      alert('Photo uploaded successfully!');
                      handleRefreshPhotos();
                    }}
                    onUploadError={(error) => {
                      alert(`Upload failed: ${error}`);
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search and Filter */}
        {photos.length > 0 && (
          <SearchFilter
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        )}

        {/* Main Content Area */}
        {photos.length === 0 && !loadError ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">
              No photos loaded yet. Photos will appear here automatically once configured.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 inline-block">
              <p className="font-semibold mb-2">Setup Instructions:</p>
              <ol className="text-left space-y-1 list-decimal list-inside">
                <li>Edit your <code className="bg-blue-100 px-1 rounded text-xs">.env.local</code> file</li>
                <li>Add your Google Drive folder ID: <code className="bg-blue-100 px-1 rounded text-xs">NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID=your_id</code></li>
                <li>Restart the development server</li>
                <li>Reload this page</li>
              </ol>
            </div>
          </div>
        ) : photos.length === 0 && loadError ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">See the configuration section above for setup instructions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Photo Gallery */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Photos ({displayPhotos.length})
                </h2>
                <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {displayPhotos.map((photo) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      onSelect={() => selectPhoto(photo)}
                      isSelected={selectedPhoto?.id === photo.id}
                    />
                  ))}
                </div>
                {displayPhotos.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No photos match your filters</p>
                )}
              </div>
            </div>

            {/* Photo Details and Tags */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow overflow-hidden" style={{ height: '600px' }}>
                <PhotoDetail
                  photo={selectedPhoto}
                  onAddTag={handleAddTag}
                  onEditTag={handleEditTag}
                  onDeleteTag={handleDeleteTag}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tag Form Modal */}
      {showTagForm && selectedPhoto && (
        <TagForm
          photoId={selectedPhoto.id}
          existingTag={
            editingTagId
              ? selectedPhoto.tags.find((t) => t.id === editingTagId)
              : undefined
          }
          onClose={() => setShowTagForm(false)}
        />
      )}
    </div>
  );
}
