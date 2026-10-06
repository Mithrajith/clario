import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { ChunkViewer } from './ChunkViewer';

export const DocumentDetailsDrawer = ({
  isOpen,
  documentId,
  onClose,
  onProcess,
  onDelete,
  isAdmin = true,
}) => {
  const [doc, setDoc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isProcessingLocal, setIsProcessingLocal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchDetails = async () => {
      if (!documentId || !isOpen) return;

      setIsLoading(true);
      setError('');
      try {
        const data = await apiClient.getDocument(documentId);
        if (isMounted) {
          setDoc(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load document details.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [documentId, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyId = () => {
    if (doc?.id) {
      navigator.clipboard?.writeText(doc.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleProcessClick = async () => {
    if (!doc?.id) return;
    setIsProcessingLocal(true);
    try {
      if (onProcess) {
        await onProcess(doc.id);
        const updated = await apiClient.getDocument(doc.id);
        setDoc(updated);
      }
    } catch (err) {
      setError(err.message || 'Failed to trigger document processing.');
    } finally {
      setIsProcessingLocal(false);
    }
  };

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
      return new Date(isoString).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="drawer-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Document Details"
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-box">
            <div className="drawer-header-left">
              <div className="drawer-format-badge">
                {doc && getFormatBadge(doc.filename, doc.document_type)}
              </div>
              <div className="drawer-title-stack">
                <h2 className="drawer-title">{doc?.title || 'Document Details'}</h2>
                <span className="drawer-subtitle">{doc?.filename || 'File metadata & vector chunks'}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Close drawer"
          >
            &times;
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
          {isLoading ? (
            <div className="drawer-loading-state">
              <div className="spinner"></div>
              <p>Retrieving document metadata & chunk indices...</p>
            </div>
          ) : error ? (
            <div className="auth-alert error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          ) : doc ? (
            <>
              {/* Status and Action Banner */}
              <div className="details-status-card">
                <div className="status-indicator-group">
                  <span className="meta-label">Current Processing Status</span>
                  <div style={{ marginTop: '0.35rem' }}>
                    <DocumentStatusBadge status={doc.status} />
                  </div>
                </div>

                {isAdmin && doc.status === 'UPLOADED' && (
                  <button
                    type="button"
                    className="btn-primary btn-process-now"
                    onClick={handleProcessClick}
                    disabled={isProcessingLocal}
                    id="btn-drawer-process"
                  >
                    {isProcessingLocal ? (
                      <>
                        <span className="btn-spinner"></span>
                        <span>Dispatching Ingestion...</span>
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="23 4 23 10 17 10" />
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                        <span>Process & Embed Now</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Document Metadata Table */}
              <div className="drawer-section">
                <h3 className="drawer-section-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>Document Specifications</span>
                </h3>
                <div className="drawer-meta-card">
                  <div className="drawer-meta-item">
                    <span className="meta-key">Document ID</span>
                    <span className="meta-val">
                      <button
                        type="button"
                        className="code-badge-btn copyable"
                        onClick={handleCopyId}
                        title="Click to copy Document ID"
                      >
                        <code>{doc.id}</code>
                        <span className="copy-hint">{copiedId ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </span>
                  </div>

                  <div className="drawer-meta-item">
                    <span className="meta-key">Filename</span>
                    <span className="meta-val font-mono">{doc.filename}</span>
                  </div>

                  <div className="drawer-meta-item">
                    <span className="meta-key">File Size</span>
                    <span className="meta-val">{formatFileSize(doc.file_size)}</span>
                  </div>

                  <div className="drawer-meta-item">
                    <span className="meta-key">Department Partition</span>
                    <span className="meta-val">
                      <span className="dept-tag">
                        <span className="dept-tag-dot"></span>
                        <span>{doc.department || 'General'}</span>
                      </span>
                    </span>
                  </div>

                  <div className="drawer-meta-item">
                    <span className="meta-key">Access Authorization</span>
                    <span className="meta-val">
                      <span className={`access-pill ${doc.access_level || 'internal'}`}>
                        <span className="access-dot"></span>
                        <span>{(doc.access_level || 'internal').toUpperCase()}</span>
                      </span>
                    </span>
                  </div>

                  <div className="drawer-meta-item">
                    <span className="meta-key">Uploaded By</span>
                    <span className="meta-val code-badge">{doc.uploaded_by || 'System User'}</span>
                  </div>

                  <div className="drawer-meta-item">
                    <span className="meta-key">Created Timestamp</span>
                    <span className="meta-val">{formatDate(doc.created_at)}</span>
                  </div>

                  <div className="drawer-meta-item">
                    <span className="meta-key">Last Ingested / Updated</span>
                    <span className="meta-val">{formatDate(doc.updated_at)}</span>
                  </div>
                </div>
              </div>

              {/* Chunk Inspection Section */}
              <div className="drawer-section">
                <h3 className="drawer-section-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                  <span>Vector Chunks & Embeddings</span>
                </h3>
                <ChunkViewer
                  chunkCount={doc.chunk_count || 0}
                  status={doc.status}
                />
              </div>
            </>
          ) : null}
        </div>

        {/* Drawer Footer Actions */}
        <div className="drawer-footer">
          {isAdmin && doc && (
            <button
              type="button"
              className="btn-danger-outline"
              onClick={() => onDelete(doc)}
              id="btn-drawer-delete"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span>Delete Document</span>
            </button>
          )}

          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            Close Drawer
          </button>
        </div>
      </aside>
    </div>
  );
};

export default DocumentDetailsDrawer;
