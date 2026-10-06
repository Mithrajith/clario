import React from 'react';

/**
 * ChunkViewer displays either individual chunk items (when provided)
 * or detailed chunk metadata/readiness state when the backend provides chunk_count.
 */
export const ChunkViewer = ({ chunkCount = 0, chunks = null, status = 'UPLOADED' }) => {
  const isReady = status?.toUpperCase() === 'READY';
  const isProcessing = status?.toUpperCase() === 'PROCESSING';
  const isUploaded = status?.toUpperCase() === 'UPLOADED';
  const isFailed = status?.toUpperCase() === 'FAILED';

  // If the backend provides full chunk records (or when future chunk endpoint is added)
  if (chunks && Array.isArray(chunks) && chunks.length > 0) {
    return (
      <div className="chunk-viewer-container">
        <div className="chunk-viewer-header">
          <div className="chunk-count-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <span>{chunks.length} Extracted Vector Chunks</span>
          </div>
        </div>

        <div className="chunk-list">
          {chunks.map((chunk, idx) => (
            <div key={chunk.id || idx} className="chunk-card">
              <div className="chunk-card-meta">
                <span className="chunk-index-tag">
                  Chunk #{chunk.chunk_index !== undefined ? chunk.chunk_index + 1 : idx + 1}
                </span>
                <span className="chunk-page-tag">Page: {chunk.page_number || '1'}</span>
                <span className="chunk-section-tag">Section: {chunk.section || 'General'}</span>
              </div>
              <div className="chunk-content-preview">
                <pre>{chunk.content}</pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // When backend provides chunk_count in DocumentDetailRead (current backend state)
  return (
    <div className="chunk-viewer-container">
      <div className="chunk-meta-card">
        <div className="chunk-stat-row">
          <div className="chunk-stat-item">
            <span className="stat-label">Indexed Chunks</span>
            <span className="stat-value purple">{isReady ? chunkCount : 0}</span>
          </div>
          <div className="chunk-stat-item">
            <span className="stat-label">Vector Collection</span>
            <span className="code-badge">clario_documents</span>
          </div>
          <div className="chunk-stat-item">
            <span className="stat-label">Embedding Spec</span>
            <span className="code-badge">384-dim &bull; Cosine</span>
          </div>
        </div>

        {isReady && chunkCount > 0 && (
          <div className="chunk-notice ready">
            <div className="notice-icon-box emerald">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="notice-content">
              <strong>{chunkCount} Atomic Chunks Embedded & Indexed</strong>
              <p>
                Document text was chunked into 500-token segments with 75-token overlap, embedded with <code>BAAI/bge-small-en-v1.5</code>, and stored in Qdrant Cloud with BM25 hybrid ranking.
              </p>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="chunk-notice processing">
            <div className="notice-icon-box amber">
              <span className="badge-spinner"></span>
            </div>
            <div className="notice-content">
              <strong>Asynchronous Ingestion Pipeline Active</strong>
              <p>Extracting text structure, computing token boundaries, and dispatching vector embeddings to Qdrant Cloud...</p>
            </div>
          </div>
        )}

        {isUploaded && (
          <div className="chunk-notice idle">
            <div className="notice-icon-box blue">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="notice-content">
              <strong>Pending Ingestion Processing</strong>
              <p>
                Source document is stored safely. Click <strong>[Process & Embed Now]</strong> above to chunk and generate embeddings for semantic retrieval.
              </p>
            </div>
          </div>
        )}

        {isFailed && (
          <div className="chunk-notice error">
            <div className="notice-icon-box red">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="notice-content">
              <strong>Chunk Extraction Failed</strong>
              <p>An error occurred during text extraction or vector embedding. Check the file format or retry ingestion.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChunkViewer;
