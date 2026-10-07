import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { usePipeline } from '../context/PipelineContext';
import { DocumentFilters } from '../components/documents/DocumentFilters';
import { DocumentTable } from '../components/documents/DocumentTable';
import { DocumentUploadModal } from '../components/documents/DocumentUploadModal';
import { DocumentDetailsDrawer } from '../components/documents/DocumentDetailsDrawer';

export const Documents = () => {
  const { user } = useAuth();
  const {
    documents,
    isDocsLoading: isLoading,
    docsPage: page,
    setDocsPage: setPage,
    docsHasMore: hasMore,
    docsFilters: filters,
    setDocsFilters: setFilters,
    loadDocuments,
    processDocument,
    processAllDocuments,
    tasks,
  } = usePipeline();

  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  // Modals & Drawers
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);

  // Extract user role cleanly
  const userRoles = user?.roles
    ? user.roles.map((r) => (typeof r === 'object' ? r.name : r))
    : ['user'];
  const userRole = userRoles[0] || 'user';
  const isAdmin = userRoles.includes('admin');
  const userDept = user?.department || 'Engineering';

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  // Initial and reactive load on page/filter change
  useEffect(() => {
    loadDocuments(false);
  }, [loadDocuments]);

  // Action: Trigger document processing
  const handleProcessDocument = async (documentId, documentTitle) => {
    try {
      const pid = await processDocument(documentId, documentTitle);
      showNotification(`Document ingestion queued (Process: ${pid}). Text extraction & vector indexing in progress.`, 'info');
    } catch (err) {
      showNotification(`Failed to process document: ${err.message}`, 'error');
    }
  };

  // Action: Trigger process all pending documents
  const handleProcessAll = async () => {
    setIsProcessingAll(true);
    try {
      const pids = await processAllDocuments();
      showNotification(
        pids.length > 0
          ? `Dispatched ${pids.length} background ingestion tasks to Qdrant Cloud pipeline.`
          : 'Dispatched background ingestion tasks for all pending documents.',
        'info'
      );
    } catch (err) {
      showNotification(`Batch ingestion failed: ${err.message}`, 'error');
    } finally {
      setIsProcessingAll(false);
    }
  };

  // Action: Delete document
  const handleDeleteDocument = async (documentId) => {
    await apiClient.deleteDocument(documentId);
    showNotification('Document, vector embeddings, and chunks permanently removed from repository.');

    if (selectedDocId === documentId) {
      setSelectedDocId(null);
    }

    if (documents.length === 1 && page > 1) {
      setPage(page - 1);
    } else {
      loadDocuments(false);
    }
  };

  // Action: Upload success
  const handleUploadSuccess = (newDoc) => {
    showNotification(`Document "${newDoc.title || newDoc.filename}" uploaded successfully to repository.`);
    setPage(1);
    loadDocuments(false);
  };

  // Action: Reset filters
  const handleResetFilters = () => {
    setFilters({});
    setPage(1);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  // Summary Metrics Calculation
  const readyCount = documents.filter((d) => d.status === 'READY').length;
  const pendingCount = documents.filter((d) => d.status === 'UPLOADED' || d.status === 'FAILED').length;
  const processingCount = documents.filter((d) => d.status === 'PROCESSING').length;
  const totalChunks = documents.reduce((sum, d) => sum + (d.chunk_count || 0), 0);
  const activeProcessingDocIds = new Set(
    tasks.filter((t) => t.status === 'PROCESSING' && t.targetId).map((t) => t.targetId)
  );

  return (
    <div className="documents-page-container">
      {/* Top Breadcrumb & RBAC Indicator */}
      <div className="documents-top-bar">
        <div className="breadcrumb">
          <span>Enterprise Knowledge Intelligence</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-active">Document Management</span>
        </div>

        <div className="rbac-session-indicator">
          <span className="rbac-dot"></span>
          <span className="rbac-text">
            Session: <strong>{user?.name || userRole.toUpperCase()}</strong> ({userDept}) &bull;{' '}
            <span className={`role-badge-text ${userRole}`}>{userRole.toUpperCase()}</span>
          </span>
        </div>
      </div>

      {/* Main Page Title Header */}
      <div className="page-header documents-header">
        <div className="header-text-group">
          <div className="title-with-icon">
            <div className="title-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <h1 className="page-title">Enterprise Knowledge Repository</h1>
              <p className="page-description">
                Upload, manage, and process corporate unstructured documents with automated chunking, hybrid BM25 + Qdrant vector indexing, and department-level RBAC partitioning.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Repository Metrics Bar */}
      <div className="repo-metrics-grid">
        <div className="repo-metric-card">
          <div className="metric-icon-box blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div className="metric-details">
            <span className="metric-label">Page Documents</span>
            <span className="metric-val">{documents.length}</span>
            <span className="metric-sub">Page {page} view</span>
          </div>
        </div>

        <div className="repo-metric-card">
          <div className="metric-icon-box emerald">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="metric-details">
            <span className="metric-label">Vector Ready</span>
            <span className="metric-val emerald">{readyCount}</span>
            <span className="metric-sub">Searchable in Qdrant</span>
          </div>
        </div>

        <div className="repo-metric-card">
          <div className="metric-icon-box purple">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div className="metric-details">
            <span className="metric-label">Indexed Chunks</span>
            <span className="metric-val purple">{totalChunks}</span>
            <span className="metric-sub">384-dim BGE Small</span>
          </div>
        </div>

        <div className="repo-metric-card">
          <div className={`metric-icon-box ${processingCount > 0 ? 'amber spinning-icon' : 'gray'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </div>
          <div className="metric-details">
            <span className="metric-label">Ingestion Pipeline</span>
            <span className={`metric-val ${processingCount > 0 ? 'amber' : ''}`}>{processingCount} Active</span>
            <span className="metric-sub">{processingCount > 0 ? 'Auto-polling enabled' : 'Pipeline idle'}</span>
          </div>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {notification && (
        <div className={`toast-notification ${notification.type}`} role="status">
          <div className="toast-icon">
            {notification.type === 'error' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            ) : notification.type === 'info' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="8" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <span className="toast-message">{notification.message}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => setNotification(null)}
            aria-label="Dismiss notification"
          >
            &times;
          </button>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="auth-alert error" role="alert" style={{ marginBottom: '1.25rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Filters & Actions Bar */}
      <DocumentFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onRefresh={() => loadDocuments(false)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onProcessAll={handleProcessAll}
        pendingCount={pendingCount}
        isProcessingAll={isProcessingAll}
        isLoading={isLoading}
        isAdmin={isAdmin}
      />

      {/* Document Table Panel */}
      <div className="panel document-table-panel">
        <div className="panel-header">
          <div className="panel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span>Managed Repository Documents</span>
          </div>
          <div className="table-header-meta">
            <span className="table-badge">
              {documents.length} document{documents.length === 1 ? '' : 's'} on page {page}
            </span>
          </div>
        </div>

        <div className="panel-body" style={{ padding: 0 }}>
          <DocumentTable
            documents={documents}
            isLoading={isLoading}
            onSelectDocument={(doc) => setSelectedDocId(doc.id)}
            onProcessDocument={(docId) => {
              const targetDoc = documents.find((d) => d.id === docId);
              handleProcessDocument(docId, targetDoc?.title || targetDoc?.filename);
            }}
            onDeleteDocument={handleDeleteDocument}
            processingDocIds={activeProcessingDocIds}
            isAdmin={isAdmin}
          />
        </div>

        {/* Pagination Controls */}
        <div className="pagination-bar">
          <div className="pagination-info">
            Showing page <strong className="page-highlight">{page}</strong> &bull;{' '}
            <span className="pagination-subtext">{hasMore ? 'Additional pages available' : 'End of repository list'}</span>
          </div>

          <div className="pagination-actions">
            <button
              type="button"
              className="btn-pagination"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              id="btn-pagination-prev"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Previous</span>
            </button>

            <span className="page-number-pill">{page}</span>

            <button
              type="button"
              className="btn-pagination"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore || isLoading}
              id="btn-pagination-next"
            >
              <span>Next</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Upload Modal (Admin only) */}
      {isAdmin && (
        <DocumentUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {/* Document Details & Chunk Inspection Drawer */}
      <DocumentDetailsDrawer
        isOpen={Boolean(selectedDocId)}
        documentId={selectedDocId}
        onClose={() => setSelectedDocId(null)}
        onProcess={handleProcessDocument}
        onDelete={(doc) => {
          setSelectedDocId(null);
          handleDeleteDocument(doc.id);
        }}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default Documents;
