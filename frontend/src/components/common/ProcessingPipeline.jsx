import React from 'react';
import { usePipeline } from '../../context/PipelineContext';

export const ProcessingPipeline = () => {
  const {
    tasks,
    activeTasksCount,
    isPipelineDrawerOpen,
    setIsPipelineDrawerOpen,
    clearCompletedTasks,
    processAllDocuments,
  } = usePipeline();

  if (!isPipelineDrawerOpen) return null;

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="drawer-backdrop" onClick={() => setIsPipelineDrawerOpen(false)}>
      <aside
        className="drawer-container pipeline-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Realtime Processing Pipeline"
      >
        <div className="drawer-header">
          <div className="drawer-title-box">
            <div className="modal-header-icon-box amber">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div>
              <h2 className="drawer-title">Realtime Processing Pipeline</h2>
              <span className="drawer-subtitle">
                {activeTasksCount > 0 ? (
                  <span style={{ color: '#fbbf24' }}>
                    ● {activeTasksCount} background process{activeTasksCount === 1 ? '' : 'es'} active
                  </span>
                ) : (
                  <span style={{ color: '#34d399' }}>● Pipeline Idle & Synced</span>
                )}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={() => setIsPipelineDrawerOpen(false)}
            aria-label="Close pipeline drawer"
          >
            &times;
          </button>
        </div>

        <div className="drawer-body" style={{ padding: '1rem 1.25rem' }}>
          {/* Quick Actions Bar */}
          <div className="pipeline-actions-bar" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              type="button"
              className="btn-primary small"
              onClick={processAllDocuments}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>Process All Documents</span>
            </button>

            {tasks.some((t) => t.status === 'READY' || t.status === 'FAILED') && (
              <button
                type="button"
                className="btn-secondary small"
                onClick={clearCompletedTasks}
              >
                Clear Finished
              </button>
            )}
          </div>

          {/* Task Stream List */}
          {tasks.length === 0 ? (
            <div className="table-empty-state" style={{ padding: '2.5rem 1rem' }}>
              <div className="empty-state-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3 className="empty-state-title" style={{ fontSize: '0.95rem' }}>No Active Pipeline Tasks</h3>
              <p className="empty-state-desc" style={{ fontSize: '0.8rem' }}>
                Asynchronous document embeddings, vector indexing, and RAG chat tasks run in the background with unique Process IDs.
              </p>
            </div>
          ) : (
            <div className="pipeline-tasks-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tasks.map((task) => {
                const isProcessing = task.status === 'PROCESSING' || task.status === 'QUEUED';
                const isReady = task.status === 'READY';
                const isFailed = task.status === 'FAILED';

                return (
                  <div
                    key={task.processId || task.id}
                    className={`pipeline-task-card ${task.status.toLowerCase()}`}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: isProcessing
                        ? '1px solid rgba(245, 158, 11, 0.4)'
                        : isReady
                        ? '1px solid rgba(16, 185, 129, 0.3)'
                        : '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      padding: '0.85rem 1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span className="code-badge" style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                        {task.processId}
                      </span>
                      <span
                        className={`status-pill small ${
                          isProcessing ? 'processing-status' : isReady ? 'ready-status' : 'failed-status'
                        }`}
                        style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}
                      >
                        {isProcessing && <span className="badge-spinner" style={{ width: '8px', height: '8px' }}></span>}
                        <span>{task.status}</span>
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {task.name}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span>Started: {formatTime(task.startedAt)}</span>
                      {task.completedAt && <span>Finished: {formatTime(task.completedAt)}</span>}
                    </div>

                    {task.error && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#f87171' }}>
                        Error: {task.error}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="drawer-footer">
          <button
            type="button"
            className="btn-secondary full-width"
            onClick={() => setIsPipelineDrawerOpen(false)}
          >
            Close Pipeline Drawer
          </button>
        </div>
      </aside>
    </div>
  );
};

export default ProcessingPipeline;

