'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

  const { totalTags, taggedPhotosCount, uniqueSpeciesCount } = useMemo(() => {
    let tagTotal = 0;
    let taggedPhotoTotal = 0;
    const speciesSet = new Set<string>();

    photos.forEach((photo) => {
      const tagCount = photo.tags?.length ?? 0;
      tagTotal += tagCount;
      if (tagCount > 0) {
        taggedPhotoTotal += 1;
      }
      photo.tags?.forEach((tag) => {
        const species = tag.species?.trim();
        if (species) {
          speciesSet.add(species.toLowerCase());
        }
      });
    });

    return {
      totalTags: tagTotal,
      taggedPhotosCount: taggedPhotoTotal,
      uniqueSpeciesCount: speciesSet.size,
    };
  }, [photos]);

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

  const handleDeletePhoto = async () => {
    if (!selectedPhoto) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${selectedPhoto.name}" from Google Drive? This action cannot be undone and will also delete all associated tags.`
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch('/api/photos/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: selectedPhoto.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete photo');
      }

      alert('Photo deleted successfully!');
      selectPhoto(null);
      handleRefreshPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert(`Failed to delete photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🚨</div>
                <div className="flex-1">
                  <p className="font-semibold text-amber-900 mb-2">Configuration Needed</p>
                  <p className="text-amber-800 text-sm mb-4">
                    {loadError.includes('not configured') 
                      ? 'Your app needs to be configured to connect to Google Drive.'
                      : 'We encountered an issue connecting to your Google Drive.'}
                  </p>
                  <div className="bg-white bg-opacity-50 rounded p-3 text-sm text-amber-900">
                    <p className="font-medium mb-2">📋 Quick Setup:</p>
                    <ol className="space-y-1 ml-4 list-decimal text-amber-800">
                      <li>Set your Google Drive folder ID in the environment</li>
                      <li>Ensure your service account credentials are configured</li>
                      <li>Restart the app</li>
                    </ol>
                  </div>
                  <p className="text-xs text-amber-700 mt-3">See deployment documentation for detailed setup steps.</p>
                </div>
              </div>
            </div>
          ) : isLoadingPhotos ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-4">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600 font-medium">Loading your photos...</p>
              <p className="text-gray-500 text-sm mt-1">Connecting to Google Drive</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-green-700">
                    <span className="text-lg">🟢</span>
                    Connected to Google Drive
                  </p>
                  <p className="text-gray-600 text-sm md:text-base">
                    Loaded {photos.length} photo{photos.length !== 1 ? 's' : ''}.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleRefreshPhotos}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    🔄 Refresh Gallery
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-green-100 bg-green-50 p-4">
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Photos Synced</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">{photos.length}</p>
                  <p className="text-xs text-green-700 mt-2">Total photos currently available</p>
                </div>
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Tagged Photos</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{taggedPhotosCount}</p>
                  <p className="text-xs text-blue-700 mt-2">Photo{taggedPhotosCount === 1 ? '' : 's'} with saved metadata</p>
                </div>
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Species Catalogued</p>
                  <p className="text-2xl font-bold text-amber-900 mt-1">{uniqueSpeciesCount}</p>
                  <p className="text-xs text-amber-700 mt-2">{totalTags} total tag{totalTags === 1 ? '' : 's'} saved</p>
                </div>
              </div>

              {googleDriveFolderId && (
                <div>
                  <div className="flex gap-2 flex-wrap">
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
          <div className="bg-gradient-to-br from-sky-50 to-indigo-50 border border-blue-100 rounded-2xl p-12 text-center flex flex-col items-center gap-6">
            <div className="text-5xl">🪶</div>
            <div className="space-y-2 max-w-xl">
              <h3 className="text-2xl font-semibold text-gray-900">Your gallery is ready for its first photo</h3>
              <p className="text-gray-600">
                Upload a photo from your bird banding session to start tagging and building your searchable archive.
              </p>
            </div>

            {googleDriveFolderId ? (
              <div className="flex flex-col items-center gap-2">
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
                <p className="text-xs text-gray-500">Uploads are saved to Google Drive and tagged instantly.</p>
              </div>
            ) : (
              <div className="bg-white border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-semibold mb-2">Quick setup checklist</p>
                <ol className="text-left space-y-1 list-decimal list-inside">
                  <li>Set your Google Drive folder ID in <code className="bg-blue-100 px-1 rounded text-xs">.env.local</code></li>
                  <li>Restart the app</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            )}

            <p className="text-xs text-gray-500">Need help? Check the deployment guide for step-by-step configuration.</p>
          </div>
        ) : photos.length === 0 && loadError ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">See the configuration section above for setup instructions.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Photo Details and Preview - Top section */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                {/* Photo Preview and Info */}
                <div className="flex flex-col">
                  <div className="flex-shrink-0 bg-gray-900 rounded-lg flex items-center justify-center mb-4" style={{ height: '350px' }}>
                    {selectedPhoto?.imageUrl ? (
                      <img
                        src={selectedPhoto.imageUrl}
                        alt={selectedPhoto.name}
                        className="max-w-full max-h-full object-contain rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <p className="text-gray-400 text-lg">Select a photo to preview</p>
                      </div>
                    )}
                  </div>
                  
                  {selectedPhoto && (
                    <div className="bg-gray-50 p-4 rounded">
                      <h3 className="font-semibold text-gray-900 truncate mb-2">{selectedPhoto.name}</h3>
                      <a
                        href={selectedPhoto.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View in Google Drive →
                      </a>
                    </div>
                  )}
                </div>

                {/* Quick Tags Summary */}
                <div className="flex flex-col">
                  {selectedPhoto ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Tags ({selectedPhoto.tags?.length || 0})</h3>
                        <button
                          onClick={handleAddTag}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                        >
                          + Add Tag
                        </button>
                      </div>

                      {selectedPhoto.tags && selectedPhoto.tags.length > 0 ? (
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {selectedPhoto.tags.map((tag) => (
                            <div key={tag.id} className="border border-gray-200 rounded-lg p-3 bg-white text-sm">
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                  <p className="text-xs text-gray-500 font-semibold">Species</p>
                                  <p className="font-medium">{tag.species}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-semibold">Band #</p>
                                  <p className="font-medium">{tag.bandNumber}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                                <div>{tag.age} / {tag.sex}</div>
                                <div>{tag.date}</div>
                              </div>
                              {tag.location && <p className="text-xs text-gray-600 mb-2">📍 {tag.location}</p>}
                              
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => handleEditTag(tag.id)}
                                  className="flex-1 text-xs px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTag(tag.id)}
                                  className="flex-1 text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm text-center py-4">No tags yet</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <p className="text-center">Select a photo to view and edit its tags</p>
                    </div>
                  )}

                  {selectedPhoto && (
                    <button
                      onClick={handleDeletePhoto}
                      className="mt-4 w-full px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition flex items-center justify-center gap-1"
                      title="Delete this photo and all associated tags from Google Drive"
                    >
                      🗑️ Delete Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Photo Gallery - Bottom section */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Gallery
                </h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {displayPhotos.length} photo{displayPhotos.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {displayPhotos.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-gray-500 text-center">No photos match your filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="flex gap-3 pb-2">
                    {displayPhotos.map((photo) => (
                      <div key={photo.id} className="flex-shrink-0" style={{ width: '120px' }}>
                        <PhotoCard
                          photo={photo}
                          onSelect={() => selectPhoto(photo)}
                          isSelected={selectedPhoto?.id === photo.id}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
