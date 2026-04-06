const DAY_NAMES = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function parseDays(days) {
  if (Array.isArray(days)) return days
  if (typeof days === 'string') {
    try {
      const parsed = JSON.parse(days)
      return Array.isArray(parsed) ? parsed : []
    } catch { return [] }
  }
  return []
}

export default function ScheduleItem({ schedule, onEdit, onDelete, onToggle }) {
  const days = parseDays(schedule.days)

  return (
    <div className={`schedule-item ${schedule.active ? '' : 'inactive'}`}>
      <div className="schedule-item-top">
        <div>
          <div className="schedule-name-row">
            <span className="schedule-name">{schedule.name}</span>
            <span className={`schedule-badge ${schedule.active ? 'badge-active' : 'badge-inactive'}`}>
              {schedule.active ? 'Aktiv' : 'Aus'}
            </span>
          </div>
          <div className="schedule-time-display">{schedule.time}</div>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={schedule.active}
            onChange={e => onToggle(e.target.checked)}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      <div className="schedule-days-row">
        {DAY_NAMES.map((name, i) => (
          <span key={i} className={`schedule-day-dot ${days.includes(i) ? 'active-day' : ''}`}>
            {name}
          </span>
        ))}
      </div>

      <div className="schedule-item-bottom">
        <div className="schedule-meta">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span>{schedule.beeper_duration}s</span>
        </div>
        <div className="schedule-actions">
          <button className="btn-icon" onClick={onEdit} title="Bearbeiten">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button className="btn-icon btn-icon-danger" onClick={onDelete} title="L&#246;schen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
