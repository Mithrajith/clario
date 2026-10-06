import React from 'react';

const DEPARTMENTS = [
  'Engineering',
  'Operations',
  'Legal & Compliance',
  'Finance',
  'Human Resources',
  'Product & Design',
  'Security & IT',
  'Research',
];

const STATUSES = ['UPLOADED', 'PROCESSING', 'READY', 'FAILED'];
const ACCESS_LEVELS = ['public', 'internal', 'confidential', 'restricted'];

export const DocumentFilters = ({
  filters = {},
  onFilterChange,
  onResetFilters,
  onRefresh,
  onOpenUpload,
  isLoading = false,
}) => {
  const activeCount = [filters.department, filters.status, filters.access_level].filter(Boolean).length;
  const hasActiveFilters = activeCount > 0;

  const handleSelectChange = (key, value) => {
    onFilterChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  return (
    <div className="document-filters-container">
      <div className="filter-controls-row">
        {/* Department Filter */}
        <div className="filter-item">
          <label htmlFor="filter-department" className="filter-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Department</span>
          </label>
          <div className="select-wrapper">
            <select
              id="filter-department"
              className="filter-select"
              value={filters.department || ''}
              onChange={(e) => handleSelectChange('department', e.target.value)}
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter */}
        <div className="filter-item">
          <label htmlFor="filter-status" className="filter-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Status</span>
          </label>
          <div className="select-wrapper">
            <select
              id="filter-status"
              className="filter-select"
              value={filters.status || ''}
              onChange={(e) => handleSelectChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Access Level Filter */}
        <div className="filter-item">
          <label htmlFor="filter-access-level" className="filter-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Access Level</span>
          </label>
          <div className="select-wrapper">
            <select
              id="filter-access-level"
              className="filter-select"
              value={filters.access_level || ''}
              onChange={(e) => handleSelectChange('access_level', e.target.value)}
            >
              <option value="">All Access Levels</option>
              {ACCESS_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters Action */}
        {hasActiveFilters && (
          <button
            type="button"
            className="btn-filter-reset"
            onClick={onResetFilters}
            id="btn-clear-filters"
            title="Reset all active filters"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span>Clear Filters ({activeCount})</span>
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="filter-actions-row">
        <button
          type="button"
          className="btn-secondary btn-refresh"
          onClick={onRefresh}
          disabled={isLoading}
          id="btn-refresh-documents"
          title="Reload document list from server"
        >
          <svg
            className={isLoading ? 'spinning' : ''}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          <span>Refresh</span>
        </button>

        <button
          type="button"
          className="btn-primary btn-upload-doc"
          onClick={onOpenUpload}
          id="btn-open-upload-modal"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Upload Document</span>
        </button>
      </div>
    </div>
  );
};

export default DocumentFilters;
