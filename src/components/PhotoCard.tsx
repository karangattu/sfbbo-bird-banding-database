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
      className={`cursor-pointer rounded-lg overflow-hidden shadow-md transition-transform hover:scale-105 ${
        isSelected ? 'ring-4 ring-blue-500' : 'ring-2 ring-gray-200'
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
            <span className="text-gray-600">No image</span>
          </div>
        )}
      </div>
      <div className="p-3 bg-white">
        <h3 className="text-sm font-semibold text-gray-800 truncate">{photo.name}</h3>
        <div className="mt-2">
          {hasTag ? (
            <div className="space-y-1">
              {photo.tags.map((tag) => (
                <div key={tag.id} className="text-xs text-gray-600">
                  <p className="font-medium">{tag.species}</p>
                  <p className="text-gray-500">
                    {tag.age} {tag.sex}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No tags</p>
          )}
        </div>
      </div>
    </div>
  );
};
