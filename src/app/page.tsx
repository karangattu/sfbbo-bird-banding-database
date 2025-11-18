"use client";

import React, { useState, useEffect } from "react";
import { PhotoCard } from "@/components/PhotoCard";
import { SearchFilter } from "@/components/SearchFilter";
import { TagForm } from "@/components/TagForm";
import PhotoUpload from "@/components/PhotoUpload";
import { usePhotoStore } from "@/store/photoStore";
import { Photo, FilterCriteria, PhotoTag } from "@/types";
import { Folder } from "lucide-react";

export default function Home() {
  const {
    photos,
    filteredPhotos,
    selectedPhoto,
    filters,
    currentFolderId,
    breadcrumbs,
    selectPhoto,
    setFilters,
    clearFilters,
    applyFilters,
    setPhotos,
    loadPhotoTags,
    setCurrentFolderId,
    setBreadcrumbs,
    searchPhotos,
  } = usePhotoStore();

  const [showTagForm, setShowTagForm] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const googleDriveFolderId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID;

  useEffect(() => {
    setHydrated(true);
  }, []);

  const loadPhotosFromGoogle = async (folderId: string) => {
    if (!folderId.trim()) {
      setLoadError(
        "Google Drive folder ID not configured. Please add GOOGLE_DRIVE_FOLDER_ID to your .env.local file."
      );
      setIsLoadingPhotos(false);
      return;
    }

    setIsLoadingPhotos(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/photos/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });

      if (!response.ok) {
        throw new Error("Failed to load photos");
      }

      const data = await response.json();
      console.log("Loaded photos:", data);

      if (data.photos && Array.isArray(data.photos)) {
        const formattedPhotos: Photo[] = await Promise.all(
          data.photos.map(async (photo: any) => {
            // Only load tags for images
            let tags: PhotoTag[] = [];
            if (photo.mimeType && photo.mimeType.includes("image/")) {
              tags = await loadPhotoTags(photo.id);
            }
            return {
              id: photo.id,
              googleDriveId: photo.id,
              name: photo.name,
              mimeType: photo.mimeType,
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
      console.error("Error loading photos:", error);
      setLoadError(
        "Failed to load photos. Check your configuration and credentials."
      );
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (googleDriveFolderId && !currentFolderId) {
      setCurrentFolderId(googleDriveFolderId);
      setBreadcrumbs([{ id: googleDriveFolderId, name: "Home" }]);
      loadPhotosFromGoogle(googleDriveFolderId);
    } else if (!googleDriveFolderId) {
      setLoadError(
        "Google Drive folder ID not configured. Please add GOOGLE_DRIVE_FOLDER_ID to your .env.local file."
      );
      setIsLoadingPhotos(false);
    }
  }, []);

  const handleFolderClick = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    const newBreadcrumbs = [...breadcrumbs, { id: folderId, name: folderName }];
    setBreadcrumbs(newBreadcrumbs);
    loadPhotosFromGoogle(folderId);
    selectPhoto(null); // Deselect photo when changing folder
  };

  const handleBreadcrumbClick = (index: number) => {
    const targetBreadcrumb = breadcrumbs[index];
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    setCurrentFolderId(targetBreadcrumb.id);
    loadPhotosFromGoogle(targetBreadcrumb.id);
    selectPhoto(null);
  };

  const handleFilterChange = async (newFilters: FilterCriteria) => {
    setFilters(newFilters);
    setIsLoadingPhotos(true);
    await searchPhotos(newFilters);
    setIsLoadingPhotos(false);
  };

  const handleClearFilters = async () => {
    clearFilters();
    setIsLoadingPhotos(true);
    await searchPhotos({});
    setIsLoadingPhotos(false);
  };

  const handleAddTag = () => {
    setEditingTagId(null);
    setShowTagForm(true);
  };

  const handleEditTag = (tagId: string) => {
    setEditingTagId(tagId);
    setShowTagForm(true);
  };

  const handleDeleteTag = async (tagId: string) => {
    if (selectedPhoto) {
      await usePhotoStore.getState().deleteTag(selectedPhoto.id, tagId);
      // Re-sync
      const updatedPhotos = usePhotoStore.getState().photos;
      const updatedPhoto = updatedPhotos.find((p) => p.id === selectedPhoto.id);
      if (updatedPhoto) {
        selectPhoto(updatedPhoto);
      }
    }
  };

  const handleDeletePhoto = async () => {
    if (!selectedPhoto) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${selectedPhoto.name}"?`
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch("/api/photos/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: selectedPhoto.id }),
      });

      if (!response.ok) throw new Error("Failed to delete photo");

      alert("Photo deleted successfully!");
      selectPhoto(null);
      if (currentFolderId) loadPhotosFromGoogle(currentFolderId);
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Failed to delete photo");
    }
  };

  const displayItems = Object.keys(filters).some(
    (key) => filters[key as keyof FilterCriteria]
  )
    ? filteredPhotos
    : photos;

  const folders = displayItems.filter(
    (item) => item.mimeType === "application/vnd.google-apps.folder"
  );
  const images = displayItems.filter(
    (item) => item.mimeType && item.mimeType.includes("image/")
  );

  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/SFBBO_Logo_Rounded.png"
              alt="SFBBO Logo"
              className="h-10 w-10 object-contain rounded-full"
            />
            <h1 className="text-xl font-bold text-gray-900">
              CCFS Bird Photo Tagger
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {currentFolderId && (
              <PhotoUpload
                folderId={currentFolderId}
                onUploadSuccess={() => {
                  alert("Photo uploaded successfully!");
                  loadPhotosFromGoogle(currentFolderId);
                }}
                onUploadError={(error) => alert(`Upload failed: ${error}`)}
              />
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center text-sm text-gray-600 overflow-x-auto">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.id}>
              {index > 0 && <span className="mx-2 text-gray-400">/</span>}
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className={`hover:text-blue-600 whitespace-nowrap ${
                  index === breadcrumbs.length - 1
                    ? "font-semibold text-gray-900"
                    : ""
                }`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex gap-6">
        {/* Main Content (Folders & Photos) */}
        <div className={`flex-1 ${selectedPhoto ? "hidden lg:block" : ""}`}>
          {/* Search */}
          <div className="mb-6">
            <SearchFilter
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          </div>

          {isLoadingPhotos ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : loadError ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              {loadError}
            </div>
          ) : (
            <div className="space-y-8">
              {/* Folders */}
              {folders.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Folders
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() =>
                          handleFolderClick(folder.id, folder.name)
                        }
                        className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group"
                      >
                        <div className="mb-2 group-hover:scale-110 transition-transform text-blue-500">
                          <Folder
                            size={48}
                            fill="currentColor"
                            className="text-blue-100"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 text-center truncate w-full">
                          {folder.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos */}
              {images.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Photos
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((photo) => (
                      <div key={photo.id} className="relative group">
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

              {folders.length === 0 && images.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  This folder is empty.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar (Selected Photo Details) */}
        {selectedPhoto && (
          <div className="w-full lg:w-96 bg-white border-l border-gray-200 shadow-xl fixed inset-y-0 right-0 lg:static lg:h-auto lg:shadow-none lg:border lg:rounded-lg overflow-y-auto z-50">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center lg:hidden">
              <h3 className="font-semibold">Photo Details</h3>
              <button
                onClick={() => selectPhoto(null)}
                className="text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                <img
                  src={selectedPhoto.imageUrl}
                  alt={selectedPhoto.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-1">
                  {selectedPhoto.name}
                </h3>
                <a
                  href={selectedPhoto.webViewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  View in Drive
                </a>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">Tags</h4>
                  <button
                    onClick={handleAddTag}
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    + Add Tag
                  </button>
                </div>

                {selectedPhoto.tags && selectedPhoto.tags.length > 0 ? (
                  <div className="space-y-3">
                    {selectedPhoto.tags.map((tag) => (
                      <div
                        key={tag.id}
                        className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm"
                      >
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">{tag.species}</span>
                          <span className="text-gray-500">
                            {tag.bandNumber}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          {tag.date} • {tag.location}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditTag(tag.id)}
                            className="text-blue-600 hover:underline text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTag(tag.id)}
                            className="text-red-600 hover:underline text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No tags yet.
                  </p>
                )}

                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={handleDeletePhoto}
                    className="w-full py-2 text-red-600 border border-red-200 rounded hover:bg-red-50 text-sm"
                  >
                    Delete Photo
                  </button>
                </div>
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
          onClose={() => {
            setShowTagForm(false);
            // Re-sync selectedPhoto with the updated photo from the store
            const updatedPhotos = usePhotoStore.getState().photos;
            const updatedPhoto = updatedPhotos.find(
              (p) => p.id === selectedPhoto.id
            );
            if (updatedPhoto) {
              selectPhoto(updatedPhoto);
            }
          }}
        />
      )}
    </div>
  );
}
