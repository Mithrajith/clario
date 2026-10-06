import React from 'react';
import { useAuth } from '../../context/AuthContext';

export const AppLayout = ({ currentView = 'chat', onViewChange, children }) => {
  const { user, logout } = useAuth();

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const userRoles = user?.roles
    ? user.roles.map((r) => (typeof r === 'object' ? r.name : r))
    : ['user'];

  const primaryRole = userRoles[0] || 'user';
  const isAdmin = userRoles.includes('admin');
  const isAnalyst = userRoles.includes('analyst');

  const roleLabels = {
    admin: { label: 'Admin', pillClass: 'admin', desc: 'Full System & Governance Management' },
    analyst: { label: 'Analyst', pillClass: 'analyst', desc: 'Cross-Department Analytics & Verification' },
    user: { label: 'User', pillClass: 'user', desc: 'Department-Grounded Knowledge Access' },
  };

  const roleInfo = roleLabels[primaryRole.toLowerCase()] || roleLabels.user;

  const navigateTo = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

  return (
    <div className="app-container">
      {/* Enterprise Top Navigation Bar */}
      <header className="app-header">
        <div className="header-left">
          <a
            href="#chat"
            className="brand-logo"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('chat');
            }}
          >
            <div className="brand-icon-box">C</div>
            <span className="brand-title">Clario</span>
          </a>
          <span className="brand-subtitle">Enterprise Knowledge Platform</span>
        </div>

        <div className="header-right">
          <div className="system-status-indicator" title="Connected to Enterprise Knowledge Cloud">
            <span className="pulse-dot"></span>
            <span>Cloud Connected</span>
          </div>

          <div
            className="user-profile-badge"
            onClick={() => navigateTo('profile')}
            style={{ cursor: 'pointer' }}
            title="View Account Profile"
            id="header-user-profile-btn"
          >
            <div className="avatar-circle">{userInitials}</div>
            <div className="user-info-text">
              <span className="user-display-name">{user?.name || 'Authorized User'}</span>
              <span className="user-display-dept">
                {user?.department || 'Engineering'} &bull; {roleInfo.label}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="btn-logout"
            id="btn-logout"
            title="Terminate session and sign out"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Enterprise Workspace */}
      <div className="workspace-body">
        {/* Navigation Sidebar */}
        <aside className="workspace-sidebar">
          <div className="sidebar-nav-sections">
            {/* Knowledge Section */}
            <div className="sidebar-group-title">Knowledge</div>
            <ul className="sidebar-menu">
              <li
                className={`sidebar-item ${currentView === 'chat' ? 'active' : ''}`}
                onClick={() => navigateTo('chat')}
                id="nav-chat"
              >
                <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Chat</span>
              </li>

              <li
                className={`sidebar-item ${currentView === 'search' ? 'active' : ''}`}
                onClick={() => navigateTo('search')}
                id="nav-search"
              >
                <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>Search</span>
              </li>
            </ul>

            {/* Documents Section */}
            <div className="sidebar-group-title">Documents</div>
            <ul className="sidebar-menu">
              <li
                className={`sidebar-item ${currentView === 'documents' ? 'active' : ''}`}
                onClick={() => navigateTo('documents')}
                id="nav-documents"
              >
                <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span>Documents</span>
              </li>
            </ul>

            {/* Activity Section (Admin & Analyst) */}
            {(isAdmin || isAnalyst) && (
              <>
                <div className="sidebar-group-title">Activity</div>
                <ul className="sidebar-menu">
                  <li
                    className={`sidebar-item ${currentView === 'audit-logs' ? 'active' : ''}`}
                    onClick={() => navigateTo('audit-logs')}
                    id="nav-audit-logs"
                  >
                    <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <span>Audit Logs</span>
                  </li>
                </ul>
              </>
            )}

            {/* Administration Section (Admin only) */}
            {isAdmin && (
              <>
                <div className="sidebar-group-title">Administration</div>
                <ul className="sidebar-menu">
                  <li
                    className={`sidebar-item ${currentView === 'users' ? 'active' : ''}`}
                    onClick={() => navigateTo('users')}
                    id="nav-users"
                  >
                    <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>Users</span>
                  </li>

                  <li
                    className={`sidebar-item ${currentView === 'roles' ? 'active' : ''}`}
                    onClick={() => navigateTo('roles')}
                    id="nav-roles"
                  >
                    <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>Roles / Access</span>
                  </li>

                  <li
                    className={`sidebar-item ${currentView === 'dashboard' ? 'active' : ''}`}
                    onClick={() => navigateTo('dashboard')}
                    id="nav-dashboard"
                  >
                    <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                      <line x1="6" y1="6" x2="6.01" y2="6" />
                      <line x1="6" y1="18" x2="6.01" y2="18" />
                    </svg>
                    <span>Diagnostics</span>
                  </li>
                </ul>
              </>
            )}

            {/* Settings Section */}
            <div className="sidebar-group-title">Settings</div>
            <ul className="sidebar-menu">
              <li
                className={`sidebar-item ${currentView === 'profile' ? 'active' : ''}`}
                onClick={() => navigateTo('profile')}
                id="nav-profile"
              >
                <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Profile</span>
              </li>
            </ul>
          </div>

          {/* User Profile Area in Sidebar */}
          <div className="sidebar-user-footer">
            <div className="sidebar-user-card" onClick={() => navigateTo('profile')}>
              <div className="avatar-circle small">{userInitials}</div>
              <div className="sidebar-user-text">
                <span className="sidebar-user-name">{user?.name || 'User'}</span>
                <span className="sidebar-user-meta">
                  {user?.department || 'Engineering'} &bull; <span className={`role-badge-text ${primaryRole}`}>{primaryRole.toUpperCase()}</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn-sidebar-logout"
              onClick={logout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="workspace-content">{children}</main>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <div>Clario Enterprise Knowledge Intelligence &bull; Active Role: {primaryRole.toUpperCase()}</div>
        <div>Neon PostgreSQL &bull; Qdrant Cloud &bull; Groq LLM &bull; DeBERTa-v3</div>
      </footer>
    </div>
  );
};

export default AppLayout;
