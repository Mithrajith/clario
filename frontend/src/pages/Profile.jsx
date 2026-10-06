import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

export const Profile = () => {
  const { user, token, logout } = useAuth();
  const [verifyStatus, setVerifyStatus] = useState({
    loading: false,
    data: null,
    error: null,
  });

  const userRoles = user?.roles
    ? user.roles.map((r) => (typeof r === 'object' ? r.name : r))
    : ['user'];

  const primaryRole = userRoles[0] || 'user';

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const verifySession = async () => {
    setVerifyStatus({ loading: true, data: null, error: null });
    try {
      const data = await apiClient.getMe();
      setVerifyStatus({ loading: false, data, error: null });
    } catch (err) {
      setVerifyStatus({
        loading: false,
        data: null,
        error: err.message || 'Session verification failed.',
      });
    }
  };

  return (
    <div className="profile-page-container">
      {/* Top Breadcrumb */}
      <div className="documents-top-bar">
        <div className="breadcrumb">
          <span>Enterprise Account</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-active">User Profile</span>
        </div>

        <div className="rbac-session-indicator">
          <span className="rbac-dot"></span>
          <span className="rbac-text">
            Active Session &bull;{' '}
            <span className={`role-badge-text ${primaryRole}`}>{primaryRole.toUpperCase()}</span>
          </span>
        </div>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div className="title-with-icon">
          <div className="title-icon-box" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <h1 className="page-title">User Account & Security Profile</h1>
            <p className="page-description">
              Authenticated enterprise credentials, department boundary partition, and role authorizations.
            </p>
          </div>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="profile-hero-card">
        <div className="profile-hero-left">
          <div className="profile-avatar-large">{userInitials}</div>
          <div className="profile-hero-details">
            <h2 className="profile-user-name">{user?.name || 'Enterprise User'}</h2>
            <span className="profile-user-email">{user?.email || '—'}</span>
            <div className="profile-hero-tags">
              <span className="dept-tag">
                <span className="dept-tag-dot"></span>
                <span>{user?.department || 'Engineering'}</span>
              </span>
              <span className={`role-pill ${primaryRole}`}>
                {primaryRole.toUpperCase()} ROLE
              </span>
            </div>
          </div>
        </div>

        <div className="profile-hero-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={verifySession}
            id="btn-verify-session"
            disabled={verifyStatus.loading}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>{verifyStatus.loading ? 'Verifying...' : 'Verify Session Token'}</span>
          </button>

          <button
            type="button"
            className="btn-danger-outline"
            onClick={logout}
            id="btn-profile-logout"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Verification Feedback */}
      {verifyStatus.data && (
        <div className="auth-alert" style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', marginBottom: '1.25rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>
            Identity verified against backend <code>GET /api/v1/auth/me</code> at {new Date().toLocaleTimeString()}
          </span>
        </div>
      )}

      {verifyStatus.error && (
        <div className="auth-alert error" role="alert" style={{ marginBottom: '1.25rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{verifyStatus.error}</span>
        </div>
      )}

      {/* Identity Specifications Grid */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Identity Claims & Context</span>
          </div>
        </div>

        <div className="panel-body">
          <table className="data-table" id="profile-details-table">
            <thead>
              <tr>
                <th>Attribute / Claim</th>
                <th>Value</th>
                <th>Security Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>User Principal ID (Subject)</strong></td>
                <td><span className="code-badge">{user?.id || '—'}</span></td>
                <td>Immutable UUIDv4 Security Principal</td>
              </tr>
              <tr>
                <td><strong>Full Name</strong></td>
                <td>{user?.name || '—'}</td>
                <td>Enterprise User Identity</td>
              </tr>
              <tr>
                <td><strong>Corporate Email</strong></td>
                <td>{user?.email || '—'}</td>
                <td>Primary Authentication Principal</td>
              </tr>
              <tr>
                <td><strong>Department Partition</strong></td>
                <td>
                  <span className="dept-tag">
                    <span className="dept-tag-dot"></span>
                    <span>{user?.department || 'Unassigned'}</span>
                  </span>
                </td>
                <td>Strict Department Access Isolation Boundary</td>
              </tr>
              <tr>
                <td><strong>Role Memberships</strong></td>
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
                    {token ? `${token.slice(0, 24)}...${token.slice(-12)}` : 'Active Session'}
                  </span>
                </td>
                <td>HMAC-SHA256 Token with auto-injected Bearer Header</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions & Security Boundaries */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Authorized Operations for User Role</span>
          </div>
        </div>

        <div className="panel-body">
          <div className="permissions-grid">
            <div className="permission-item">
              <span className="permission-check">✓</span>
              <div>
                <strong>Knowledge Chat & Multi-Turn Conversations</strong>
                <p>Query authorized enterprise knowledge with automatic grounding, citations, and verification.</p>
              </div>
            </div>

            <div className="permission-item">
              <span className="permission-check">✓</span>
              <div>
                <strong>Hybrid Vector & Keyword Search</strong>
                <p>Retrieve candidate chunks across Qdrant and BM25 with neural cross-encoder reranking.</p>
              </div>
            </div>

            <div className="permission-item">
              <span className="permission-check">✓</span>
              <div>
                <strong>Authorized Document Repository Access</strong>
                <p>View corporate documents tagged for Public or {user?.department || 'Engineering'} access.</p>
              </div>
            </div>

            <div className="permission-item">
              <span className="permission-check">✓</span>
              <div>
                <strong>Isolated Conversation Session Ownership</strong>
                <p>Create, inspect, and delete personal multi-turn conversations without cross-user leakage.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

