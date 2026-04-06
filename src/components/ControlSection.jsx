export default function ControlSection({ onOpen, onClose, onTestBeeper, beeperOn, onToggleBeeper }) {
  return (
    <div className="section-card">
      <div className="section-card-header">
        <span className="section-card-title">Steuerung</span>
      </div>
      <div className="control-grid">
        <button className="control-btn control-btn-open" onClick={onOpen}>
          <span className="control-btn-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
            </svg>
          </span>
          <span className="control-btn-label">&Ouml;ffnen</span>
        </button>
        <button className="control-btn control-btn-close" onClick={onClose}>
          <span className="control-btn-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <span className="control-btn-label">Schlie&szlig;en</span>
        </button>
        <button className="control-btn control-btn-beeper" onClick={onTestBeeper}>
          <span className="control-btn-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </span>
          <span className="control-btn-label">Beeper Test</span>
        </button>
        <button
          className={`control-btn control-btn-toggle ${beeperOn ? 'beeper-on' : ''}`}
          onClick={onToggleBeeper}
        >
          <span className="control-btn-icon">
            {beeperOn ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </span>
          <span className="control-btn-label">Pipsen {beeperOn ? 'An' : 'Aus'}</span>
        </button>
      </div>
    </div>
  )
}
