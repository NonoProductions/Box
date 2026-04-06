import { useState, useEffect } from 'react'

const DAYS = [
  { value: 0, label: 'Mo' },
  { value: 1, label: 'Di' },
  { value: 2, label: 'Mi' },
  { value: 3, label: 'Do' },
  { value: 4, label: 'Fr' },
  { value: 5, label: 'Sa' },
  { value: 6, label: 'So' },
]

const DEFAULT_FORM = {
  name: '',
  time: '',
  days: [],
  beeper_duration: 5,
  active: true,
}

export default function ScheduleModal({ isOpen, onClose, schedule, onSave, onDelete }) {
  const [form, setForm] = useState(DEFAULT_FORM)

  useEffect(() => {
    if (!isOpen) return
    if (schedule) {
      setForm({
        name: schedule.name,
        time: schedule.time,
        days: Array.isArray(schedule.days) ? schedule.days : [],
        beeper_duration: schedule.beeper_duration,
        active: schedule.active,
      })
    } else {
      setForm(DEFAULT_FORM)
    }
  }, [isOpen, schedule])

  const toggleDay = (value) => {
    setForm(prev => ({
      ...prev,
      days: prev.days.includes(value)
        ? prev.days.filter(d => d !== value)
        : [...prev.days, value],
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (form.days.length === 0) {
      alert('Bitte mindestens einen Wochentag ausw\u00e4hlen')
      return
    }
    onSave({
      name: form.name.trim(),
      time: form.time,
      days: form.days,
      beeper_duration: parseInt(form.beeper_duration),
      active: form.active,
    })
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay active" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle">
          <div className="modal-handle-bar" />
        </div>
        <div className="modal-header">
          <h2>{schedule ? 'Wecker bearbeiten' : 'Neuer Wecker'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              className="form-input"
              type="text"
              required
              placeholder="z.B. Morgenroutine"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Uhrzeit</label>
            <input
              className="form-input"
              type="time"
              required
              value={form.time}
              onChange={e => setForm(prev => ({ ...prev, time: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Wochentage</label>
            <div className="day-selector">
              {DAYS.map(({ value, label }) => (
                <label key={value} className="day-chip">
                  <input
                    type="checkbox"
                    checked={form.days.includes(value)}
                    onChange={() => toggleDay(value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Beeper Dauer (Sekunden)</label>
            <input
              className="form-input"
              type="number"
              min="1"
              max="60"
              required
              value={form.beeper_duration}
              onChange={e => setForm(prev => ({ ...prev, beeper_duration: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={form.active}
                onChange={e => setForm(prev => ({ ...prev, active: e.target.checked }))}
              />
              Wecker aktiv
            </label>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="btn btn-primary">
              Speichern
            </button>
          </div>
          {schedule && (
            <div className="form-actions" style={{ marginTop: 10 }}>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => onDelete(schedule.id)}
              >
                Wecker l&ouml;schen
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
