import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

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

const ROLES = ['user', 'analyst', 'admin'];

export const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);

  // Edit User State
  const [editingUser, setEditingUser] = useState(null);
  const [editRole, setEditRole] = useState('user');
  const [editDept, setEditDept] = useState('Engineering');
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiClient.getUsers({ limit: 100 });
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve user accounts from backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleOpenEdit = (user) => {
    const currentRole = user.roles?.[0]?.name || 'user';
    setEditingUser(user);
    setEditRole(currentRole);
    setEditDept(user.department || 'Engineering');
    setEditIsActive(user.is_active);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSaving(true);
    try {
      const updated = await apiClient.updateUser(editingUser.id, {
        role: editRole,
        department: editDept,
        is_active: editIsActive,
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );
      showNotification(`Updated role for ${updated.name || updated.email} to ${editRole.toUpperCase()}.`);
      setEditingUser(null);
    } catch (err) {
      setError(err.message || 'Failed to update user role and status.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="users-page-container">
      {/* Top Breadcrumb */}
      <div className="documents-top-bar">
        <div className="breadcrumb">
          <span>Administration</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-active">Users & Directory</span>
        </div>

        <div className="rbac-session-indicator">
          <span className="rbac-dot"></span>
          <span className="rbac-text">
            Admin Directory Control &bull; <strong>{currentUser?.email}</strong>
          </span>
        </div>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div className="title-with-icon">
          <div className="title-icon-box" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h1 className="page-title">Enterprise User Management</h1>
            <p className="page-description">
              Inspect active corporate principals, configure department boundaries, and adjust RBAC role assignments.
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`toast-notification ${notification.type}`} role="status">
          <span>{notification.message}</span>
        </div>
      )}

      {error && (
        <div className="auth-alert error" role="alert" style={{ marginBottom: '1.25rem' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Users Table Panel */}
      <div className="panel document-table-panel">
        <div className="panel-header">
          <div className="panel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Managed Enterprise Accounts</span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={loadUsers}
            disabled={isLoading}
            id="btn-refresh-users"
          >
            Refresh Users
          </button>
        </div>

        <div className="panel-body" style={{ padding: 0 }}>
          <div className="table-responsive-wrapper">
            <table className="data-table enterprise-table" id="users-management-table">
              <thead>
                <tr>
                  <th>User / Name</th>
                  <th>Corporate Email</th>
                  <th>Department</th>
                  <th>Assigned Role</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && users.length === 0 ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="skeleton-row">
                      <td><div className="skeleton-line" style={{ width: '120px', height: '14px' }}></div></td>
                      <td><div className="skeleton-line" style={{ width: '160px', height: '14px' }}></div></td>
                      <td><div className="skeleton-line" style={{ width: '90px', height: '14px' }}></div></td>
                      <td><div className="skeleton-line" style={{ width: '80px', height: '18px' }}></div></td>
                      <td><div className="skeleton-line" style={{ width: '70px', height: '14px' }}></div></td>
                      <td><div className="skeleton-line" style={{ width: '90px', height: '24px', marginLeft: 'auto' }}></div></td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="table-empty-state">
                        <h3 className="empty-state-title">No Users Found</h3>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const primaryRoleName = u.roles?.[0]?.name || 'user';
                    return (
                      <tr key={u.id} className="document-table-row">
                        <td>
                          <strong>{u.name || 'Enterprise User'}</strong>
                        </td>
                        <td>
                          <span className="font-mono">{u.email}</span>
                        </td>
                        <td>
                          <span className="dept-tag">
                            <span className="dept-tag-dot"></span>
                            <span>{u.department || 'General'}</span>
                          </span>
                        </td>
                        <td>
                          <span className={`role-pill ${primaryRoleName}`}>
                            {primaryRoleName.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${u.is_active ? 'ready-status' : 'failed-status'}`}>
                            {u.is_active ? 'ACTIVE' : 'SUSPENDED'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn-table-action"
                            onClick={() => handleOpenEdit(u)}
                            id={`btn-edit-user-${u.id}`}
                          >
                            Edit Role / Access
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-backdrop" onClick={() => !isSaving && setEditingUser(null)}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-title-box">
                <h3 className="modal-title">Edit User Access & Role</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => !isSaving && setEditingUser(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="modal-body">
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Principal Email</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingUser.email}
                  disabled
                />
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-user-role">
                    Assigned RBAC Role
                  </label>
                  <select
                    id="edit-user-role"
                    className="form-select"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    disabled={isSaving}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-user-dept">
                    Department Partition
                  </label>
                  <select
                    id="edit-user-dept"
                    className="form-select"
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                    disabled={isSaving}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    disabled={isSaving}
                  />
                  <span>Account Active & Permitted to Authenticate</span>
                </label>
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingUser(null)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  id="btn-save-user-access"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving Changes...' : 'Save Role & Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;

