'use client';

import React from 'react';
import { Photo } from '@/types';
import { usePhotoStore } from '@/store/photoStore';

interface PhotoCardProps {
  photo: Photo;
  onSelect: () => void;
  isSelected: boolean;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onSelect, isSelected }) => {
  const hasTag = photo.tags && photo.tags.length > 0;

  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-lg overflow-hidden shadow-md transition-all hover:shadow-lg hover:scale-105 ${
        isSelected ? 'ring-3 ring-blue-500' : 'ring-1 ring-gray-200 hover:ring-gray-300'
      }`}
    >
      <div className="relative aspect-square bg-gray-200">
        {photo.imageUrl ? (
          <img
            src={photo.imageUrl}
            alt={photo.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-300">
            <span className="text-xs text-gray-600">No image</span>
          </div>
        )}
        
        {/* Tag badge indicator */}
        {hasTag && (
          <div className="absolute top-1 right-1 bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {photo.tags.length}
          </div>
        )}
      </div>
      
      {/* Compact info card */}
      <div className="p-2 bg-white border-t border-gray-100">
        <h3 className="text-xs font-semibold text-gray-700 truncate">{photo.name}</h3>
        {hasTag ? (
          <div className="mt-1">
            <p className="text-xs text-gray-600 font-medium truncate">
              {photo.tags[0]?.species || 'Tagged'}
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">Not tagged</p>
        )}
      </div>
    </div>
  );
};
