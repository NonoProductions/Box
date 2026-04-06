export default function LogsSection({ logs }) {
  return (
    <div className="section-card">
      <div className="section-card-header">
        <span className="section-card-title">Protokoll</span>
        {logs.length > 0 && (
          <span style={{ fontSize: '0.65rem', color: 'var(--text-ghost)', fontWeight: 600 }}>
            {logs.length} Eintr.
          </span>
        )}
      </div>
      <div className="logs-container">
        {logs.length === 0 ? (
          <div className="empty-state" style={{ padding: '18px 0' }}>
            <p className="empty-state-text">Noch keine Aktivit&auml;t</p>
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} className={`log-entry ${log.type}`}>
              <div>{log.message}</div>
              <div className="log-time">{log.time}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
