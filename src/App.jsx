import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { config } from './config.js'

const SUPABASE_URL = config.supabase.url
const SUPABASE_ANON_KEY = config.supabase.anonKey
const isSupabaseConfigured =
  SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY'
const supabase = isSupabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null

const DAY_OPTIONS = [
  { value: 0, label: 'M', short: 'Mo' },
  { value: 1, label: 'D', short: 'Di' },
  { value: 2, label: 'M', short: 'Mi' },
  { value: 3, label: 'D', short: 'Do' },
  { value: 4, label: 'F', short: 'Fr' },
  { value: 5, label: 'S', short: 'Sa' },
  { value: 6, label: 'S', short: 'So' },
]

const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC86Gbww5-sX00xHohsJmErb-KhA2-EzA_l1JiLGysujKnzBoIzZi5WSubLBhyjgpuZqjke_2q_20qy6m0nEXM5H1KeicTwFazS2iFY7JFbUQLbYA8uxlGiwkUaT_3kBy1qLuoYNqPJ76WCcfvqRt7qvAhzFe3O5YNgRYJUQOyZv4QIHG36GzRRrdSb9xMqcSMaTEM5_5UtYIkPyBza_pvmASprmHtKXN7YrxZE4lOOxeVZDZk60SlcdijJAckIwCXAA3KUbL5hiBhZ'

const DEFAULT_DURATION = 20
const WHEEL_ITEM_HEIGHT = 72

function parseDays(days) {
  if (Array.isArray(days)) return days
  if (typeof days === 'string') {
    try {
      const parsed = JSON.parse(days)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function normalizeTime(value) {
  return String(value ?? '').slice(0, 5)
}

function getSuggestedTime() {
  const now = new Date()
  const next = new Date(now.getTime() + 60 * 60 * 1000)
  next.setSeconds(0, 0)
  if (next.getMinutes() < 30) {
    next.setMinutes(30)
  } else {
    next.setHours(next.getHours() + 1)
    next.setMinutes(0)
  }
  return `${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`
}

function createDefaultEditor() {
  return {
    time: getSuggestedTime(),
    days: [0, 1, 2, 3, 4],
    beeper_duration: DEFAULT_DURATION,
    active: true,
  }
}

function getRepeatLabel(daysInput) {
  const days = [...parseDays(daysInput)].sort((left, right) => left - right)
  if (!days.length) return 'Keine Tage'
  if (days.length === 7) return 'Täglich'
  if (days.join(',') === '0,1,2,3,4') return 'Wochentage'
  if (days.join(',') === '5,6') return 'Wochenende'
  return days.map(day => DAY_OPTIONS[day]?.short ?? '').join(', ')
}

function getScheduleName(schedule) {
  const label = schedule?.name?.trim()
  return label || getRepeatLabel(schedule?.days)
}

function isPersistedSchedule(schedule) {
  return Boolean(schedule?.id && schedule?.time)
}

function getNextOccurrence(schedule, from = new Date()) {
  const days = parseDays(schedule?.days)
  const time = normalizeTime(schedule?.time)

  if (!days.length || !time.includes(':')) return null

  const [hours, minutes] = time.split(':').map(Number)

  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = new Date(from)
    candidate.setHours(0, 0, 0, 0)
    candidate.setDate(candidate.getDate() + offset)

    const weekday = (candidate.getDay() + 6) % 7
    if (!days.includes(weekday)) continue

    candidate.setHours(hours, minutes, 0, 0)
    if (candidate > from) return candidate
  }

  return null
}

function AppShell({
  activeTab,
  setActiveTab,
  showWarning,
  nextAlarm,
  nextAlarmLabel,
  openEditor,
  quickAccess,
  toggleSchedule,
  now,
  schedules,
  boxStatus,
  sensorLabel,
  supabaseStatusText,
  supabaseStatus,
  esp32StatusText,
  esp32Status,
  connectionSuccess,
  sendCommand,
  beeperOn,
  toggleBeeperSwitch,
  logs,
  showInstallBtn,
  handleInstall,
  editorOpen,
  closeEditor,
  currentSchedule,
  handleEditorSave,
  hourWheelRef,
  handleWheelScroll,
  editorForm,
  minuteWheelRef,
  setEditorForm,
  deleteScheduleById,
  toast,
}) {
  return (
    <div className="lunar-app-shell">
      <div className="ambient-glow ambient-glow-left" />
      <div className="ambient-glow ambient-glow-right" />

      <div className="lunar-app">
        <main className="page-shell">
          {showWarning && (
            <section className="config-banner">
              <strong>Supabase fehlt noch.</strong>
              <p>Bitte trage URL und Anon Key in `config.js` ein.</p>
            </section>
          )}

          {activeTab === 'home' && (
            <section className="page page-home">
              <div className="headline-block">
                <h1>Guten Tag, Sandy</h1>
                <p>
                  {nextAlarm
                    ? `Dein nächster Wecker klingelt ${nextAlarmLabel.toLowerCase()}.`
                    : 'Noch ist kein Wecker aktiv.'}
                </p>
              </div>

              <button className="feature-card" onClick={() => (nextAlarm ? openEditor(nextAlarm.id) : openEditor())}>
                <img className="feature-card-image" src={HERO_IMAGE} alt="Morgenlicht" />
                <div className="feature-card-overlay" />
                <div className="feature-card-burst" />
                <div className="feature-card-content">
                  <span className="feature-chip">Nächster Alarm</span>
                  <strong>{nextAlarm ? normalizeTime(nextAlarm.time) : '--:--'}</strong>
                  <div className="feature-meta">
                    <span className="material-symbols-outlined">alarm_on</span>
                    <span>{nextAlarm ? getScheduleName(nextAlarm) : 'Neuen Wecker anlegen'}</span>
                  </div>
                </div>
              </button>

              <section className="section-block">
                <div className="section-heading">
                  <h2>Schnellzugriff</h2>
                  <button className="text-link" onClick={() => setActiveTab('alarms')}>
                    Alle ansehen
                  </button>
                </div>

                <div className="strip-list">
                  {quickAccess.map(schedule => (
                    <button
                      key={schedule.id}
                      className={`alarm-strip ${schedule.active ? 'is-active' : 'is-muted'}`}
                      onClick={() => openEditor(schedule.id)}
                    >
                      <div>
                        <strong>{normalizeTime(schedule.time)}</strong>
                        <span>{getScheduleName(schedule)}</span>
                      </div>
                      <Toggle
                        checked={schedule.active}
                        onChange={checked => toggleSchedule(schedule.id, checked)}
                        ariaLabel={`${getScheduleName(schedule)} umschalten`}
                      />
                    </button>
                  ))}

                  <button className="alarm-strip add-strip" onClick={() => openEditor()}>
                    <span className="material-symbols-outlined">add</span>
                    <span>Neuer Wecker</span>
                  </button>
                </div>
              </section>
            </section>
          )}

          {activeTab === 'alarms' && (
            <section className="page page-alarms">
              <div className="headline-block compact">
                <h1>Deine Wecker</h1>
                <p>Guten Morgen. Bereit für einen sanften Start in den Tag?</p>
              </div>

              <div className="alarm-card-list">
                {schedules.length === 0 && (
                  <div className="empty-panel">
                    <span className="material-symbols-outlined">alarm</span>
                    <strong>Noch keine Wecker</strong>
                    <p>Tippe auf das Plus, um deinen ersten Wecker zu erstellen.</p>
                  </div>
                )}

                {schedules.map(schedule => {
                  const nextOccurrence = getNextOccurrence(schedule, now)

                  return (
                    <button
                      key={schedule.id}
                      className={`alarm-card ${schedule.active ? 'is-active' : 'is-inactive'}`}
                      onClick={() => openEditor(schedule.id)}
                    >
                      <div className="alarm-card-main">
                        <strong>{normalizeTime(schedule.time)}</strong>
                        <div className="alarm-card-meta">
                          <span>{getRepeatLabel(schedule.days)}</span>
                          {schedule.active && nextOccurrence && (
                            <>
                              <span className="alarm-meta-dot" />
                              <em>{formatRemaining(nextOccurrence, now)}</em>
                            </>
                          )}
                        </div>
                      </div>
                      <Toggle
                        checked={schedule.active}
                        onChange={checked => toggleSchedule(schedule.id, checked)}
                        ariaLabel={`${getScheduleName(schedule)} umschalten`}
                      />
                    </button>
                  )
                })}

                <div className="quiet-card">
                  <div>
                    <h3>Ruhemodus</h3>
                    <p>Alle Benachrichtigungen sind bis zum ersten Wecker stummgeschaltet.</p>
                  </div>
                  <span className="material-symbols-outlined">dark_mode</span>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'device' && (
            <section className="page page-device">
              <div className="headline-block compact">
                <h1>Dein Gerät</h1>
                <p>Box-Steuerung, Live-Status und alles, was mit dem Controller verbunden ist.</p>
              </div>

              <section className="device-hero">
                <div>
                  <span className="eyebrow">Smart Alarm Controller</span>
                  <h2>{boxStatus.label}</h2>
                  <p>{sensorLabel}</p>
                </div>
                <div className="device-hero-icon">
                  <span className="material-symbols-outlined">devices</span>
                </div>
              </section>

              <div className="status-grid">
                <StatusChip label="Cloud" value={supabaseStatusText} tone={supabaseStatus} />
                <StatusChip label="ESP32" value={esp32StatusText} tone={esp32Status} />
                <StatusChip label="Box" value={boxStatus.label} tone={boxStatus.tone} />
              </div>

              <section className="device-section">
                <div className="section-heading">
                  <h2>Steuerung</h2>
                  <span>{connectionSuccess ? 'Live' : 'Offline'}</span>
                </div>

                <div className="control-grid">
                  <button className="control-card tone-open" onClick={() => sendCommand('open')}>
                    <span className="material-symbols-outlined">door_open</span>
                    <strong>Box öffnen</strong>
                  </button>
                  <button className="control-card tone-close" onClick={() => sendCommand('close')}>
                    <span className="material-symbols-outlined">lock</span>
                    <strong>Box schließen</strong>
                  </button>
                  <button className="control-card tone-bell" onClick={() => sendCommand('beeper')}>
                    <span className="material-symbols-outlined">notifications_active</span>
                    <strong>Beeper testen</strong>
                  </button>
                  <button className={`control-card tone-neutral ${beeperOn ? 'is-live' : ''}`} onClick={toggleBeeperSwitch}>
                    <span className="material-symbols-outlined">{beeperOn ? 'volume_up' : 'volume_off'}</span>
                    <strong>{beeperOn ? 'Beeper aktiv' : 'Beeper aus'}</strong>
                  </button>
                </div>
              </section>

              <section className="device-section">
                <div className="section-heading">
                  <h2>Aktivität</h2>
                  <span>{logs.length} Einträge</span>
                </div>

                <div className="log-list">
                  {logs.length === 0 && <div className="log-empty">Noch keine Aktionen protokolliert.</div>}

                  {logs.map(log => (
                    <div key={log.id} className={`log-entry ${log.type}`}>
                      <div className="log-copy">
                        <p>{log.message}</p>
                        <span>{log.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {showInstallBtn && (
                <button className="install-panel" onClick={handleInstall}>
                  <div>
                    <strong>Webapp installieren</strong>
                    <p>Die Lunar-Oberfläche als Startbildschirm-App speichern.</p>
                  </div>
                  <span className="material-symbols-outlined">download</span>
                </button>
              )}
            </section>
          )}
        </main>

        <nav className="bottom-nav">
          <BottomNavButton active={activeTab === 'home'} icon="home" label="Home" onClick={() => setActiveTab('home')} />
          <BottomNavButton active={activeTab === 'alarms'} icon="alarm" label="Wecker" onClick={() => setActiveTab('alarms')} />
          <BottomNavButton active={activeTab === 'device'} icon="devices" label="Gerät" onClick={() => setActiveTab('device')} />
        </nav>
      </div>

      {editorOpen && (
        <div className="editor-overlay" onClick={event => event.target === event.currentTarget && closeEditor()}>
          <section className="editor-sheet">
            <header className="editor-topbar">
              <button className="ghost-button" onClick={closeEditor} aria-label="Schließen">
                <span className="material-symbols-outlined">close</span>
              </button>
              <strong>{currentSchedule ? 'Wecker bearbeiten' : 'Neuer Wecker'}</strong>
              <button className="editor-save-link" form="alarm-editor-form" type="submit">
                Speichern
              </button>
            </header>

            <form id="alarm-editor-form" className="editor-content" onSubmit={handleEditorSave}>
              <section className="time-picker-block">
                <div className="time-wheel-shell">
                  <div className="time-wheel-focus" />
                  <div ref={hourWheelRef} className="time-wheel" onScroll={() => handleWheelScroll('hour')}>
                    {HOURS.map(hour => (
                      <div key={hour} className={`time-wheel-item ${normalizeTime(editorForm.time).startsWith(hour) ? 'is-selected' : ''}`}>
                        {hour}
                      </div>
                    ))}
                  </div>
                  <span className="time-colon">:</span>
                  <div ref={minuteWheelRef} className="time-wheel" onScroll={() => handleWheelScroll('minute')}>
                    {MINUTES.map(minute => (
                      <div key={minute} className={`time-wheel-item ${normalizeTime(editorForm.time).endsWith(minute) ? 'is-selected' : ''}`}>
                        {minute}
                      </div>
                    ))}
                  </div>
                </div>

                <p className="time-picker-hint">
                  {formatRemaining(
                    getNextOccurrence({ time: normalizeTime(editorForm.time), days: editorForm.days }, now),
                    now
                  )}
                </p>
              </section>

              <section className="editor-group">
                <h3>Wiederholen</h3>
                <div className="weekday-row">
                  {DAY_OPTIONS.map(day => {
                    const checked = editorForm.days.includes(day.value)

                    return (
                      <button
                        key={`${day.short}-${day.value}`}
                        type="button"
                        className={`weekday-pill ${checked ? 'is-active' : ''}`}
                        onClick={() =>
                          setEditorForm(previous => ({
                            ...previous,
                            days: checked
                              ? previous.days.filter(value => value !== day.value)
                              : [...previous.days, day.value].sort((left, right) => left - right),
                          }))
                        }
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="editor-group">
                <h3>Weckton</h3>
                <div className="setting-card">
                  <div className="setting-card-icon">
                    <span className="material-symbols-outlined">music_note</span>
                  </div>
                  <div className="setting-card-copy">
                    <strong>{getScheduleName(currentSchedule || editorForm)}</strong>
                    <span>Standardton</span>
                  </div>
                  <span className="material-symbols-outlined chevron">chevron_right</span>
                </div>
              </section>

              {currentSchedule && (
                <div className="delete-row">
                  <button
                    type="button"
                    className="delete-link"
                    onClick={event => {
                      event.preventDefault()
                      event.stopPropagation()
                      deleteScheduleById(currentSchedule.id, true)
                    }}
                  >
                    <span className="material-symbols-outlined">delete</span>
                    <span>Wecker löschen</span>
                  </button>
                </div>
              )}

              <footer className="editor-footer">
                <button type="button" className="footer-button secondary" onClick={closeEditor}>
                  Abbrechen
                </button>
                <button type="submit" className="footer-button primary">
                  Speichern
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      <div className={`toast ${toast.visible ? 'show' : ''} ${toast.type}`}>{toast.message}</div>
    </div>
  )
}

function formatRemaining(target, reference = new Date()) {
  if (!target) return 'Kein aktiver Wecker'

  const totalMinutes = Math.max(0, Math.round((target.getTime() - reference.getTime()) / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (totalMinutes <= 1) return 'Gleich'
  if (hours && minutes) return `In ${hours} Std. ${minutes} Min.`
  if (hours) return `In ${hours} Std.`
  return `In ${minutes} Min.`
}

function getNextAlarm(schedules, reference = new Date()) {
  const upcoming = schedules
    .filter(schedule => schedule.active)
    .map(schedule => ({ schedule, when: getNextOccurrence(schedule, reference) }))
    .filter(entry => entry.when)
    .sort((left, right) => left.when.getTime() - right.when.getTime())

  return upcoming[0] ?? null
}

function getBoxStatus(boxState) {
  if (!boxState) return { label: 'Unbekannt', tone: 'connecting' }
  return boxState.is_open
    ? { label: 'Offen', tone: 'warning' }
    : { label: 'Geschlossen', tone: 'connected' }
}

function Toggle({ checked, onChange, ariaLabel }) {
  return (
    <label className={`switch ${checked ? 'is-on' : ''}`} onClick={event => event.stopPropagation()} aria-label={ariaLabel}>
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
      <span className="switch-track" />
      <span className="switch-thumb" />
    </label>
  )
}

function StatusChip({ label, value, tone }) {
  return (
    <div className="status-chip">
      <span className={`status-dot ${tone}`} />
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  )
}

function BottomNavButton({ active, icon, label, onClick }) {
  return (
    <button className={`bottom-nav-button ${active ? 'is-active' : ''}`} onClick={onClick}>
      <span className="material-symbols-outlined">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

export default function App() {
  const [now, setNow] = useState(() => new Date())
  const [activeTab, setActiveTab] = useState('home')
  const [supabaseStatus, setSupabaseStatus] = useState('connecting')
  const [supabaseStatusText, setSupabaseStatusText] = useState('Verbinde...')
  const [connectionSuccess, setConnectionSuccess] = useState(false)
  const [boxState, setBoxState] = useState(null)
  const [esp32Status, setEsp32Status] = useState('connecting')
  const [esp32StatusText, setEsp32StatusText] = useState('Prüfe...')
  const [schedules, setSchedules] = useState([])
  const [logs, setLogs] = useState([])
  const [toast, setToast] = useState({ message: '', type: '', visible: false })
  const [showWarning, setShowWarning] = useState(false)
  const [showInstallBtn, setShowInstallBtn] = useState(false)
  const [beeperOn, setBeeperOn] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [currentScheduleId, setCurrentScheduleId] = useState(null)
  const [editorForm, setEditorForm] = useState(createDefaultEditor)

  const installPromptRef = useRef(null)
  const toastTimerRef = useRef(null)
  const hourWheelRef = useRef(null)
  const minuteWheelRef = useRef(null)
  const wheelTimerRef = useRef({})

  const addLog = useCallback((message, type = 'info') => {
    const time = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    setLogs(previous => [{ id: Date.now() + Math.random(), message, type, time }, ...previous].slice(0, 30))
  }, [])

  const showToast = useCallback((message, type = 'info') => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    setToast({ message, type, visible: true })
    toastTimerRef.current = window.setTimeout(() => {
      setToast(previous => ({ ...previous, visible: false }))
    }, 3200)
  }, [])

  const updateStatus = useCallback((status, text) => {
    setSupabaseStatus(status)
    setSupabaseStatusText(text)
    setConnectionSuccess(status === 'connected')
  }, [])

  const checkSupabaseConnection = useCallback(async () => {
    if (!isSupabaseConfigured) {
      updateStatus('disconnected', 'Nicht konfiguriert')
      setShowWarning(true)
      setSchedules([])
      addLog('Supabase ist noch nicht in config.js eingetragen.', 'error')
      return
    }

    setShowWarning(false)
    updateStatus('connecting', 'Verbinde...')

    try {
      const { error } = await supabase.from('schedules').select('id').limit(1)
      if (error) throw error

      updateStatus('connected', 'Verbunden')
      addLog('Verbindung zu Supabase steht.', 'success')
    } catch (error) {
      updateStatus('disconnected', 'Nicht verbunden')
      setSchedules([])
      addLog(`Supabase-Fehler: ${error.message}`, 'error')
      showToast(`Supabase-Fehler: ${error.message}`, 'error')
    }
  }, [addLog, showToast, updateStatus])

  const loadBoxState = useCallback(async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('box_state')
        .select('*')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      if (data) setBoxState(data)
    } catch {
      // keep current UI state
    }
  }, [])

  const loadSchedules = useCallback(async () => {
    if (!supabase) {
      setSchedules([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('id, name, time, days, beeper_duration, active, created_at')
        .order('time', { ascending: true })

      if (error) throw error

      setSchedules(
        (data || [])
          .filter(isPersistedSchedule)
          .map(schedule => ({
            ...schedule,
            time: normalizeTime(schedule.time),
            days: parseDays(schedule.days),
          }))
      )
    } catch (error) {
      setSchedules([])
      addLog(`Fehler beim Laden der Wecker: ${error.message}`, 'error')
      showToast(`Fehler beim Laden: ${error.message}`, 'error')
    }
  }, [addLog, showToast])

  const checkESP32Status = useCallback(async () => {
    if (!supabase) {
      setEsp32Status('disconnected')
      setEsp32StatusText('Nicht konfiguriert')
      return
    }

    try {
      const { data, error } = await supabase
        .from('box_state')
        .select('last_updated')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        setEsp32Status('disconnected')
        setEsp32StatusText('Fehler')
        return
      }

      if (!data?.last_updated) {
        setEsp32Status('disconnected')
        setEsp32StatusText('Keine Daten')
        return
      }

      const diffSeconds = (Date.now() - new Date(data.last_updated).getTime()) / 1000

      if (diffSeconds < 90) {
        setEsp32Status('connected')
        setEsp32StatusText(`Vor ${Math.floor(diffSeconds)} Sek.`)
      } else if (diffSeconds < 300) {
        setEsp32Status('warning')
        setEsp32StatusText(`Vor ${Math.floor(diffSeconds / 60)} Min.`)
      } else {
        setEsp32Status('disconnected')
        setEsp32StatusText(`Vor ${Math.floor(diffSeconds / 60)} Min.`)
      }
    } catch {
      setEsp32Status('disconnected')
      setEsp32StatusText('Fehler')
    }
  }, [])

  const sendCommand = useCallback(async (command, data = {}) => {
    if (!supabase) {
      showToast('Supabase ist nicht konfiguriert.', 'error')
      return
    }

    try {
      const { error } = await supabase.from('commands').insert([
        {
          command,
          data,
          timestamp: new Date().toISOString(),
          executed: false,
        },
      ])

      if (error) throw error

      const labels = {
        open: 'Box öffnen',
        close: 'Box schließen',
        beeper: 'Beeper testen',
        beeper_switch: 'Beeper umschalten',
        schedule_trigger: 'Wecker ausgelöst',
      }

      addLog(`Befehl gesendet: ${labels[command] || command}`, 'success')
    } catch (error) {
      addLog(`Befehl fehlgeschlagen: ${error.message}`, 'error')
      showToast(`Fehler beim Senden: ${error.message}`, 'error')
      throw error
    }
  }, [addLog, showToast])

  const toggleBeeperSwitch = useCallback(async () => {
    const next = !beeperOn
    setBeeperOn(next)

    try {
      await sendCommand('beeper_switch', { enabled: next })
    } catch {
      setBeeperOn(!next)
    }
  }, [beeperOn, sendCommand])

  const persistSchedule = useCallback(async (formData) => {
    if (!supabase) {
      showToast('Supabase ist nicht konfiguriert.', 'error')
      return
    }

    try {
      if (currentScheduleId) {
        const { error } = await supabase
          .from('schedules')
          .update(formData)
          .eq('id', currentScheduleId)
        if (error) throw error
        addLog(`Wecker aktualisiert: ${formData.name}`, 'success')
        showToast('Wecker gespeichert.', 'success')
      } else {
        const { error } = await supabase.from('schedules').insert([formData])
        if (error) throw error
        addLog(`Wecker erstellt: ${formData.name}`, 'success')
        showToast('Wecker erstellt.', 'success')
      }

      await loadSchedules()
      setEditorOpen(false)
      setCurrentScheduleId(null)
    } catch (error) {
      addLog(`Speichern fehlgeschlagen: ${error.message}`, 'error')
      showToast(`Fehler beim Speichern: ${error.message}`, 'error')
    }
  }, [addLog, currentScheduleId, loadSchedules, showToast])

  const deleteScheduleById = useCallback(async (scheduleId, skipConfirm = false) => {
    if (!scheduleId || !supabase) return
    if (!skipConfirm && !window.confirm('Diesen Wecker wirklich löschen?')) return

    try {
      const { data, error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId)
        .select('id')
      if (error) throw error
      if (!data?.length) throw new Error('Wecker wurde nicht gelöscht.')

      setSchedules(previous => previous.filter(schedule => schedule.id !== scheduleId))
      await loadSchedules()
      setEditorOpen(false)
      setCurrentScheduleId(null)
      addLog('Wecker gelöscht.', 'success')
      showToast('Wecker gelöscht.', 'success')
    } catch (error) {
      addLog(`Löschen fehlgeschlagen: ${error.message}`, 'error')
      showToast('Löschen fehlgeschlagen.', 'error')
    }
  }, [addLog, loadSchedules, showToast])

  const toggleSchedule = useCallback(async (scheduleId, isActive) => {
    if (!supabase) {
      showToast('Supabase ist nicht konfiguriert.', 'error')
      return
    }

    try {
      const { error } = await supabase
        .from('schedules')
        .update({ active: isActive })
        .eq('id', scheduleId)

      if (error) throw error

      setSchedules(previous =>
        previous.map(schedule =>
          schedule.id === scheduleId ? { ...schedule, active: isActive } : schedule
        )
      )

      const target = schedules.find(schedule => schedule.id === scheduleId)
      addLog(`${getScheduleName(target)} ${isActive ? 'aktiviert' : 'deaktiviert'}.`, 'success')
    } catch (error) {
      addLog(`Statuswechsel fehlgeschlagen: ${error.message}`, 'error')
      showToast('Status konnte nicht geändert werden.', 'error')
    }
  }, [addLog, schedules, showToast])

  const openEditor = useCallback((scheduleId = null) => {
    setCurrentScheduleId(scheduleId)
    setEditorOpen(true)
    setActiveTab('alarms')
  }, [])

  const closeEditor = useCallback(() => {
    setEditorOpen(false)
    setCurrentScheduleId(null)
  }, [])

  const updateEditorTimePart = useCallback((part, value) => {
    setEditorForm(previous => {
      const [hours = '07', minutes = '30'] = normalizeTime(previous.time).split(':')
      return {
        ...previous,
        time: part === 'hour' ? `${value}:${minutes}` : `${hours}:${value}`,
      }
    })
  }, [])

  const snapWheel = useCallback((part) => {
    const ref = part === 'hour' ? hourWheelRef : minuteWheelRef
    const options = part === 'hour' ? HOURS : MINUTES
    const container = ref.current
    if (!container) return

    const index = Math.max(0, Math.min(options.length - 1, Math.round(container.scrollTop / WHEEL_ITEM_HEIGHT)))
    container.scrollTo({ top: index * WHEEL_ITEM_HEIGHT, behavior: 'smooth' })
    updateEditorTimePart(part, options[index])
  }, [updateEditorTimePart])

  const handleWheelScroll = useCallback((part) => {
    if (wheelTimerRef.current[part]) window.clearTimeout(wheelTimerRef.current[part])
    wheelTimerRef.current[part] = window.setTimeout(() => snapWheel(part), 70)
  }, [snapWheel])

  const handleEditorSave = useCallback((event) => {
    event.preventDefault()

    if (!editorForm.days.length) {
      window.alert('Bitte mindestens einen Wochentag auswählen.')
      return
    }

    const existing = schedules.find(schedule => schedule.id === currentScheduleId)
    const generatedName = existing?.name?.trim() || getRepeatLabel(editorForm.days)

    persistSchedule({
      name: generatedName,
      time: normalizeTime(editorForm.time),
      days: editorForm.days,
      beeper_duration: Math.max(0, Number(editorForm.beeper_duration) || 0),
      active: existing?.active ?? true,
    })
  }, [currentScheduleId, editorForm, persistSchedule, schedules])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    checkSupabaseConnection().then(() => Promise.all([loadBoxState(), loadSchedules()]))
  }, [checkSupabaseConnection, loadBoxState, loadSchedules])

  useEffect(() => {
    if (!supabase) return undefined

    const boxChannel = supabase
      .channel('box-state')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'box_state' }, payload => {
        setBoxState(payload.new)
      })
      .subscribe()

    const commandChannel = supabase
      .channel('commands')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'commands' }, payload => {
        if (payload.new.executed) addLog(`Befehl ausgeführt: ${payload.new.command}`, 'success')
      })
      .subscribe()

    const scheduleChannel = supabase
      .channel('schedules')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => {
        loadSchedules()
      })
      .subscribe()

    return () => {
      boxChannel.unsubscribe()
      commandChannel.unsubscribe()
      scheduleChannel.unsubscribe()
    }
  }, [addLog, loadSchedules])

  useEffect(() => {
    const checkSchedules = () => {
      const reference = new Date()
      const currentTime = `${String(reference.getHours()).padStart(2, '0')}:${String(reference.getMinutes()).padStart(2, '0')}`
      const currentDay = (reference.getDay() + 6) % 7

      schedules.forEach(schedule => {
        if (!schedule.active) return
        if (!parseDays(schedule.days).includes(currentDay)) return
        if (normalizeTime(schedule.time) !== currentTime) return

        addLog(`Wecker ausgelöst: ${getScheduleName(schedule)}`, 'success')
        sendCommand('schedule_trigger', {
          schedule_id: schedule.id,
          beeper_duration: schedule.beeper_duration,
        })
      })
    }

    const interval = window.setInterval(checkSchedules, 60000)
    return () => window.clearInterval(interval)
  }, [addLog, schedules, sendCommand])

  useEffect(() => {
    checkESP32Status()
    const interval = window.setInterval(checkESP32Status, 15000)
    return () => window.clearInterval(interval)
  }, [checkESP32Status])

  useEffect(() => {
    const handler = event => {
      event.preventDefault()
      installPromptRef.current = event
      setShowInstallBtn(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    if (window.matchMedia('(display-mode: standalone)').matches) setShowInstallBtn(false)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    if (!editorOpen) return

    const current = schedules.find(schedule => schedule.id === currentScheduleId)
    setEditorForm(
      current
        ? {
            time: normalizeTime(current.time),
            days: parseDays(current.days),
            beeper_duration: Math.max(0, Number(current.beeper_duration) || 0),
            active: current.active,
          }
        : createDefaultEditor()
    )
  }, [currentScheduleId, editorOpen, schedules])

  useEffect(() => {
    if (!editorOpen) return

    const timer = window.setTimeout(() => {
      const [hours = '07', minutes = '30'] = normalizeTime(editorForm.time).split(':')
      const hourIndex = HOURS.indexOf(hours)
      const minuteIndex = MINUTES.indexOf(minutes)

      if (hourWheelRef.current && hourIndex >= 0) {
        hourWheelRef.current.scrollTo({ top: hourIndex * WHEEL_ITEM_HEIGHT, behavior: 'auto' })
      }

      if (minuteWheelRef.current && minuteIndex >= 0) {
        minuteWheelRef.current.scrollTo({ top: minuteIndex * WHEEL_ITEM_HEIGHT, behavior: 'auto' })
      }
    }, 30)

    return () => window.clearTimeout(timer)
  }, [currentScheduleId, editorForm.time, editorOpen])

  const handleInstall = async () => {
    if (!installPromptRef.current) return

    installPromptRef.current.prompt()
    const { outcome } = await installPromptRef.current.userChoice

    if (outcome === 'accepted') setShowInstallBtn(false)
    installPromptRef.current = null
  }

  const currentSchedule = schedules.find(schedule => schedule.id === currentScheduleId) ?? null
  const nextAlarmEntry = getNextAlarm(schedules, now)
  const nextAlarm = nextAlarmEntry?.schedule ?? null
  const nextAlarmLabel = nextAlarmEntry
    ? formatRemaining(nextAlarmEntry.when, now)
    : 'Lege deinen ersten Wecker an.'
  const quickAccess = schedules.slice(0, 2)
  const boxStatus = getBoxStatus(boxState)
  const sensorLabel =
    boxState?.sensor_distance == null ? 'Kein Sensorwert' : `${boxState.sensor_distance} cm Abstand`

  return (
    <AppShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      showWarning={showWarning}
      nextAlarm={nextAlarm}
      nextAlarmLabel={nextAlarmLabel}
      openEditor={openEditor}
      quickAccess={quickAccess}
      toggleSchedule={toggleSchedule}
      now={now}
      schedules={schedules}
      boxStatus={boxStatus}
      sensorLabel={sensorLabel}
      supabaseStatusText={supabaseStatusText}
      supabaseStatus={supabaseStatus}
      esp32StatusText={esp32StatusText}
      esp32Status={esp32Status}
      connectionSuccess={connectionSuccess}
      sendCommand={sendCommand}
      beeperOn={beeperOn}
      toggleBeeperSwitch={toggleBeeperSwitch}
      logs={logs}
      showInstallBtn={showInstallBtn}
      handleInstall={handleInstall}
      editorOpen={editorOpen}
      closeEditor={closeEditor}
      currentSchedule={currentSchedule}
      handleEditorSave={handleEditorSave}
      hourWheelRef={hourWheelRef}
      handleWheelScroll={handleWheelScroll}
      editorForm={editorForm}
      minuteWheelRef={minuteWheelRef}
      setEditorForm={setEditorForm}
      deleteScheduleById={deleteScheduleById}
      toast={toast}
    />
  )
}
