import { useState, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  Save,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Download,
  Copy,
  ExternalLink,
  Lock,
  Unlock,
  Eye,
  Settings,
  Sparkles,
  CalendarCheck,
  X,
} from "lucide-react";
import {
  DayId,
  DaySchedule,
  ModalityType,
  SiteScheduleConfig,
  TimeRange,
} from "../types/schedule";
import {
  downloadIcsFile,
  getGoogleCalendarAppointmentSettingsUrl,
  isGoogleCalendarUrl,
} from "../utils/googleCalendar";
import { ScheduleViewer } from "./ScheduleViewer";

interface AdminModalProps {
  isOpen: boolean;
  initialConfig: SiteScheduleConfig;
  onSaveConfig: (
    updated: SiteScheduleConfig,
    pin?: string,
    newPin?: string,
  ) => Promise<{ success: boolean; message?: string }>;
  onClose: () => void;
}

const PIN_STORAGE_KEY = "abigail-admin-pin";
const DEFAULT_PIN = "5630";

export function AdminPanel({
  isOpen,
  initialConfig,
  onSaveConfig,
  onClose,
}: AdminModalProps) {
  // Authentication state
  const storedPin = localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");

  // Change PIN modal state
  const [showChangePin, setShowChangePin] = useState<boolean>(false);
  const [newPin, setNewPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [pinChangeMsg, setPinChangeMsg] = useState<string>("");

  // Active form data
  const [config, setConfig] = useState<SiteScheduleConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<
    "horarios" | "calendar" | "consultorio" | "preview"
  >("horarios");

  // Save status feedback
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: "success" | "error" | "";
    message: string;
  }>({ type: "", message: "" });

  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Sync internal config if initialConfig changes
  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  // Lock background scroll when modal is open and handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showChangePin) {
          setShowChangePin(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, showChangePin, onClose]);

  if (!isOpen) return null;

  // Authentication submit handler
  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pinInput.trim() === storedPin.trim()) {
      setIsAuthenticated(true);
      setPinError("");
    } else {
      setPinError("PIN incorrecto. El PIN predeterminado es 5630.");
    }
  }

  // Change PIN handler
  async function handleChangePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPin.length < 4) {
      setPinChangeMsg("El PIN debe tener al menos 4 caracteres.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinChangeMsg("Los PINs no coinciden.");
      return;
    }
    const currentPin = localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;
    localStorage.setItem(PIN_STORAGE_KEY, newPin);
    await onSaveConfig(config, currentPin, newPin);
    setPinChangeMsg("¡PIN actualizado con éxito!");
    setTimeout(() => {
      setShowChangePin(false);
      setPinChangeMsg("");
      setNewPin("");
      setConfirmPin("");
    }, 1200);
  }

  // Schedule mutation helpers
  function toggleDayActive(dayId: DayId) {
    setConfig((prev) => {
      const nextDays = prev.days.map((d) => {
        if (d.dayId === dayId) {
          const nextActive = !d.active;
          const defaultRanges =
            nextActive && d.ranges.length === 0
              ? [{ start: "09:00", end: "14:00" }]
              : d.ranges;
          return { ...d, active: nextActive, ranges: defaultRanges };
        }
        return d;
      });
      return { ...prev, days: nextDays };
    });
  }

  function setDayModality(dayId: DayId, modality: ModalityType) {
    setConfig((prev) => ({
      ...prev,
      days: prev.days.map((d) => (d.dayId === dayId ? { ...d, modality } : d)),
    }));
  }

  function addTimeRange(dayId: DayId) {
    setConfig((prev) => ({
      ...prev,
      days: prev.days.map((d) => {
        if (d.dayId === dayId) {
          const lastRange = d.ranges[d.ranges.length - 1];
          const newStart = lastRange ? lastRange.end : "16:00";
          return {
            ...d,
            ranges: [...d.ranges, { start: newStart, end: "20:00" }],
          };
        }
        return d;
      }),
    }));
  }

  function removeTimeRange(dayId: DayId, index: number) {
    setConfig((prev) => ({
      ...prev,
      days: prev.days.map((d) => {
        if (d.dayId === dayId) {
          const newRanges = d.ranges.filter((_, idx) => idx !== index);
          return { ...d, ranges: newRanges };
        }
        return d;
      }),
    }));
  }

  function updateTimeRange(
    dayId: DayId,
    index: number,
    field: "start" | "end",
    value: string,
  ) {
    setConfig((prev) => ({
      ...prev,
      days: prev.days.map((d) => {
        if (d.dayId === dayId) {
          const updatedRanges = d.ranges.map((r, idx) =>
            idx === index ? { ...r, [field]: value } : r,
          );
          return { ...d, ranges: updatedRanges };
        }
        return d;
      }),
    }));
  }

  // Presets application
  function applyPreset(presetType: "standard" | "split" | "weekdays_sat") {
    setConfig((prev) => {
      const nextDays: DaySchedule[] = prev.days.map((day) => {
        if (presetType === "standard") {
          if (day.dayId === "sabado" || day.dayId === "domingo") {
            return { ...day, active: false, ranges: [] };
          }
          return {
            ...day,
            active: true,
            ranges: [{ start: "09:00", end: "18:00" }],
            modality: "ambas",
          };
        }

        if (presetType === "split") {
          if (day.dayId === "domingo") {
            return { ...day, active: false, ranges: [] };
          }
          if (day.dayId === "sabado") {
            return {
              ...day,
              active: true,
              ranges: [{ start: "09:00", end: "14:00" }],
              modality: "ambas",
            };
          }
          return {
            ...day,
            active: true,
            ranges: [
              { start: "09:00", end: "14:00" },
              { start: "16:00", end: "20:00" },
            ],
            modality: "ambas",
          };
        }

        if (presetType === "weekdays_sat") {
          if (day.dayId === "domingo") {
            return { ...day, active: false, ranges: [] };
          }
          return {
            ...day,
            active: true,
            ranges: [{ start: "09:00", end: "15:00" }],
            modality: "ambas",
          };
        }

        return day;
      });

      return { ...prev, days: nextDays };
    });
  }

  // Main Save handler
  async function handleSave() {
    setIsSaving(true);
    setSaveStatus({ type: "", message: "" });
    try {
      const updatedConfig: SiteScheduleConfig = {
        ...config,
        lastModified: new Date().toISOString(),
      };
      const activePin = localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;
      const result = await onSaveConfig(updatedConfig, activePin);
      if (result.success) {
        setSaveStatus({
          type: "success",
          message:
            result.message ||
            "¡Horarios y estado guardados en la nube! Visibles de inmediato para todos los visitantes.",
        });
      } else {
        setSaveStatus({
          type: "error",
          message: result.message || "No se pudo guardar.",
        });
      }
    } catch (err: any) {
      setSaveStatus({
        type: "error",
        message: err.message || "Error al conectar con el servidor.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  // Copy JSON to clipboard
  function handleCopyJson() {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  }

  // Download JSON file
  function handleDownloadJson() {
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scheduleData.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div
      className="admin-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
    >
      <div className="admin-modal-window">
        {/* ENCABEZADO DEL MODAL */}
        <header className="admin-modal-header">
          <div className="admin-modal-title-group">
            <span className="admin-logo-circle">AS</span>
            <div>
              <h2 id="admin-modal-title">Panel de Administrador</h2>
              <p>Gestión de Horarios, Días de Semana y Google Calendar</p>
            </div>
          </div>

          <div className="admin-modal-top-actions">
            {isAuthenticated && (
              <button
                type="button"
                className="admin-btn-pill"
                onClick={() => setShowChangePin(true)}
                title="Cambiar PIN"
              >
                <Lock size={14} />
                <span>PIN</span>
              </button>
            )}
            <button
              type="button"
              className="admin-modal-close-btn"
              onClick={onClose}
              aria-label="Cerrar panel de administración"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* SI NO ESTÁ AUTENTICADO: FORMULARIO DE PIN */}
        {!isAuthenticated ? (
          <div className="admin-modal-auth-body">
            <div className="admin-auth-box">
              <div className="auth-icon-wrap">
                <Lock size={32} />
              </div>
              <h3>Introduce tu PIN de Administrador</h3>
              <p>
                Este PIN protege los horarios y enlaces de reserva de tu sitio.
              </p>

              <form onSubmit={handleLogin} className="admin-auth-form">
                <input
                  id="admin-modal-pin"
                  type="password"
                  inputMode="numeric"
                  placeholder="••••"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  required
                  autoFocus
                />

                {pinError && (
                  <p className="error-badge" role="alert">
                    <AlertCircle size={15} />
                    {pinError}
                  </p>
                )}

                <div className="auth-actions">
                  <button type="submit" className="button admin-btn-enter">
                    <Unlock size={17} /> Acceder al Panel
                  </button>
                  <button
                    type="button"
                    className="button outline small"
                    onClick={onClose}
                  >
                    Cancelar
                  </button>
                </div>

                <small className="auth-hint">
                  PIN inicial predeterminado: <strong>5630</strong>.
                </small>
              </form>
            </div>
          </div>
        ) : (
          /* SI ESTÁ AUTENTICADO: CONTENIDO COMPLETO DEL PANEL */
          <>
            {/* BARRA DE PESTAÑAS (SCROLLABLE EN MÓVIL) */}
            <nav
              className="admin-modal-tabs"
              role="tablist"
              aria-label="Secciones del panel"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "horarios"}
                className={`admin-modal-tab ${
                  activeTab === "horarios" ? "active" : ""
                }`}
                onClick={() => setActiveTab("horarios")}
              >
                <Clock size={16} />
                <span>Días y Horarios</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "calendar"}
                className={`admin-modal-tab ${
                  activeTab === "calendar" ? "active" : ""
                }`}
                onClick={() => setActiveTab("calendar")}
              >
                <CalendarDays size={16} />
                <span>Google Calendar</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "consultorio"}
                className={`admin-modal-tab ${
                  activeTab === "consultorio" ? "active" : ""
                }`}
                onClick={() => setActiveTab("consultorio")}
              >
                <Settings size={16} />
                <span>Consultorio</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "preview"}
                className={`admin-modal-tab ${
                  activeTab === "preview" ? "active" : ""
                }`}
                onClick={() => setActiveTab("preview")}
              >
                <Eye size={16} />
                <span>Vista Previa</span>
              </button>
            </nav>

            {/* ALERTA DE ESTATUS */}
            {saveStatus.message && (
              <div
                className={`admin-status-banner ${
                  saveStatus.type === "success" ? "success" : "error"
                }`}
                role="status"
              >
                <div className="banner-text">
                  {saveStatus.type === "success" ? (
                    <Check size={18} />
                  ) : (
                    <AlertCircle size={18} />
                  )}
                  <span>{saveStatus.message}</span>
                </div>
                <button
                  className="close-banner"
                  onClick={() => setSaveStatus({ type: "", message: "" })}
                  aria-label="Cerrar notificación"
                >
                  ×
                </button>
              </div>
            )}

            {/* CUERPO PRINCIPAL DEL MODAL (CON SCROLL SUAVE) */}
            <div className="admin-modal-body">
              {/* PESTAÑA 1: DÍAS Y HORARIOS */}
              {activeTab === "horarios" && (
                <div className="modal-tab-content">
                  {/* Interruptor general de disponibilidad */}
                  <div className="switch-card">
                    <div className="switch-copy">
                      <strong>Recepción de Nuevas Citas</strong>
                      <p>
                        {config.available
                          ? "✓ Agenda abierta: Los pacientes pueden agendar citas"
                          : "✕ Agenda cerrada temporalmente"}
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={config.available}
                        onChange={(e) =>
                          setConfig({ ...config, available: e.target.checked })
                        }
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  {/* Duración de la sesión y Nota informativa */}
                  <div className="admin-two-cols">
                    <div className="admin-field-box">
                      <label htmlFor="modal-session-duration">
                        <Clock size={15} /> Duración de cada sesión
                      </label>
                      <select
                        id="modal-session-duration"
                        value={config.sessionDurationMinutes}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            sessionDurationMinutes: Number(e.target.value),
                          })
                        }
                      >
                        <option value={45}>45 minutos</option>
                        <option value={50}>50 minutos (Recomendado)</option>
                        <option value={60}>60 minutos (1 hora)</option>
                        <option value={90}>90 minutos (1h 30m)</option>
                      </select>
                    </div>

                    <div className="admin-field-box">
                      <label htmlFor="modal-notice-input">
                        <Sparkles size={15} /> Nota para pacientes
                      </label>
                      <input
                        id="modal-notice-input"
                        type="text"
                        value={config.notice}
                        onChange={(e) =>
                          setConfig({ ...config, notice: e.target.value })
                        }
                        placeholder="Ej: Atención presencial y virtual previa cita."
                      />
                    </div>
                  </div>

                  {/* Plantillas rápidas */}
                  <div className="admin-presets-bar">
                    <span className="presets-title">⚡ Plantillas:</span>
                    <button
                      type="button"
                      className="preset-btn"
                      onClick={() => applyPreset("split")}
                    >
                      Lun-Vie (9-14 y 16-20) + Sáb
                    </button>
                    <button
                      type="button"
                      className="preset-btn"
                      onClick={() => applyPreset("standard")}
                    >
                      Lun-Vie continuo (9-18)
                    </button>
                    <button
                      type="button"
                      className="preset-btn"
                      onClick={() => applyPreset("weekdays_sat")}
                    >
                      Lun-Sáb matutino (9-15)
                    </button>
                  </div>

                  {/* Lista de Días de la semana */}
                  <div className="days-editor-grid">
                    {config.days.map((day: DaySchedule) => (
                      <div
                        key={day.dayId}
                        className={`day-editor-card ${
                          day.active ? "is-active" : "is-inactive"
                        }`}
                      >
                        <div className="day-card-top">
                          <div className="day-name-block">
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={day.active}
                                onChange={() => toggleDayActive(day.dayId)}
                              />
                              <span className="day-title">{day.dayName}</span>
                            </label>
                            <span
                              className={`day-badge ${
                                day.active ? "badge-open" : "badge-closed"
                              }`}
                            >
                              {day.active ? "Abierto" : "Cerrado"}
                            </span>
                          </div>

                          {day.active && (
                            <div className="modality-select-wrap">
                              <select
                                value={day.modality}
                                onChange={(e) =>
                                  setDayModality(
                                    day.dayId,
                                    e.target.value as ModalityType,
                                  )
                                }
                                aria-label={`Modalidad para ${day.dayName}`}
                              >
                                <option value="ambas">
                                  Presencial y Virtual
                                </option>
                                <option value="presencial">
                                  Solo Presencial
                                </option>
                                <option value="virtual">Solo Virtual</option>
                              </select>
                            </div>
                          )}
                        </div>

                        {day.active ? (
                          <div className="day-ranges-container">
                            <div className="ranges-header">
                              <small>Horas de consulta:</small>
                              <button
                                type="button"
                                className="btn-add-range"
                                onClick={() => addTimeRange(day.dayId)}
                                title="Añadir otro turno en el mismo día"
                              >
                                <Plus size={13} /> Añadir turno
                              </button>
                            </div>

                            {day.ranges.map((range: TimeRange, rIdx: number) => (
                              <div key={rIdx} className="range-row">
                                <span className="range-index">
                                  T{rIdx + 1}
                                </span>
                                <div className="time-input-group">
                                  <label>
                                    <span>De:</span>
                                    <input
                                      type="time"
                                      value={range.start}
                                      onChange={(e) =>
                                        updateTimeRange(
                                          day.dayId,
                                          rIdx,
                                          "start",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </label>
                                  <label>
                                    <span>A:</span>
                                    <input
                                      type="time"
                                      value={range.end}
                                      onChange={(e) =>
                                        updateTimeRange(
                                          day.dayId,
                                          rIdx,
                                          "end",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </label>
                                </div>
                                {day.ranges.length > 1 && (
                                  <button
                                    type="button"
                                    className="btn-remove-range"
                                    onClick={() =>
                                      removeTimeRange(day.dayId, rIdx)
                                    }
                                    title="Eliminar este turno"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="day-inactive-notice">
                            <p>
                              Día no laborable. Marca la casilla para habilitar
                              atención.
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PESTAÑA 2: GOOGLE CALENDAR */}
              {activeTab === "calendar" && (
                <div className="modal-tab-content">
                  <div className="calendar-setup-card">
                    <div className="calendar-card-header">
                      <CalendarDays size={24} />
                      <div>
                        <h3>Página de Citas de Google Calendar</h3>
                        <p>
                          Ingresa el enlace de tu calendario de citas
                          (Appointment Schedules) de Google Calendar para que
                          las reservas se guarden directamente en tu cuenta.
                        </p>
                      </div>
                    </div>

                    <div className="calendar-input-box">
                      <label htmlFor="modal-calendar-url">
                        URL de citas de Google Calendar:
                      </label>
                      <div className="input-with-action">
                        <input
                          id="modal-calendar-url"
                          type="url"
                          value={config.calendarUrl}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              calendarUrl: e.target.value,
                            })
                          }
                          placeholder="https://calendar.app.google/... o calendar.google.com/calendar/appointments/schedules/..."
                        />
                        {config.calendarUrl &&
                          isGoogleCalendarUrl(config.calendarUrl) && (
                            <a
                              href={config.calendarUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="button outline small"
                            >
                              <ExternalLink size={15} /> Probar
                            </a>
                          )}
                      </div>
                      {config.calendarUrl &&
                        !isGoogleCalendarUrl(config.calendarUrl) && (
                          <p className="warning-text">
                            <AlertCircle size={14} /> El enlace debe pertenecer
                            a <code>calendar.google.com</code> o{" "}
                            <code>calendar.app.google</code>.
                          </p>
                        )}
                    </div>

                    <div className="calendar-steps-guide">
                      <h4>📌 ¿Cómo vincular Google Calendar?</h4>
                      <ol>
                        <li>
                          En tu computadora abre Google Calendar y pulsa{" "}
                          <strong>&quot;+ Crear&quot;</strong> &gt;{" "}
                          <strong>&quot;Página de citas&quot;</strong>.
                        </li>
                        <li>
                          Indica los mismos días y horas que configuraste en
                          este panel.
                        </li>
                        <li>
                          Pulsa <strong>&quot;Compartir&quot;</strong>, copia el
                          enlace y pégalo arriba.
                        </li>
                      </ol>
                      <a
                        className="button outline small"
                        href={getGoogleCalendarAppointmentSettingsUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink size={15} /> Abrir configuración de
                        Google Calendar
                      </a>
                    </div>
                  </div>

                  <div className="calendar-actions-grid">
                    <div className="action-box">
                      <CalendarCheck size={26} />
                      <div>
                        <h4>Descargar Calendario (.ics)</h4>
                        <p>
                          Exporta tus bloques semanales para importarlos en
                          Google Calendar y bloquear tus horas de trabajo.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="button outline small"
                        onClick={() => downloadIcsFile(config)}
                      >
                        <Download size={16} /> Descargar .ics
                      </button>
                    </div>

                    <div className="action-box">
                      <CalendarDays size={26} />
                      <div>
                        <h4>Estado de Citas</h4>
                        <p>
                          {config.calendarUrl
                            ? "✓ Enlace activo. Los pacientes reservarán directamente en tu Google Calendar."
                            : "⚠️ Sin enlace: El botón 'Agendar cita' redirige a tu WhatsApp con mensaje predefinido."}
                        </p>
                      </div>
                      <span className="badge-highlight">
                        {config.calendarUrl ? "Vigente" : "Modo WhatsApp"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* PESTAÑA 3: DATOS DEL CONSULTORIO */}
              {activeTab === "consultorio" && (
                <div className="modal-tab-content">
                  <div className="consultorio-form-grid">
                    <label>
                      WhatsApp y Teléfono (con código de país, ej. 524427045630):
                      <input
                        type="tel"
                        value={config.phone}
                        onChange={(e) =>
                          setConfig({ ...config, phone: e.target.value })
                        }
                        required
                      />
                    </label>

                    <label>
                      Mensaje inicial de WhatsApp:
                      <textarea
                        rows={2}
                        value={config.whatsappMessage}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            whatsappMessage: e.target.value,
                          })
                        }
                      />
                    </label>

                    <label>
                      Nombre del Consultorio:
                      <input
                        type="text"
                        value={config.officeName}
                        onChange={(e) =>
                          setConfig({ ...config, officeName: e.target.value })
                        }
                        placeholder="Ej: Consultorio Abigail Sánchez"
                      />
                    </label>

                    <label>
                      Dirección física completa:
                      <input
                        type="text"
                        value={config.address}
                        onChange={(e) =>
                          setConfig({ ...config, address: e.target.value })
                        }
                        placeholder="Ej: Av. Constituyentes 123, Querétaro, Qro."
                      />
                    </label>

                    <label>
                      Instagram (URL https://...):
                      <input
                        type="url"
                        value={config.instagram}
                        onChange={(e) =>
                          setConfig({ ...config, instagram: e.target.value })
                        }
                        placeholder="https://instagram.com/..."
                      />
                    </label>

                    <label>
                      Facebook (URL https://...):
                      <input
                        type="url"
                        value={config.facebook}
                        onChange={(e) =>
                          setConfig({ ...config, facebook: e.target.value })
                        }
                        placeholder="https://facebook.com/..."
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* PESTAÑA 4: VISTA PREVIA */}
              {activeTab === "preview" && (
                <div className="modal-tab-content">
                  <p className="preview-help-text">
                    Así ven los pacientes la tarjeta de horarios en tu sitio:
                  </p>
                  <div className="preview-container-box">
                    <ScheduleViewer schedule={config} />
                  </div>
                </div>
              )}
            </div>

            {/* PIE DEL MODAL (BOTONES DE ACCIÓN) */}
            <footer className="admin-modal-footer">
              <div className="footer-left-tools">
                <button
                  type="button"
                  className="button outline small"
                  onClick={handleCopyJson}
                  title="Copiar configuración en JSON"
                >
                  <Copy size={15} />{" "}
                  <span>{copiedCode ? "¡Copiado!" : "Copiar JSON"}</span>
                </button>
                <button
                  type="button"
                  className="button outline small"
                  onClick={handleDownloadJson}
                  title="Descargar archivo JSON"
                >
                  <Download size={15} /> <span>Descargar JSON</span>
                </button>
              </div>

              <div className="footer-right-actions">
                <button
                  type="button"
                  className="button outline small"
                  onClick={onClose}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  className="button admin-btn-save-main"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save size={16} />{" "}
                  <span>
                    {isSaving ? "Guardando..." : "Guardar cambios"}
                  </span>
                </button>
              </div>
            </footer>
          </>
        )}
      </div>

      {/* MODAL SECUNDARIO: CAMBIAR PIN */}
      {showChangePin && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setShowChangePin(false)}
        >
          <div
            className="admin-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Cambiar PIN de Acceso</h3>
            <p>Define un nuevo PIN para proteger este panel de control.</p>

            <form onSubmit={handleChangePinSubmit}>
              <label>
                Nuevo PIN (mínimo 4 caracteres):
                <input
                  type="password"
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  required
                  autoFocus
                />
              </label>

              <label>
                Confirmar nuevo PIN:
                <input
                  type="password"
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  required
                />
              </label>

              {pinChangeMsg && (
                <p
                  className={`modal-msg ${
                    pinChangeMsg.includes("éxito") ? "success" : "error"
                  }`}
                >
                  {pinChangeMsg}
                </p>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="button outline small"
                  onClick={() => setShowChangePin(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="button small">
                  Guardar nuevo PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
