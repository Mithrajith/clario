import React, { useState } from 'react';

/**
 * Human-friendly labels and styling for Phase 10 FaithfulnessStatus values.
 */
const STATUS_CONFIG = {
  verified_faithful: {
    label: 'Verified against provided sources',
    pillClass: 'success',
    icon: '✓',
    description: 'All atomic claims are grounded and entailed by the retrieved documentation.',
  },
  partially_supported: {
    label: 'Partially supported',
    pillClass: 'warning',
    icon: '▲',
    description: 'Some claims are supported by the documentation, while others have insufficient evidence.',
  },
  contradicted: {
    label: 'Contradicting evidence found',
    pillClass: 'error',
    icon: '✕',
    description: 'Retrieved context contains evidence that directly contradicts one or more claims.',
  },
  unsupported: {
    label: 'Not sufficiently supported',
    pillClass: 'error',
    icon: '✕',
    description: 'None of the extracted claims could be confirmed by the retrieved context.',
  },
  insufficient_evidence: {
    label: 'Insufficient evidence',
    pillClass: 'neutral',
    icon: '○',
    description: 'No authorized source documentation was available to verify claims.',
  },
  incomplete_verification: {
    label: 'Verification incomplete',
    pillClass: 'warning',
    icon: '⚠',
    description: 'Evaluation was truncated by the maximum pair cap before all evidence could be evaluated.',
  },
  no_claims_found: {
    label: 'No factual claims detected',
    pillClass: 'neutral',
    icon: 'ℹ',
    description: 'No verifiable factual assertions were extracted from the answer.',
  },
  verification_failed: {
    label: 'Verification unavailable',
    pillClass: 'neutral',
    icon: '!',
    description: 'The verification service encountered an operational error or timeout.',
  },
};

const CLAIM_LABEL_CONFIG = {
  supported: { label: 'Supported', badgeClass: 'claim-supported', icon: '✓' },
  contradicted: { label: 'Contradicted', badgeClass: 'claim-contradicted', icon: '✕' },
  insufficient: { label: 'Insufficient Evidence', badgeClass: 'claim-insufficient', icon: '⚠' },
  unverified: { label: 'Unverified (Pair Cap)', badgeClass: 'claim-unverified', icon: '○' },
};

export const VerificationBadge = ({ verification }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!verification) return null;

  const rawStatus = verification.status || 'verification_failed';
  const config = STATUS_CONFIG[rawStatus] || STATUS_CONFIG.verification_failed;
  const claims = Array.isArray(verification.claims) ? verification.claims : [];
  const score = verification.faithfulness_score;

  return (
    <div className="verification-container" data-status={rawStatus}>
      <div className="verification-summary-bar">
        <div className="verification-status-group">
          <span className={`status-pill ${config.pillClass}`}>
            <span className="status-pill-icon">{config.icon}</span>
            <span>{config.label}</span>
          </span>

          {score !== null && score !== undefined && (
            <span className="faithfulness-score-badge" title="Faithfulness Score (ratio of supported claims)">
              Faithfulness: <strong>{Math.round(score * 100)}%</strong>
            </span>
          )}

          {verification.total_claims > 0 && (
            <span className="claims-count-badge">
              {verification.supported_claims}/{verification.total_claims} claims supported
            </span>
          )}
        </div>

        {claims.length > 0 && (
          <button
            type="button"
            className="btn-toggle-claims"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            id="btn-toggle-claims"
          >
            <span>{isExpanded ? 'Hide Grounding Details' : `Grounding Details (${claims.length})`}</span>
            <svg
              className={`chevron-icon ${isExpanded ? 'rotated' : ''}`}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}
      </div>

      <div className="verification-subtext">
        <small>{config.description} <em>(Based on retrieved documentation)</em></small>
      </div>

      {/* Expandable Atomic Claims Breakdown */}
      {isExpanded && claims.length > 0 && (
        <div className="claims-breakdown-list">
          <div className="claims-list-header">
            <span>Atomic Claim Evaluation</span>
            {verification.pair_cap_reached && (
              <span className="tag-warning">Pair cap reached</span>
            )}
          </div>

          {claims.map((claim, idx) => {
            const labelKey = claim.label?.toLowerCase() || 'insufficient';
            const labelCfg = CLAIM_LABEL_CONFIG[labelKey] || CLAIM_LABEL_CONFIG.insufficient;

            return (
              <div key={claim.claim_id || idx} className={`claim-card ${labelKey}`}>
                <div className="claim-card-top">
                  <span className="claim-index">Claim #{idx + 1}</span>
                  <span className={`claim-badge ${labelCfg.badgeClass}`}>
                    <span className="claim-badge-icon">{labelCfg.icon}</span>
                    <span>{labelCfg.label}</span>
                  </span>
                </div>

                <p className="claim-text">"{claim.claim_text}"</p>

                <div className="claim-meta-row">
                  {claim.entailment_score > 0 && (
                    <span className="claim-stat">
                      Entailment: <strong>{claim.entailment_score}</strong>
                    </span>
                  )}
                  {claim.contradiction_score > 0 && (
                    <span className="claim-stat danger">
                      Contradiction: <strong>{claim.contradiction_score}</strong>
                    </span>
                  )}
                  {claim.cited_chunk_ids && claim.cited_chunk_ids.length > 0 && (
                    <span className="claim-stat">
                      Linked Chunks: <strong>{claim.cited_chunk_ids.length}</strong>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VerificationBadge;

