import React from 'react';

/**
 * CitationCard displays evidence sources returned by the backend RAG pipeline.
 */
export const CitationCard = ({ citations = [] }) => {
  if (!citations || citations.length === 0) return null;

  const formatPage = (pageNumber, endPage) => {
    if (!pageNumber && !endPage) return null;
    if (pageNumber && endPage && pageNumber !== endPage) {
      return `Pages ${pageNumber}–${endPage}`;
    }
    return `Page ${pageNumber || endPage}`;
  };

  return (
    <div className="citations-container">
      <div className="citations-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <span>Sources & Citations ({citations.length})</span>
      </div>

      <div className="citations-grid">
        {citations.map((c, idx) => {
          const pageStr = formatPage(c.page_number, c.end_page);
          const tag = c.source_tag || `[Doc-${idx + 1}]`;

          return (
            <div key={c.chunk_id || idx} className="citation-card">
              <div className="citation-card-header">
                <span className="source-tag-pill">{tag}</span>
                <span className={`access-pill small ${c.access_level?.toLowerCase() || 'internal'}`}>
                  {c.access_level ? c.access_level.toUpperCase() : 'INTERNAL'}
                </span>
              </div>

              <div className="citation-filename" title={c.filename}>
                {c.filename || 'Document'}
              </div>

              <div className="citation-meta">
                {pageStr && <span className="citation-meta-item">{pageStr}</span>}
                {c.section && (
                  <span className="citation-meta-item" title={c.section}>
                    § {c.section}
                  </span>
                )}
                {c.department && (
                  <span className="dept-tag small">{c.department}</span>
                )}
                {c.relevance_score !== undefined && c.relevance_score !== null && (
                  <span className="score-tag">
                    Score: {typeof c.relevance_score === 'number' ? c.relevance_score.toFixed(3) : c.relevance_score}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CitationCard;

