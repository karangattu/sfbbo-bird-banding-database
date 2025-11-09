'use client';

import { useState } from 'react';
import { PhotoMetadata } from '@/services/serviceAccountDriveService';

interface PhotoUploadProps {
  folderId: string;
  onUploadSuccess?: (result: any) => void;
  onUploadError?: (error: string) => void;
}

export default function PhotoUpload({
  folderId,
  onUploadSuccess,
  onUploadError,
}: PhotoUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Metadata form state
  const [metadata, setMetadata] = useState<PhotoMetadata>({
    recordId: '',
    bandNumber: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    species: '',
    age: '',
    sex: '',
    notes: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleMetadataChange = (field: keyof PhotoMetadata, value: string) => {
    setMetadata((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      onUploadError?.('Please select a file');
      return;
    }

    // Validate required fields
    const requiredFields: (keyof PhotoMetadata)[] = [
      'recordId',
      'bandNumber',
      'date',
      'location',
      'species',
      'age',
      'sex',
    ];

    for (const field of requiredFields) {
      if (!metadata[field]) {
        onUploadError?.(`${field} is required`);
        return;
      }
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderId', folderId);
      formData.append('metadata', JSON.stringify(metadata));

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      // Reset form
      setFile(null);
      setPreviewUrl('');
      setMetadata({
        recordId: '',
        bandNumber: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        species: '',
        age: '',
        sex: '',
        notes: '',
      });
      setIsOpen(false);

      onUploadSuccess?.(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
      console.error('Upload error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        + Upload Photo
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Upload & Tag Photo</h2>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* File Upload Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Photo File *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isLoading}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                  {file && <p className="mt-2 text-sm text-green-600 font-medium">{file.name}</p>}
                </div>
              </div>

              {/* Image Preview */}
              {previewUrl && (
                <div className="border rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Preview</p>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-full max-h-48 rounded-lg"
                  />
                </div>
              )}

              {/* Required Metadata Section */}
              <div className="border-l-4 border-red-400 pl-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-red-600 mr-2">*</span> Required Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Record ID *
                    </label>
                    <input
                      type="text"
                      value={metadata.recordId}
                      onChange={(e) => handleMetadataChange('recordId', e.target.value)}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., CCFS-2025-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Band Number *
                    </label>
                    <input
                      type="text"
                      value={metadata.bandNumber}
                      onChange={(e) => handleMetadataChange('bandNumber', e.target.value)}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 1234567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={metadata.date}
                      onChange={(e) => handleMetadataChange('date', e.target.value)}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={metadata.location}
                      onChange={(e) => handleMetadataChange('location', e.target.value)}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Coyote Creek Field Station"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Species *
                    </label>
                    <input
                      type="text"
                      value={metadata.species}
                      onChange={(e) => handleMetadataChange('species', e.target.value)}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Wilson's Warbler"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age *
                    </label>
                    <select
                      value={metadata.age}
                      onChange={(e) => handleMetadataChange('age', e.target.value)}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Age</option>
                      <option value="hatching year">Hatching Year</option>
                      <option value="second year">Second Year</option>
                      <option value="after second year">After Second Year</option>
                      <option value="adult">Adult</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sex *
                    </label>
                    <select
                      value={metadata.sex}
                      onChange={(e) => handleMetadataChange('sex', e.target.value)}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Sex</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Optional Metadata Section */}
              <div className="border-l-4 border-gray-300 pl-4">
                <h3 className="font-semibold text-gray-900 mb-4">Optional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Photo Number
                    </label>
                    <input
                      type="text"
                      value={metadata.firstPhotoNumber || ''}
                      onChange={(e) => handleMetadataChange('firstPhotoNumber', e.target.value)}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Photo Number
                    </label>
                    <input
                      type="text"
                      value={metadata.lastPhotoNumber || ''}
                      onChange={(e) => handleMetadataChange('lastPhotoNumber', e.target.value)}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 005"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      WRP/Plumage Code
                    </label>
                    <input
                      type="text"
                      value={metadata.wrpPlumageCode || ''}
                      onChange={(e) => handleMetadataChange('wrpPlumageCode', e.target.value)}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., WWAR-M-HY"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={metadata.notes || ''}
                      onChange={(e) => handleMetadataChange('notes', e.target.value)}
                      disabled={isLoading}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Any additional notes about the photo..."
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !file}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="inline-block animate-spin">⟳</span> Uploading...
                    </>
                  ) : (
                    '✓ Upload Photo'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
