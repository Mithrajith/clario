import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export const AuditLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const PAGE_SIZE = 25;
  const userRole = (typeof user?.roles?.[0] === 'object' ? user?.roles?.[0]?.name : user?.roles?.[0]) || 'analyst';

  const loadAuditLogs = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const skip = (page - 1) * PAGE_SIZE;
      const data = await apiClient.getAuditLogs({
        skip,
        limit: PAGE_SIZE,
        action: actionFilter || undefined,
        resource_type: resourceFilter || undefined,
      });
      const list = Array.isArray(data) ? data : [];
      setLogs(list);
      setHasMore(list.length === PAGE_SIZE);
    } catch (err) {
      setError(err.message || 'Failed to retrieve governance audit logs from backend.');
    } finally {
      setIsLoading(false);
    }
  }, [page, actionFilter, resourceFilter]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getActionBadgeClass = (action) => {
    const act = (action || '').toLowerCase();
    if (act.includes('upload') || act.includes('create')) return 'success';
    if (act.includes('delete')) return 'error';
    if (act.includes('process') || act.includes('update')) return 'warning';
    return 'neutral';
  };

  return (
    <div className="audit-page-container">
      {/* Top Breadcrumb */}
      <div className="documents-top-bar">
        <div className="breadcrumb">
          <span>Governance & Activity</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-active">Audit Logs</span>
        </div>

        <div className="rbac-session-indicator">
          <span className="rbac-dot"></span>
          <span className="rbac-text">
            Auditor Role: <span className={`role-badge-text ${userRole}`}>{userRole.toUpperCase()}</span>
          </span>
        </div>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div className="title-with-icon">
          <div className="title-icon-box" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div>
            <h1 className="page-title">Governance & Security Audit Logs</h1>
            <p className="page-description">
              Tamper-evident activity trail recording document ingestion, user queries, authentication events, and authorization decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="document-filters-container">
        <div className="filter-controls-row">
          <div className="filter-item">
            <label htmlFor="filter-audit-action" className="filter-label">
              Action Filter
            </label>
            <div className="select-wrapper">
              <select
                id="filter-audit-action"
                className="filter-select"
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Actions</option>
                <option value="upload">Upload</option>
                <option value="process">Process</option>
                <option value="delete">Delete</option>
                <option value="query">Query / Generation</option>
                <option value="search">Search</option>
                <option value="update_user">User Management</option>
              </select>
            </div>
          </div>

          <div className="filter-item">
            <label htmlFor="filter-audit-resource" className="filter-label">
              Resource Type
            </label>
            <div className="select-wrapper">
              <select
                id="filter-audit-resource"
                className="filter-select"
                value={resourceFilter}
                onChange={(e) => {
                  setResourceFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Resource Types</option>
                <option value="document">Document</option>
                <option value="generation">Generation</option>
                <option value="retrieval">Retrieval</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>

          {(actionFilter || resourceFilter) && (
            <button
              type="button"
              className="btn-filter-reset"
              onClick={() => {
                setActionFilter('');
                setResourceFilter('');
                setPage(1);
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="filter-actions-row">
          <button
            type="button"
            className="btn-secondary"
            onClick={loadAuditLogs}
            disabled={isLoading}
            id="btn-refresh-audit-logs"
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
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
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

      {/* Audit Logs Table Panel */}
      <div className="panel document-table-panel">
        <div className="panel-header">
          <div className="panel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            <span>Recorded Audit Events</span>
          </div>
          <span className="code-badge">
            {logs.length} event{logs.length === 1 ? '' : 's'} on page {page}
          </span>
        </div>

        <div className="panel-body" style={{ padding: 0 }}>
          <div className="table-responsive-wrapper">
            <table className="data-table enterprise-table" id="audit-logs-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '170px' }}>Timestamp</th>
                  <th>Action</th>
                  <th>Resource Type</th>
                  <th>Principal User</th>
                  <th>Resource ID</th>
                  <th>Event Details</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && logs.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="skeleton-row">
                      <td><div className="skeleton-line" style={{ width: '130px', height: '14px' }}></div></td>
                      <td><div className="skeleton-line" style={{ width: '80px', height: '18px' }}></div></td>
                      <td><div className="skeleton-line" style={{ width: '70px', height: '14px' }}></div></td>
                      <td><div className="skeleton-line" style={{ width: '100px', height: '14px' }}></div></td>
                      <td><div className="skeleton-line" style={{ width: '90px', height: '14px' }}></div></td>
                      <td><div className="skeleton-line" style={{ width: '180px', height: '14px' }}></div></td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="table-empty-state">
                        <div className="empty-state-icon">
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 14 14" />
                          </svg>
                        </div>
                        <h3 className="empty-state-title">No Audit Logs Found</h3>
                        <p className="empty-state-desc">
                          No audit events matched your filter criteria in the security log store.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="document-table-row">
                      <td>
                        <span className="doc-date-text">{formatDate(log.created_at)}</span>
                      </td>

                      <td>
                        <span className={`status-pill ${getActionBadgeClass(log.action)}`}>
                          {log.action?.toUpperCase()}
                        </span>
                      </td>

                      <td>
                        <span className="code-badge">{log.resource_type || '—'}</span>
                      </td>

                      <td>
                        <span className="code-badge font-mono">{log.user_id ? `${String(log.user_id).slice(0, 8)}...` : 'System'}</span>
                      </td>

                      <td>
                        <span className="code-badge font-mono">{log.resource_id ? `${String(log.resource_id).slice(0, 10)}...` : '—'}</span>
                      </td>

                      <td>
                        <div className="audit-details-preview" title={JSON.stringify(log.details || {}, null, 2)}>
                          <code>{JSON.stringify(log.details || {})}</code>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Bar */}
        <div className="pagination-bar">
          <div className="pagination-info">
            Showing page <strong className="page-highlight">{page}</strong> &bull;{' '}
            <span className="pagination-subtext">{hasMore ? 'Additional logs available' : 'End of audit stream'}</span>
          </div>

          <div className="pagination-actions">
            <button
              type="button"
              className="btn-pagination"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              id="btn-audit-prev"
            >
              Previous
            </button>

            <span className="page-number-pill">{page}</span>

            <button
              type="button"
              className="btn-pagination"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore || isLoading}
              id="btn-audit-next"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;

