import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { config } from './config.js';

// Supabase Configuration from config.js
const SUPABASE_URL = config.supabase.url;
const SUPABASE_ANON_KEY = config.supabase.anonKey;

// Check if Supabase is configured
const isSupabaseConfigured = SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';

// Initialize Supabase
let supabase = null;
if (isSupabaseConfigured) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.warn('Supabase nicht konfiguriert! Bitte URL und Key in config.js eintragen.');
}

// App State
let currentScheduleId = null;
let schedules = [];
let realtimeSubscription = null;

// DOM Elements
const elements = {
    installBtn: document.getElementById('installBtn'),
    statusIndicator: document.getElementById('statusIndicator'),
    statusText: document.getElementById('statusText'),
    statusDot: document.querySelector('.status-dot'),
    connectionSuccess: document.getElementById('connectionSuccess'),
    boxState: document.getElementById('boxState'),
    addScheduleBtn: document.getElementById('addScheduleBtn'),
    scheduleList: document.getElementById('scheduleList'),
    scheduleModal: document.getElementById('scheduleModal'),
    scheduleForm: document.getElementById('scheduleForm'),
    closeModal: document.getElementById('closeModal'),
    cancelBtn: document.getElementById('cancelBtn'),
    deleteBtn: document.getElementById('deleteBtn'),
    modalTitle: document.getElementById('modalTitle'),
    openBoxBtn: document.getElementById('openBoxBtn'),
    closeBoxBtn: document.getElementById('closeBoxBtn'),
    testBeeperBtn: document.getElementById('testBeeperBtn'),
    logsContainer: document.getElementById('logsContainer'),
    toast: document.getElementById('toast'),
    supabaseWarning: document.getElementById('supabaseWarning')
};

// Initialize App
async function init() {
    setupEventListeners();
    await checkSupabaseConnection();
    await loadBoxState();
    await loadSchedules();
    setupRealtime();
    setupPWA();
    checkSchedules();
    setInterval(checkSchedules, 60000); // Check every minute
}

// Event Listeners
function setupEventListeners() {
    elements.addScheduleBtn.addEventListener('click', () => openScheduleModal());
    elements.closeModal.addEventListener('click', closeScheduleModal);
    elements.cancelBtn.addEventListener('click', closeScheduleModal);
    elements.scheduleForm.addEventListener('submit', handleScheduleSubmit);
    elements.deleteBtn.addEventListener('click', handleDeleteSchedule);
    elements.openBoxBtn.addEventListener('click', () => sendCommand('open'));
    elements.closeBoxBtn.addEventListener('click', () => sendCommand('close'));
    elements.testBeeperBtn.addEventListener('click', () => sendCommand('beeper'));
    
    // Close modal on outside click
    elements.scheduleModal.addEventListener('click', (e) => {
        if (e.target === elements.scheduleModal) {
            closeScheduleModal();
        }
    });
}

// Check Supabase Connection
async function checkSupabaseConnection() {
    if (!isSupabaseConfigured) {
        updateStatus('disconnected', 'Nicht konfiguriert');
        if (elements.supabaseWarning) {
            elements.supabaseWarning.style.display = 'block';
        }
        showToast('Supabase nicht konfiguriert! Bitte in config.js einrichten.', 'error');
        addLog('Supabase nicht konfiguriert - bitte URL und Key in config.js eintragen', 'error');
        return;
    }
    
    if (elements.supabaseWarning) {
        elements.supabaseWarning.style.display = 'none';
    }
    
    // Show connecting state
    updateStatus('connecting', 'Verbinde...');
    
    try {
        const { data, error } = await supabase.from('schedules').select('count').limit(1);
        if (error) throw error;
        
        // Successfully connected
        updateStatus('connected', 'Verbunden');
        showToast('Erfolgreich mit Supabase verbunden!', 'success');
        addLog('Erfolgreich mit Supabase verbunden', 'success');
    } catch (error) {
        console.error('Supabase connection error:', error);
        updateStatus('disconnected', 'Nicht verbunden');
        showToast('Fehler bei Supabase-Verbindung: ' + error.message, 'error');
        addLog('Supabase-Verbindungsfehler: ' + error.message, 'error');
    }
}

// Update Status
function updateStatus(status, text) {
    elements.statusText.textContent = text;
    elements.statusDot.className = 'status-dot ' + status;
    
    // Show/hide success message
    if (status === 'connected' && elements.connectionSuccess) {
        elements.connectionSuccess.style.display = 'flex';
    } else if (elements.connectionSuccess) {
        elements.connectionSuccess.style.display = 'none';
    }
}

// Load Schedules
async function loadSchedules() {
    if (!isSupabaseConfigured || !supabase) {
        schedules = [];
        renderSchedules();
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('schedules')
            .select('*')
            .order('time', { ascending: true });

        if (error) throw error;
        
        schedules = data || [];
        renderSchedules();
    } catch (error) {
        console.error('Error loading schedules:', error);
        showToast('Fehler beim Laden der Zeitpläne: ' + error.message, 'error');
        addLog('Fehler beim Laden: ' + error.message, 'error');
    }
}

// Render Schedules
function renderSchedules() {
    if (schedules.length === 0) {
        let message = 'Keine Zeitpläne vorhanden';
        let hint = 'Klicken Sie auf "Neuer Zeitplan" um einen zu erstellen';
        
        if (!isSupabaseConfigured) {
            message = 'Supabase nicht konfiguriert';
            hint = 'Bitte Supabase URL und Key in app.js eintragen';
        }
        
        elements.scheduleList.innerHTML = `
            <div class="empty-state">
                <p>${message}</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem; color: var(--text-light);">${hint}</p>
            </div>
        `;
        return;
    }

    elements.scheduleList.innerHTML = schedules.map(schedule => {
        const days = JSON.parse(schedule.days || '[]');
        const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
        const activeDays = days.map(d => dayNames[d]).join(', ');
        
        return `
            <div class="schedule-item">
                <div class="schedule-info">
                    <div class="schedule-name">
                        ${schedule.name}
                        <span class="schedule-badge ${schedule.active ? 'badge-active' : 'badge-inactive'}">
                            ${schedule.active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                    </div>
                    <div class="schedule-details">
                        ${schedule.time} | ${activeDays || 'Keine Tage'} | Beeper: ${schedule.beeper_duration}s
                    </div>
                </div>
                <div class="schedule-actions">
                    <label class="toggle-switch" title="${schedule.active ? 'Deaktivieren' : 'Aktivieren'}">
                        <input type="checkbox" ${schedule.active ? 'checked' : ''} onchange="toggleSchedule('${schedule.id}', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <button class="btn-icon" onclick="editSchedule('${schedule.id}')" title="Bearbeiten">
                        ✏️
                    </button>
                    <button class="btn-icon" onclick="deleteSchedule('${schedule.id}')" title="Löschen">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Open Schedule Modal
function openScheduleModal(scheduleId = null) {
    currentScheduleId = scheduleId;
    const schedule = scheduleId ? schedules.find(s => s.id === scheduleId) : null;
    
    if (schedule) {
        elements.modalTitle.textContent = 'Zeitplan bearbeiten';
        document.getElementById('scheduleName').value = schedule.name;
        document.getElementById('scheduleTime').value = schedule.time;
        document.getElementById('beeperDuration').value = schedule.beeper_duration;
        document.getElementById('scheduleActive').checked = schedule.active;
        
        const days = JSON.parse(schedule.days || '[]');
        document.querySelectorAll('input[name="days"]').forEach(checkbox => {
            checkbox.checked = days.includes(parseInt(checkbox.value));
        });
        
        elements.deleteBtn.style.display = 'inline-block';
    } else {
        elements.modalTitle.textContent = 'Neuer Zeitplan';
        elements.scheduleForm.reset();
        document.getElementById('scheduleActive').checked = true;
        elements.deleteBtn.style.display = 'none';
    }
    
    elements.scheduleModal.classList.add('active');
}

// Close Schedule Modal
function closeScheduleModal() {
    elements.scheduleModal.classList.remove('active');
    currentScheduleId = null;
    elements.scheduleForm.reset();
}

// Handle Schedule Submit
async function handleScheduleSubmit(e) {
    e.preventDefault();
    
    // Validate Supabase configuration
    if (!isSupabaseConfigured || !supabase) {
        showToast('Supabase nicht konfiguriert! Bitte in config.js einrichten.', 'error');
        addLog('Speichern fehlgeschlagen: Supabase nicht konfiguriert', 'error');
        return;
    }
    
    // Validate form data
    const selectedDays = Array.from(document.querySelectorAll('input[name="days"]:checked'));
    if (selectedDays.length === 0) {
        showToast('Bitte mindestens einen Wochentag auswählen', 'error');
        return;
    }
    
    const formData = {
        name: document.getElementById('scheduleName').value.trim(),
        time: document.getElementById('scheduleTime').value,
        beeper_duration: parseInt(document.getElementById('beeperDuration').value),
        active: document.getElementById('scheduleActive').checked,
        days: JSON.stringify(
            selectedDays.map(cb => parseInt(cb.value))
        )
    };
    
    // Validate name
    if (!formData.name) {
        showToast('Bitte geben Sie einen Namen ein', 'error');
        return;
    }
    
    try {
        if (currentScheduleId) {
            const { data, error } = await supabase
                .from('schedules')
                .update(formData)
                .eq('id', currentScheduleId)
                .select();
            
            if (error) throw error;
            showToast('Zeitplan aktualisiert', 'success');
            addLog(`Zeitplan "${formData.name}" aktualisiert`, 'success');
        } else {
            const { data, error } = await supabase
                .from('schedules')
                .insert([formData])
                .select();
            
            if (error) throw error;
            showToast('Zeitplan erstellt', 'success');
            addLog(`Zeitplan "${formData.name}" erstellt`, 'success');
        }
        
        await loadSchedules();
        closeScheduleModal();
    } catch (error) {
        console.error('Error saving schedule:', error);
        const errorMessage = error.message || 'Unbekannter Fehler';
        showToast('Fehler beim Speichern: ' + errorMessage, 'error');
        addLog('Speicherfehler: ' + errorMessage, 'error');
        
        // Show detailed error in console for debugging
        if (error.details) {
            console.error('Error details:', error.details);
        }
        if (error.hint) {
            console.error('Error hint:', error.hint);
        }
    }
}

// Delete Schedule
async function handleDeleteSchedule() {
    if (!currentScheduleId) return;
    
    if (!confirm('Möchten Sie diesen Zeitplan wirklich löschen?')) return;
    
    try {
        const { error } = await supabase
            .from('schedules')
            .delete()
            .eq('id', currentScheduleId);
        
        if (error) throw error;
        
        showToast('Zeitplan gelöscht', 'success');
        await loadSchedules();
        closeScheduleModal();
    } catch (error) {
        console.error('Error deleting schedule:', error);
        showToast('Fehler beim Löschen', 'error');
    }
}

// Toggle Schedule Active Status
async function toggleSchedule(scheduleId, isActive) {
    if (!isSupabaseConfigured || !supabase) {
        showToast('Supabase nicht konfiguriert!', 'error');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('schedules')
            .update({ active: isActive })
            .eq('id', scheduleId);
        
        if (error) throw error;
        
        // Update local schedule data
        const schedule = schedules.find(s => s.id === scheduleId);
        if (schedule) {
            schedule.active = isActive;
        }
        
        showToast(`Zeitplan ${isActive ? 'aktiviert' : 'deaktiviert'}`, 'success');
        addLog(`Zeitplan "${schedule?.name || scheduleId}" ${isActive ? 'aktiviert' : 'deaktiviert'}`, 'success');
        
        // Re-render to update UI
        renderSchedules();
    } catch (error) {
        console.error('Error toggling schedule:', error);
        showToast('Fehler beim Ändern des Status', 'error');
        addLog(`Fehler beim ${isActive ? 'Aktivieren' : 'Deaktivieren'}: ${error.message}`, 'error');
        
        // Re-render to revert UI state
        renderSchedules();
    }
}

// Global functions for inline handlers
window.editSchedule = openScheduleModal;
window.deleteSchedule = handleDeleteSchedule;
window.toggleSchedule = toggleSchedule;

// Check Schedules
function checkSchedules() {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1; // Convert Sunday (0) to 6
    
    schedules.forEach(schedule => {
        if (!schedule.active) return;
        
        const scheduleDays = JSON.parse(schedule.days || '[]');
        if (!scheduleDays.includes(currentDay)) return;
        
        if (schedule.time === currentTime) {
            triggerSchedule(schedule);
        }
    });
}

// Trigger Schedule
async function triggerSchedule(schedule) {
    addLog(`Zeitplan "${schedule.name}" ausgelöst - Beeper aktiviert`, 'success');
    
    // Send command to ESP32 via Supabase
    await sendCommand('schedule_trigger', {
        schedule_id: schedule.id,
        beeper_duration: schedule.beeper_duration
    });
}

// Send Command to ESP32
async function sendCommand(command, data = {}) {
    if (!isSupabaseConfigured || !supabase) {
        showToast('Supabase nicht konfiguriert!', 'error');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('commands')
            .insert([{
                command: command,
                data: data,
                timestamp: new Date().toISOString(),
                executed: false
            }]);
        
        if (error) throw error;
        
        const commandNames = {
            'open': 'Box öffnen',
            'close': 'Box schließen',
            'beeper': 'Beeper testen',
            'schedule_trigger': 'Zeitplan ausgelöst'
        };
        
        addLog(`Befehl gesendet: ${commandNames[command] || command}`, 'success');
    } catch (error) {
        console.error('Error sending command:', error);
        showToast('Fehler beim Senden des Befehls: ' + error.message, 'error');
        addLog(`Fehler: ${error.message}`, 'error');
    }
}

// Setup Realtime
function setupRealtime() {
    if (!isSupabaseConfigured || !supabase) {
        return;
    }
    
    try {
        // Listen for box state changes
        realtimeSubscription = supabase
            .channel('box-state')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'box_state' },
                (payload) => {
                    updateBoxState(payload.new);
                }
            )
            .subscribe();
        
        // Listen for command responses
        supabase
            .channel('commands')
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'commands' },
                (payload) => {
                    if (payload.new.executed) {
                        addLog(`Befehl ausgeführt: ${payload.new.command}`, 'success');
                    }
                }
            )
            .subscribe();
    } catch (error) {
        console.error('Error setting up realtime:', error);
    }
}

// Update Box State
function updateBoxState(state) {
    if (state) {
        elements.boxState.textContent = state.is_open ? 'Geöffnet' : 'Geschlossen';
        elements.boxState.className = state.is_open ? 'open' : 'closed';
    }
}

// Load initial box state
async function loadBoxState() {
    if (!isSupabaseConfigured || !supabase) return;
    
    try {
        const { data, error } = await supabase
            .from('box_state')
            .select('*')
            .order('last_updated', { ascending: false })
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        
        if (data) {
            updateBoxState(data);
        }
    } catch (error) {
        console.error('Error loading box state:', error);
    }
}

// Add Log
function addLog(message, type = 'info') {
    const time = new Date().toLocaleTimeString('de-DE');
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.innerHTML = `
        <div>${message}</div>
        <div class="log-time">${time}</div>
    `;
    
    elements.logsContainer.insertBefore(logEntry, elements.logsContainer.firstChild);
    
    // Keep only last 50 logs
    while (elements.logsContainer.children.length > 50) {
        elements.logsContainer.removeChild(elements.logsContainer.lastChild);
    }
}

// Show Toast
function showToast(message, type = 'info') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// PWA Setup
function setupPWA() {
    // Install button
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        elements.installBtn.style.display = 'block';
    });
    
    elements.installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            elements.installBtn.style.display = 'none';
        }
        
        deferredPrompt = null;
    });
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        elements.installBtn.style.display = 'none';
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

