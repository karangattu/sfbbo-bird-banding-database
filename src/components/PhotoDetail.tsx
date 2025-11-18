"use client";

import React from "react";
import { Photo } from "@/types";

interface PhotoDetailProps {
  photo: Photo | null;
  onAddTag: () => void;
  onEditTag: (tagId: string) => void;
  onDeleteTag: (tagId: string) => void;
  onDeletePhoto?: () => void;
}

export const PhotoDetail: React.FC<PhotoDetailProps> = ({
  photo,
  onAddTag,
  onEditTag,
  onDeleteTag,
  onDeletePhoto,
}) => {
  if (!photo) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Select a photo to view details
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Image Display */}
      <div
        className="flex-shrink-0 bg-gray-900 flex items-center justify-center"
        style={{ height: "400px" }}
      >
        {photo.imageUrl ? (
          <img
            src={photo.imageUrl}
            alt={photo.name}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <span className="text-white">Preview not available</span>
        )}
      </div>

      {/* Photo Info & Tags */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {photo.name}
            </h2>
            <a
              href={photo.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm inline-block"
            >
              Open in Google Drive →
            </a>
          </div>
          {onDeletePhoto && (
            <button
              onClick={onDeletePhoto}
              className="ml-2 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition flex items-center gap-1"
              title="Delete this photo and all associated tags from Google Drive"
            >
              🗑️ Delete Photo
            </button>
          )}
        </div>

        {/* Tags Section */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
            <button
              onClick={onAddTag}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
            >
              + Add Tag
            </button>
          </div>

          {photo.tags && photo.tags.length > 0 ? (
            <div className="space-y-4">
              {photo.tags.map((tag) => (
                <div
                  key={tag.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">
                        RECORD ID
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {tag.recordId}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">
                        BAND NUMBER
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {tag.bandNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">
                        SPECIES
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {tag.species}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">
                        DATE
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {tag.date || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">
                        LOCATION
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {tag.location || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">
                        AGE / SEX
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {tag.age} / {tag.sex}
                      </p>
                    </div>
                  </div>

                  {tag.firstPhotoNumber && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-semibold">Photobox:</span>{" "}
                      {tag.firstPhotoNumber}
                      {tag.lastPhotoNumber && ` - ${tag.lastPhotoNumber}`}
                    </div>
                  )}

                  {tag.wrpPlumageCode && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-semibold">WRP/Plumage Code:</span>{" "}
                      {tag.wrpPlumageCode}
                    </div>
                  )}

                  {tag.notes && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-semibold">Notes:</span> {tag.notes}
                    </div>
                  )}

                  <div className="flex gap-2 mt-3 justify-end">
                    <button
                      onClick={() => onEditTag(tag.id)}
                      className="text-xs px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteTag(tag.id)}
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No tags yet</p>
          )}
        </div>
      </div>
    </div>
  );
};
