import React from 'react';

/**
 * Status badge component for Document Lifecycle
 * Supports: UPLOADED, PROCESSING, READY, FAILED
 */
export const DocumentStatusBadge = ({ status }) => {
  const normalized = (status || '').toUpperCase();

  switch (normalized) {
    case 'READY':
      return (
        <span className="status-pill ready-status" title="Vector indexed and ready for semantic retrieval">
          <span className="status-indicator-dot success"></span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>READY</span>
        </span>
      );

    case 'PROCESSING':
      return (
        <span className="status-pill processing-status" title="Parsing, chunking, and embedding in background">
          <span className="status-indicator-dot warning animate-ping"></span>
          <span className="badge-spinner"></span>
          <span>PROCESSING</span>
        </span>
      );

    case 'FAILED':
      return (
        <span className="status-pill failed-status" title="Ingestion processing error occurred">
          <span className="status-indicator-dot danger"></span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>FAILED</span>
        </span>
      );

    case 'UPLOADED':
    default:
      return (
        <span className="status-pill uploaded-status" title="Stored in repository; pending vector processing">
          <span className="status-indicator-dot info"></span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span>UPLOADED</span>
        </span>
      );
  }
};

export default DocumentStatusBadge;
