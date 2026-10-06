import React, { useState } from 'react';
import { DocumentStatusBadge } from './DocumentStatusBadge';

export const DocumentTable = ({
  documents = [],
  isLoading = false,
  onSelectDocument,
  onProcessDocument,
  onDeleteDocument,
  processingDocIds = new Set(),
  isAdmin = true,
}) => {
  const [deleteModalDoc, setDeleteModalDoc] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const getFormatBadge = (filename, docType) => {
    const ext = (docType || filename?.split('.').pop() || 'txt').toLowerCase();
    let label = ext.toUpperCase();
    let badgeClass = 'format-badge-default';

    if (ext === 'pdf') {
      badgeClass = 'format-badge-pdf';
    } else if (ext === 'docx' || ext === 'doc') {
      badgeClass = 'format-badge-docx';
    } else if (ext === 'txt') {
      badgeClass = 'format-badge-txt';
    }

    return <span className={`doc-format-badge ${badgeClass}`}>{label}</span>;
  };

  const confirmDelete = async () => {
    if (!deleteModalDoc) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await onDeleteDocument(deleteModalDoc.id);
      setDeleteModalDoc(null);
    } catch (err) {
      if (err.status === 403) {
        setDeleteError('Permission denied: You do not have permission to delete this document.');
      } else if (err.status === 404) {
        setDeleteError('Document not found or has already been deleted.');
      } else if (err.status === 401) {
        setDeleteError('Session expired. Please log in again to delete documents.');
      } else {
        setDeleteError(err.message || 'Unable to delete document. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="table-responsive-wrapper">
      <table className="data-table enterprise-table" id="documents-table">
        <thead>
          <tr>
            <th style={{ minWidth: '260px' }}>Document / Filename</th>
            <th>Department</th>
            <th>Access Level</th>
            <th>File Size</th>
            <th>Uploaded</th>
            <th>Lifecycle Status</th>
            <th style={{ textAlign: 'right', minWidth: '160px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && documents.length === 0 ? (
            // Skeleton Loading State
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="skeleton-row">
                <td>
                  <div className="skeleton-line" style={{ width: '70%', height: '14px', marginBottom: '6px' }}></div>
                  <div className="skeleton-line" style={{ width: '40%', height: '10px' }}></div>
                </td>
                <td><div className="skeleton-line" style={{ width: '80px', height: '20px' }}></div></td>
                <td><div className="skeleton-line" style={{ width: '70px', height: '20px' }}></div></td>
                <td><div className="skeleton-line" style={{ width: '50px', height: '14px' }}></div></td>
                <td><div className="skeleton-line" style={{ width: '75px', height: '14px' }}></div></td>
                <td><div className="skeleton-line" style={{ width: '90px', height: '22px' }}></div></td>
                <td><div className="skeleton-line" style={{ width: '110px', height: '28px', marginLeft: 'auto' }}></div></td>
              </tr>
            ))
          ) : documents.length === 0 ? (
            // Empty State
            <tr>
              <td colSpan="7">
                <div className="table-empty-state">
                  <div className="empty-state-icon">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <h3 className="empty-state-title">No Enterprise Documents Found</h3>
                  <p className="empty-state-desc">
                    There are no knowledge files matching your active filter criteria. Upload a new document (PDF, DOCX, TXT) to index into the vector database.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            documents.map((doc) => {
              const isProcessing =
                doc.status === 'PROCESSING' || processingDocIds.has(doc.id);
              const effectiveStatus = isProcessing ? 'PROCESSING' : doc.status;

              return (
                <tr key={doc.id} className="document-table-row">
                  {/* Title & Filename with Format Badge */}
                  <td>
                    <div
                      className="doc-primary-info"
                      onClick={() => onSelectDocument(doc)}
                      role="button"
                      tabIndex="0"
                      title="Click to view full document metadata and vector chunks"
                    >
                      <div className="doc-format-icon-container">
                        {getFormatBadge(doc.filename, doc.document_type)}
                      </div>
                      <div className="doc-title-stack">
                        <span className="doc-title-text">{doc.title || doc.filename}</span>
                        <span className="doc-filename-text">{doc.filename}</span>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td>
                    <span className="dept-tag">
                      <span className="dept-tag-dot"></span>
                      <span>{doc.department || 'General'}</span>
                    </span>
                  </td>

                  {/* Access Level */}
                  <td>
                    <span className={`access-pill ${doc.access_level || 'internal'}`}>
                      <span className="access-dot"></span>
                      <span>{(doc.access_level || 'internal').toUpperCase()}</span>
                    </span>
                  </td>

                  {/* File Size */}
                  <td>
                    <span className="doc-size-text">{formatFileSize(doc.file_size)}</span>
                  </td>

                  {/* Upload Date */}
                  <td>
                    <span className="doc-date-text">{formatDate(doc.created_at)}</span>
                  </td>

                  {/* Processing Status */}
                  <td>
                    <DocumentStatusBadge status={effectiveStatus} />
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-actions-group">
                      {isAdmin && doc.status === 'UPLOADED' && !isProcessing && (
                        <button
                          type="button"
                          className="btn-table-action process"
                          onClick={() => onProcessDocument(doc.id)}
                          title="Trigger parsing, chunking, and Qdrant vector indexing"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 4 23 10 17 10" />
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                          </svg>
                          <span>Process</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn-table-action view-details"
                        onClick={() => onSelectDocument(doc)}
                        title="View document metadata and chunks"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <span>Details</span>
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          className="btn-table-action danger"
                          onClick={() => {
                            setDeleteError('');
                            setDeleteModalDoc(doc);
                          }}
                          title="Delete document and indexed vectors"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Delete Confirmation Modal */}
      {deleteModalDoc && (
        <div className="modal-backdrop" onClick={() => !isDeleting && setDeleteModalDoc(null)}>
          <div
            className="modal-container delete-confirmation-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
          >
            <div className="modal-header">
              <div className="modal-title-box">
                <div className="danger-icon-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <h3 id="delete-confirm-title" className="modal-title" style={{ color: '#f87171' }}>
                    Confirm Document Deletion
                  </h3>
                  <span className="modal-subtitle">Irreversible Knowledge Base Modification</span>
                </div>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => !isDeleting && setDeleteModalDoc(null)}
                disabled={isDeleting}
                aria-label="Close delete dialog"
              >
                &times;
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.25rem 1.5rem' }}>
              <p className="delete-warning-text">
                Are you sure you want to permanently delete this document?
              </p>
              <p className="delete-subwarning-text">
                This operation will immediately remove the source file from storage, purge all chunk embeddings from the Qdrant Cloud collection, and invalidate related citation indices.
              </p>

              <div className="delete-target-preview">
                <div className="delete-doc-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="delete-doc-info">
                  <strong>{deleteModalDoc.title || deleteModalDoc.filename}</strong>
                  <span className="code-badge">{deleteModalDoc.filename}</span>
                </div>
              </div>

              {deleteError && (
                <div className="auth-alert error" role="alert" style={{ marginTop: '1rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            <div className="modal-actions-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteModalDoc(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                id="btn-confirm-delete"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Deleting Document...</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentTable;
