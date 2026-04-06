export default function StatusCard({
  supabaseStatus,
  supabaseStatusText,
  connectionSuccess,
  boxState,
  esp32Status,
  esp32StatusText,
}) {
  const boxLabel = boxState == null ? '...' : boxState.is_open ? 'Offen' : 'Geschlossen'
  const boxRing = boxState?.is_open ? 'connected' : boxState ? 'warning' : 'connecting'

  return (
    <div className="status-row">
      <div className="status-pill">
        <div className={`status-ring ${supabaseStatus}`}>
          {supabaseStatus === 'connected' ? '\u2713' : supabaseStatus === 'connecting' ? '\u2026' : '!'}
        </div>
        <span className="status-pill-label">Cloud</span>
        <span className="status-pill-value">{supabaseStatusText}</span>
      </div>

      <div className="status-pill">
        <div className={`status-ring ${esp32Status}`}>
          {esp32Status === 'connected' ? '\u2713' : esp32Status === 'warning' ? '!' : '\u2717'}
        </div>
        <span className="status-pill-label">ESP32</span>
        <span className="status-pill-value">{esp32StatusText}</span>
      </div>

      <div className="status-pill">
        <div className={`status-ring ${boxRing}`}>
          {boxState == null ? '?' : boxState.is_open ? '\u25CB' : '\u25CF'}
        </div>
        <span className="status-pill-label">Box</span>
        <span className="status-pill-value">{boxLabel}</span>
      </div>
    </div>
  )
}
