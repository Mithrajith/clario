import React from 'react';
import { useAuth } from '../context/AuthContext';

export const Roles = () => {
  const { user } = useAuth();

  const permissionsMatrix = [
    { capability: 'Knowledge Chat & RAG Generation', user: true, analyst: true, admin: true },
    { capability: 'Hybrid Vector & Keyword Search', user: true, analyst: true, admin: true },
    { capability: 'View Authorized Department Documents', user: true, analyst: true, admin: true },
    { capability: 'View Confidential & Broad Department Documents', user: false, analyst: true, admin: true },
    { capability: 'Cross-Department Information Access (All)', user: false, analyst: false, admin: true },
    { capability: 'Upload & Store Corporate Documents', user: false, analyst: false, admin: true },
    { capability: 'Trigger Ingestion & Vector Indexing', user: false, analyst: false, admin: true },
    { capability: 'Delete Documents & Vector Embeddings', user: false, analyst: false, admin: true },
    { capability: 'Governance & Activity Audit Logs', user: false, analyst: true, admin: true },
    { capability: 'User Directory & Account Status', user: false, analyst: false, admin: true },
    { capability: 'Modify User Roles & Permissions', user: false, analyst: false, admin: true },
    { capability: 'Infrastructure Health & Diagnostics', user: false, analyst: false, admin: true },
  ];

  return (
    <div className="roles-page-container">
      {/* Top Breadcrumb */}
      <div className="documents-top-bar">
        <div className="breadcrumb">
          <span>Administration</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-active">Roles & Access Matrix</span>
        </div>

        <div className="rbac-session-indicator">
          <span className="rbac-dot"></span>
          <span className="rbac-text">
            Security Control &bull; <strong>{user?.email}</strong>
          </span>
        </div>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div className="title-with-icon">
          <div className="title-icon-box" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            <h1 className="page-title">Enterprise Role-Based Access Control (RBAC)</h1>
            <p className="page-description">
              Authoritative permission matrix governing data access boundaries, ingestion privileges, and administrative capabilities.
            </p>
          </div>
        </div>
      </div>

      {/* Roles Cards Grid */}
      <div className="repo-metrics-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="repo-metric-card">
          <div className="metric-icon-box blue">
            <span style={{ fontWeight: 800 }}>U</span>
          </div>
          <div className="metric-details">
            <span className="metric-label">USER Role</span>
            <span className="metric-val">Read & Use Only</span>
            <span className="metric-sub">Department scope only</span>
          </div>
        </div>

        <div className="repo-metric-card">
          <div className="metric-icon-box purple">
            <span style={{ fontWeight: 800 }}>A</span>
          </div>
          <div className="metric-details">
            <span className="metric-label">ANALYST Role</span>
            <span className="metric-val purple">Audit & Retrieval</span>
            <span className="metric-sub">Broader access & audit logs</span>
          </div>
        </div>

        <div className="repo-metric-card" style={{ gridColumn: 'span 2' }}>
          <div className="metric-icon-box" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
            <span style={{ fontWeight: 800 }}>👑</span>
          </div>
          <div className="metric-details">
            <span className="metric-label">ADMINISTRATOR Role</span>
            <span className="metric-val" style={{ color: '#f87171' }}>Full Cross-Department Control</span>
            <span className="metric-sub">Manage knowledge, users, roles, audit logs, and cloud diagnostics</span>
          </div>
        </div>
      </div>

      {/* Permissions Matrix Panel */}
      <div className="panel document-table-panel">
        <div className="panel-header">
          <div className="panel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Clario Authoritative Access Matrix</span>
          </div>
        </div>

        <div className="panel-body" style={{ padding: 0 }}>
          <div className="table-responsive-wrapper">
            <table className="data-table enterprise-table" id="rbac-matrix-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '320px' }}>Platform Capability / Operation</th>
                  <th style={{ textAlign: 'center', width: '140px' }}>USER</th>
                  <th style={{ textAlign: 'center', width: '140px' }}>ANALYST</th>
                  <th style={{ textAlign: 'center', width: '140px' }}>ADMIN</th>
                </tr>
              </thead>
              <tbody>
                {permissionsMatrix.map((item, idx) => (
                  <tr key={idx} className="document-table-row">
                    <td>
                      <strong>{item.capability}</strong>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {item.user ? (
                        <span style={{ color: '#34d399', fontWeight: 700 }}>✓ Allowed</span>
                      ) : (
                        <span style={{ color: '#64748b' }}>— Denied</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {item.analyst ? (
                        <span style={{ color: '#34d399', fontWeight: 700 }}>✓ Allowed</span>
                      ) : (
                        <span style={{ color: '#64748b' }}>— Denied</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {item.admin ? (
                        <span style={{ color: '#34d399', fontWeight: 700 }}>✓ Allowed</span>
                      ) : (
                        <span style={{ color: '#64748b' }}>— Denied</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Roles;
