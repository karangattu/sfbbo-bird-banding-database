'use client';

import React from 'react';
import { FilterCriteria } from '@/types';

interface SearchFilterProps {
  filters: FilterCriteria;
  onFilterChange: (filters: FilterCriteria) => void;
  onClearFilters: () => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    onFilterChange({
      ...filters,
      [name]: value || undefined,
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v);

  return (
    <div className="p-4 bg-white border-b border-gray-200 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Search & Filter</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Record ID
          </label>
          <input
            type="text"
            name="recordId"
            value={filters.recordId || ''}
            onChange={handleChange}
            placeholder="e.g., BIG-001"
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Band Number
          </label>
          <input
            type="text"
            name="bandNumber"
            value={filters.bandNumber || ''}
            onChange={handleChange}
            placeholder="e.g., 12345"
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Species
          </label>
          <input
            type="text"
            name="species"
            value={filters.species || ''}
            onChange={handleChange}
            placeholder="e.g., Wilson's Warbler"
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={filters.location || ''}
            onChange={handleChange}
            placeholder="e.g., CCFS"
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            name="date"
            value={filters.date || ''}
            onChange={handleChange}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Age
          </label>
          <select
            name="age"
            value={filters.age || ''}
            onChange={handleChange}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Ages</option>
            <option value="HY">Hatch-Year (HY)</option>
            <option value="SY">Second-Year (SY)</option>
            <option value="ASY">After-Second-Year (ASY)</option>
            <option value="AHY">After-Hatch-Year (AHY)</option>
            <option value="U">Unknown (U)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Sex
          </label>
          <select
            name="sex"
            value={filters.sex || ''}
            onChange={handleChange}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sexes</option>
            <option value="M">Male (M)</option>
            <option value="F">Female (F)</option>
            <option value="U">Unknown (U)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Notes
          </label>
          <input
            type="text"
            name="notes"
            value={filters.notes || ''}
            onChange={handleChange}
            placeholder="Search notes..."
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
          Filters applied. {Object.values(filters).filter((v) => v).length} active filter(s).
        </div>
      )}
    </div>
  );
};
