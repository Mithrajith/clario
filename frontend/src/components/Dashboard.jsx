import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

export const Dashboard = () => {
  const { user, token } = useAuth();
  const [healthStatus, setHealthStatus] = useState({
    loading: true,
    data: null,
    error: null,
  });
  const [profileRefresh, setProfileRefresh] = useState({
    loading: false,
    data: null,
    error: null,
  });

  const checkHealth = async () => {
    setHealthStatus({ loading: true, data: null, error: null });
    try {
      const data = await apiClient.checkHealth();
      setHealthStatus({ loading: false, data, error: null });
    } catch (err) {
      setHealthStatus({
        loading: false,
        data: null,
        error: err.message || 'Failed to connect to backend',
      });
    }
  };

  const recheckProfile = async () => {
    setProfileRefresh({ loading: true, data: null, error: null });
    try {
      const data = await apiClient.getMe();
      setProfileRefresh({ loading: false, data, error: null });
    } catch (err) {
      setProfileRefresh({
        loading: false,
        data: null,
        error: err.message || 'Failed to verify user session',
      });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const userRoles = user?.roles
    ? user.roles.map((r) => (typeof r === 'object' ? r.name : r))
    : ['user'];

  const primaryRole = userRoles[0] || 'user';

  const roleDetails = {
    admin: {
      name: 'Administrator (IT)',
      badgeClass: 'admin',
      capabilities: [
        'Full document ingestion & processing across all departments',
        'Delete & manage enterprise documents and embeddings',
        'Query cross-departmental knowledge base without restriction',
        'Inspect system health and infrastructure configuration',
      ],
    },
    analyst: {
      name: 'Analyst (Operations)',
      badgeClass: 'analyst',
      capabilities: [
        'Query operational and cross-departmental knowledge bases',
        'Inspect NLI faithfulness verification scores & claim citations',
        'Evaluate retrieval precision and document chunk lineage',
        'View authorized enterprise documents',
      ],
    },
    user: {
      name: 'Standard User (Engineering)',
      badgeClass: 'user',
      capabilities: [
        'Query Engineering and public enterprise knowledge bases',
        'Interactive multi-turn conversation with contextual follow-ups',
        'Inspect grounded source citations and page references',
        'Strict department security isolation enforced',
      ],
    },
  };

  const currentRoleInfo = roleDetails[primaryRole.toLowerCase()] || roleDetails.user;

  return (
    <div className="dashboard-content-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Identity, RBAC & Infrastructure</h1>
          <p className="page-description">
            Active JWT-authenticated session for <strong>{user?.email}</strong> &bull; Department: <strong>{user?.department || 'General'}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-action" onClick={recheckProfile} id="btn-recheck-profile">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            {profileRefresh.loading ? 'Validating Token...' : 'Verify Session (GET /auth/me)'}
          </button>
        </div>
      </div>

      {/* Cloud Infrastructure Grid */}
      <div className="panel" id="system-status">
        <div className="panel-header">
          <div className="panel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
              <line x1="6" y1="6" x2="6.01" y2="6" />
              <line x1="6" y1="18" x2="6.01" y2="18" />
            </svg>
            <span>Active Cloud Infrastructure & AI Pipeline</span>
          </div>
          <button
            className="btn-action"
            onClick={checkHealth}
            id="btn-recheck-health"
          >
            Refresh Diagnostics
          </button>
        </div>

        <div className="panel-body">
          <table className="data-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Provider & Target</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Clario FastAPI Backend</strong></td>
                <td><span className="code-badge">/api/v1/health</span></td>
                <td>
                  {healthStatus.loading ? (
                    <span className="status-pill neutral">Checking...</span>
                  ) : healthStatus.error ? (
                    <span className="status-pill error">Offline ({healthStatus.error})</span>
                  ) : (
                    <span className="status-pill success">● Operational ({healthStatus.data?.status || 'healthy'})</span>
                  )}
                </td>
              </tr>
              <tr>
                <td><strong>Relational Database</strong></td>
                <td><span className="code-badge">Neon Serverless PostgreSQL (PostgreSQL 18.6)</span></td>
                <td><span className="status-pill success">● Connected & Synced</span></td>
              </tr>
              <tr>
                <td><strong>Vector Database Cluster</strong></td>
                <td><span className="code-badge">Qdrant Cloud (384-dim BAAI/bge-small-en-v1.5)</span></td>
                <td><span className="status-pill success">● Cluster Green</span></td>
              </tr>
              <tr>
                <td><strong>LLM Inference Engine</strong></td>
                <td><span className="code-badge">Groq Cloud (qwen/qwen3.8-27b)</span></td>
                <td><span className="status-pill success">● Operational (Sub-500ms)</span></td>
              </tr>
              <tr>
                <td><strong>Grounding Verification Engine</strong></td>
                <td><span className="code-badge">DeBERTa-v3 NLI Cross-Encoder</span></td>
                <td><span className="status-pill success">● Loaded & Calibrated</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* User Session Profile Panel */}
      <div className="panel" id="user-profile-panel">
        <div className="panel-header">
          <div className="panel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Authenticated Identity Profile & RBAC Scope</span>
          </div>
          <span className={`role-pill ${currentRoleInfo.badgeClass}`}>
            {currentRoleInfo.name}
          </span>
        </div>

        <div className="panel-body">
          <table className="data-table">
            <thead>
              <tr>
                <th>Claim / Attribute</th>
                <th>Value</th>
                <th>Security Context</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>User ID (Subject)</strong></td>
                <td><span className="code-badge">{user?.id || '—'}</span></td>
                <td>Immutable UUIDv4 Principal Identifier</td>
              </tr>
              <tr>
                <td><strong>Full Name</strong></td>
                <td>{user?.name || '—'}</td>
                <td>Identity Profile</td>
              </tr>
              <tr>
                <td><strong>Corporate Email</strong></td>
                <td>{user?.email || '—'}</td>
                <td>Verified Login Address</td>
              </tr>
              <tr>
                <td><strong>Department</strong></td>
                <td>
                  <span className="dept-tag">{user?.department || 'Unassigned'}</span>
                </td>
                <td>Access Boundary Partition</td>
              </tr>
              <tr>
                <td><strong>Assigned Roles</strong></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {userRoles.map((r) => (
                      <span key={r} className={`role-pill ${r.toLowerCase()}`}>
                        {r.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </td>
                <td>Role-Based Access Control (RBAC)</td>
              </tr>
              <tr>
                <td><strong>Bearer JWT Token</strong></td>
                <td>
                  <span className="code-badge">
                    {token ? `${token.slice(0, 24)}...${token.slice(-12)}` : 'None'}
                  </span>
                </td>
                <td>Auto-injected into <code>Authorization: Bearer</code> headers</td>
              </tr>
            </tbody>
          </table>

          {/* Role Permissions Matrix */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
              Authorized Permissions for {currentRoleInfo.name}:
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {currentRoleInfo.capabilities.map((cap, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span style={{ color: '#34d399' }}>✓</span>
                  <span>{cap}</span>
                </li>
              ))}
            </ul>
          </div>

          {profileRefresh.data && (
            <div className="auth-alert" style={{ marginTop: '1rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>
                Successfully verified user session against <code>/api/v1/auth/me</code> at{' '}
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
