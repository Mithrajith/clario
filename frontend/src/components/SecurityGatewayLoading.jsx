import React from 'react';

export const SecurityGatewayLoading = () => {
  return (
    <div className="gateway-loading-screen" role="status" aria-live="polite">
      <div className="gateway-grid-overlay" aria-hidden="true"></div>

      <div className="gateway-minimal-card">
        {/* Sleek Pulse Loader */}
        <div className="gateway-radar-container">
          <div className="gateway-ring ring-outer"></div>
          <div className="gateway-ring ring-mid"></div>
          <div className="gateway-ring ring-inner"></div>
          <div className="gateway-radar-sweep"></div>
          
          <div className="gateway-core-emblem">
            <div className="brand-icon-box large gateway-logo">C</div>
          </div>
        </div>

        {/* Minimal Subtle Loading Indicator */}
        <div className="gateway-minimal-footer">
          <div className="minimal-spinner-dots">
            <span className="dot dot-1"></span>
            <span className="dot dot-2"></span>
            <span className="dot dot-3"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityGatewayLoading;
