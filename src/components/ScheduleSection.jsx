import ScheduleItem from './ScheduleItem.jsx'

export default function ScheduleSection({ schedules, isConfigured, onAdd, onEdit, onDelete, onToggle }) {
  return (
    <div className="section-card">
      <div className="section-card-header">
        <span className="section-card-title">Wecker</span>
        <button className="btn-add" onClick={onAdd} title="Neuer Wecker">+</button>
      </div>
      <div className="schedule-list">
        {schedules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                <circle cx="12" cy="13" r="8" />
                <path d="M12 9v4l2 2" />
                <path d="M5 3 2 6" />
                <path d="M22 6l-3-3" />
                <path d="M6.38 18.7 4 21" />
                <path d="M17.64 18.67 20 21" />
              </svg>
            </div>
            <p className="empty-state-title">
              {isConfigured ? 'Keine Wecker eingestellt' : 'Nicht verbunden'}
            </p>
            <p className="empty-state-text">
              {isConfigured
                ? 'Tippe + um deinen ersten Wecker zu erstellen'
                : 'Supabase in config.js einrichten'}
            </p>
          </div>
        ) : (
          schedules.map(schedule => (
            <ScheduleItem
              key={schedule.id}
              schedule={schedule}
              onEdit={() => onEdit(schedule.id)}
              onDelete={() => onDelete(schedule.id)}
              onToggle={checked => onToggle(schedule.id, checked)}
            />
          ))
        )}
      </div>
    </div>
  )
}
