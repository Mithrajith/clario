import React, { useState, useEffect } from 'react';

export const SecurityGatewayLoading = ({
  title = 'Connecting to Clario Security Gateway...',
  subtitle = 'Establishing isolated Zero-Trust enterprise session tunnel...',
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(15);

  const securitySteps = [
    { label: 'Initializing TLS 1.3 cryptographic handshake', detail: 'ECDSA 256-bit ephemeral key exchange' },
    { label: 'Validating identity token & credentials', detail: 'Neon PostgreSQL enterprise user directory' },
    { label: 'Enforcing RBAC policies & department partition', detail: 'Dynamic permission & access level resolution' },
    { label: 'Synchronizing hybrid vector space & grounded index', detail: 'Qdrant Cloud & BM25 retrieval pipeline' },
    { label: 'Gateway authorization complete — opening workspace', detail: 'Enterprise session established securely' },
  ];

  useEffect(() => {
    // Step progression animation timer
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < securitySteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 450);

    // Progress bar smooth ticker
    const progressInterval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 98) return 98;
        const next = prev + Math.floor(Math.random() * 12) + 6;
        return next > 98 ? 98 : next;
      });
    }, 180);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [securitySteps.length]);

  return (
    <div className="gateway-loading-screen" role="status" aria-live="polite">
      {/* Background Cyber Grid Lines */}
      <div className="gateway-grid-overlay" aria-hidden="true"></div>

      <div className="gateway-loading-card">
        {/* Futuristic Quantum Shield Animation */}
        <div className="gateway-radar-container">
          <div className="gateway-ring ring-outer"></div>
          <div className="gateway-ring ring-mid"></div>
          <div className="gateway-ring ring-inner"></div>
          <div className="gateway-radar-sweep"></div>
          
          <div className="gateway-core-emblem">
            <div className="brand-icon-box large gateway-logo">C</div>
          </div>
        </div>

        {/* Header Titles */}
        <div className="gateway-header-text">
          <div className="gateway-live-badge">
            <span className="gateway-pulse-dot"></span>
            <span>Zero-Trust Security Gateway</span>
          </div>
          <h2 className="gateway-main-title">{title}</h2>
          <p className="gateway-sub-title">{subtitle}</p>
        </div>

        {/* Animated Progress Meter */}
        <div className="gateway-progress-section">
          <div className="gateway-progress-track">
            <div
              className="gateway-progress-fill"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="gateway-progress-meta">
            <span className="gateway-meta-left">Gateway Authorization</span>
            <span className="gateway-meta-pct">{progressPercent}%</span>
          </div>
        </div>

        {/* Security Steps Checklist */}
        <div className="gateway-steps-list">
          {securitySteps.map((step, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.label}
                className={`gateway-step-item ${isDone ? 'done' : isCurrent ? 'active' : 'pending'}`}
              >
                <div className="step-indicator-icon">
                  {isDone ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : isCurrent ? (
                    <div className="step-mini-spinner"></div>
                  ) : (
                    <div className="step-dot"></div>
                  )}
                </div>

                <div className="step-text-group">
                  <span className="step-label">{step.label}</span>
                  <span className="step-detail">{step.detail}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security Assurance Badges Footer */}
        <div className="gateway-card-footer">
          <div className="gateway-compliance-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>AES-256 GCM</span>
          </div>
          <div className="gateway-compliance-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Neon DB &bull; Qdrant Cloud</span>
          </div>
          <div className="gateway-compliance-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Grounded RAG RBAC</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityGatewayLoading;
