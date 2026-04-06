import { useState, useEffect } from 'react'

export default function Header({ showInstallBtn, onInstall }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const hours = time.getHours() % 12
  const minutes = time.getMinutes()
  const hourAngle = hours * 30 + minutes * 0.5
  const minAngle = minutes * 6

  return (
    <header className="app-header">
      <div className="header-brand">
        <div
          className="header-clock"
          style={{
            '--hour-angle': `${hourAngle}deg`,
            '--min-angle': `${minAngle}deg`,
          }}
        >
          <div className="header-clock-hand header-clock-hand--h" />
          <div className="header-clock-hand header-clock-hand--m" />
        </div>
        <div className="header-text">
          <h1>Smart Box</h1>
          <span>Wecker-Steuerung</span>
        </div>
      </div>
      {showInstallBtn && (
        <button className="install-btn" onClick={onInstall}>
          Installieren
        </button>
      )}
    </header>
  )
}
