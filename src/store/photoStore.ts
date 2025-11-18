import { create } from "zustand";
import { Photo, PhotoTag, FilterCriteria } from "@/types";

export interface Breadcrumb {
  id: string;
  name: string;
}

interface PhotoStore {
  photos: Photo[];
  filteredPhotos: Photo[];
  filters: FilterCriteria;
  selectedPhoto: Photo | null;
  currentFolderId: string | null;
  breadcrumbs: Breadcrumb[];

  setPhotos: (photos: Photo[]) => void;
  addPhoto: (photo: Photo) => void;
  updatePhoto: (id: string, photo: Photo) => void;
  deletePhoto: (id: string) => void;

  setFilters: (filters: FilterCriteria) => void;
  clearFilters: () => void;
  applyFilters: () => void;

  selectPhoto: (photo: Photo | null) => void;
  setCurrentFolderId: (id: string | null) => void;
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void;

  addTag: (photoId: string, tag: PhotoTag) => Promise<void>;
  updateTag: (photoId: string, tagId: string, tag: PhotoTag) => Promise<void>;
  deleteTag: (photoId: string, tagId: string) => Promise<void>;
  loadPhotoTags: (photoId: string) => Promise<PhotoTag[]>;
  searchPhotos: (criteria: FilterCriteria) => Promise<void>;
}

export const usePhotoStore = create<PhotoStore>((set, get) => ({
  photos: [],
  filteredPhotos: [],
  filters: {},
  selectedPhoto: null,
  currentFolderId: null,
  breadcrumbs: [],

  setPhotos: (photos) => set({ photos, filteredPhotos: photos }),
  setCurrentFolderId: (id) => set({ currentFolderId: id }),
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),

  addPhoto: (photo) =>
    set((state) => {
      const newPhotos = [...state.photos, photo];
      return {
        photos: newPhotos,
        filteredPhotos: newPhotos,
      };
    }),

  updatePhoto: (id, photo) =>
    set((state) => {
      const newPhotos = state.photos.map((p) => (p.id === id ? photo : p));
      return {
        photos: newPhotos,
        filteredPhotos: newPhotos,
      };
    }),

  deletePhoto: (id) =>
    set((state) => {
      const newPhotos = state.photos.filter((p) => p.id !== id);
      return {
        photos: newPhotos,
        filteredPhotos: newPhotos,
        selectedPhoto:
          state.selectedPhoto?.id === id ? null : state.selectedPhoto,
      };
    }),

  setFilters: (filters) => set({ filters }),

  clearFilters: () =>
    set((state) => ({ filters: {}, filteredPhotos: state.photos })),

  applyFilters: () => {
    // Deprecated: use searchPhotos instead for global search
    const { photos, filters } = get();
    if (!filters || Object.keys(filters).length === 0) {
      set({ filteredPhotos: photos });
      return;
    }
  },

  searchPhotos: async (criteria: FilterCriteria) => {
    try {
      // If no criteria, reset to showing current folder photos
      if (
        Object.keys(criteria).length === 0 ||
        Object.values(criteria).every((v) => !v)
      ) {
        set((state) => ({ filteredPhotos: state.photos }));
        return;
      }

      const response = await fetch("/api/photos/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(criteria),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      set({ filteredPhotos: data.photos || [] });
    } catch (error) {
      console.error("Error searching photos:", error);
      set({ filteredPhotos: [] });
    }
  },

  selectPhoto: (photo) => set({ selectedPhoto: photo }),

  addTag: async (photoId, tag) => {
    try {
      console.log("Store addTag called with:", { photoId, tag });
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, tag }),
      });

      console.log("API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error response:", errorData);
        throw new Error(errorData.error || "Failed to add tag");
      }

      const data = await response.json();
      const tagId = data.tagId;

      set((state) => {
        const newPhotos = state.photos.map((p) => {
          if (p.id === photoId) {
            return {
              ...p,
              tags: [...p.tags, { ...tag, id: tagId }],
            };
          }
          return p;
        });
        return { photos: newPhotos };
      });
    } catch (error) {
      console.error("Error adding tag:", error);
      set((state) => {
        const newPhotos = state.photos.map((p) => {
          if (p.id === photoId) {
            return {
              ...p,
              tags: [...p.tags, { ...tag, id: Math.random().toString() }],
            };
          }
          return p;
        });
        return { photos: newPhotos };
      });
    }
  },

  updateTag: async (photoId, tagId, tag) => {
    try {
      const response = await fetch("/api/tags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId, tag }),
      });

      if (!response.ok) {
        throw new Error("Failed to update tag");
      }

      set((state) => {
        const newPhotos = state.photos.map((p) => {
          if (p.id === photoId) {
            return {
              ...p,
              tags: p.tags.map((t) =>
                t.id === tagId ? { ...t, ...tag, id: tagId } : t
              ),
            };
          }
          return p;
        });

        return { photos: newPhotos };
      });
    } catch (error) {
      console.error("Error updating tag:", error);
      set((state) => {
        const newPhotos = state.photos.map((p) => {
          if (p.id === photoId) {
            return {
              ...p,
              tags: p.tags.map((t) => (t.id === tagId ? { ...t, ...tag } : t)),
            };
          }
          return p;
        });
        return { photos: newPhotos };
      });
    }
  },

  deleteTag: async (photoId, tagId) => {
    try {
      const response = await fetch(`/api/tags?tagId=${tagId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete tag");
      }

      set((state) => {
        const newPhotos = state.photos.map((p) => {
          if (p.id === photoId) {
            return {
              ...p,
              tags: p.tags.filter((t) => t.id !== tagId),
            };
          }
          return p;
        });

        return { photos: newPhotos };
      });
    } catch (error) {
      console.error("Error deleting tag:", error);
      set((state) => {
        const newPhotos = state.photos.map((p) => {
          if (p.id === photoId) {
            return {
              ...p,
              tags: p.tags.filter((t) => t.id !== tagId),
            };
          }
          return p;
        });
        return { photos: newPhotos };
      });
    }
  },

  loadPhotoTags: async (photoId) => {
    try {
      const response = await fetch(`/api/tags?photoId=${photoId}`);

      if (!response.ok) {
        throw new Error("Failed to load tags");
      }

      const data = await response.json();
      const tags = data.tags || [];

      set((state) => {
        const newPhotos = state.photos.map((p) => {
          if (p.id === photoId) {
            return { ...p, tags };
          }
          return p;
        });
        return { photos: newPhotos };
      });

      return tags;
    } catch (error) {
      console.error("Error loading tags:", error);
      return [];
    }
  },
}));
