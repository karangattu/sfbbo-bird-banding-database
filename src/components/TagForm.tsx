"use client";

import React, { useState } from "react";
import { PhotoTag } from "@/types";
import { usePhotoStore } from "@/store/photoStore";

interface TagFormProps {
  photoId: string;
  onClose: () => void;
  existingTag?: PhotoTag;
}

export const TagForm: React.FC<TagFormProps> = ({
  photoId,
  onClose,
  existingTag,
}) => {
  const { addTag, updateTag } = usePhotoStore();
  const [formData, setFormData] = useState({
    recordId: existingTag?.recordId || "",
    bandNumber: existingTag?.bandNumber || "",
    date: existingTag?.date || "",
    location: existingTag?.location || "CCFS",
    species: existingTag?.species || "",
    age: existingTag?.age || "",
    sex: existingTag?.sex || "",
    firstPhotoNumber: existingTag?.firstPhotoNumber || "",
    lastPhotoNumber: existingTag?.lastPhotoNumber || "",
    wrpPlumageCode: existingTag?.wrpPlumageCode || "",
    notes: existingTag?.notes || "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.recordId || !formData.bandNumber || !formData.species) {
      alert("Please fill in Record ID, Band Number, and Species");
      return;
    }

    const tagData = {
      recordId: formData.recordId,
      bandNumber: formData.bandNumber,
      date: formData.date,
      location: formData.location,
      species: formData.species,
      age: formData.age,
      sex: formData.sex,
      firstPhotoNumber: formData.firstPhotoNumber || undefined,
      lastPhotoNumber: formData.lastPhotoNumber || undefined,
      wrpPlumageCode: formData.wrpPlumageCode || undefined,
      notes: formData.notes || undefined,
    };

    if (existingTag) {
      const tag: PhotoTag = {
        ...tagData,
        id: existingTag.id,
        createdAt: existingTag.createdAt,
      };
      await updateTag(photoId, existingTag.id, tag);
    } else {
      const tag: PhotoTag = {
        ...tagData,
        id: "",
        createdAt: new Date().toISOString(),
      };
      await addTag(photoId, tag);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="sticky top-0 bg-gray-100 border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {existingTag ? "Edit Tag" : "Add Tag"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Required Fields */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Required Fields
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Record ID *
                </label>
                <input
                  type="text"
                  name="recordId"
                  value={formData.recordId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Band Number *
                </label>
                <input
                  type="text"
                  name="bandNumber"
                  value={formData.bandNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Species *
                </label>
                <input
                  type="text"
                  name="species"
                  value={formData.species}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="e.g., Wilson's Warbler"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., CCFS"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <select
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select age</option>
                  <option value="HY">Hatch-Year (HY)</option>
                  <option value="SY">Second-Year (SY)</option>
                  <option value="ASY">After-Second-Year (ASY)</option>
                  <option value="AHY">After-Hatch-Year (AHY)</option>
                  <option value="U">Unknown (U)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sex
                </label>
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select sex</option>
                  <option value="M">Male (M)</option>
                  <option value="F">Female (F)</option>
                  <option value="U">Unknown (U)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Optional Fields */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Optional Fields
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Picture Number (Photobox photos)
                </label>
                <input
                  type="text"
                  name="firstPhotoNumber"
                  value={formData.firstPhotoNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Picture Number (Photobox photos)
                </label>
                <input
                  type="text"
                  name="lastPhotoNumber"
                  value={formData.lastPhotoNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WRP/Plumage Code
                </label>
                <input
                  type="text"
                  name="wrpPlumageCode"
                  value={formData.wrpPlumageCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
            >
              {existingTag ? "Update Tag" : "Add Tag"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
