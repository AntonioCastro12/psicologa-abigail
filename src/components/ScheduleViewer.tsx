import { useState } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  Video,
  ArrowUpRight,
  MessageCircle,
  CalendarCheck,
} from "lucide-react";
import { DaySchedule, SiteScheduleConfig } from "../types/schedule";
import {
  isGoogleCalendarUrl,
  getGoogleCalendarQuickEventUrl,
} from "../utils/googleCalendar";

interface ScheduleViewerProps {
  schedule: SiteScheduleConfig;
  onBookClick?: () => void;
}

export function ScheduleViewer({ schedule }: ScheduleViewerProps) {
  // Current day index (0 = Dom, 1 = Lun, ...)
  const todayIdx = new Date().getDay();
  const dayIndexMap: Record<number, string> = {
    0: "domingo",
    1: "lunes",
    2: "martes",
    3: "miercoles",
    4: "jueves",
    5: "viernes",
    6: "sabado",
  };
  const todayId = dayIndexMap[todayIdx];

  // Selected day tab, defaulting to today or the first active day
  const todaySchedule = schedule.days.find((d) => d.dayId === todayId);
  const initialDayId =
    todaySchedule && todaySchedule.active
      ? todayId
      : schedule.days.find((d) => d.active)?.dayId || "lunes";

  const [selectedDayId, setSelectedDayId] = useState<string>(initialDayId);

  const selectedDay =
    schedule.days.find((d) => d.dayId === selectedDayId) || schedule.days[0];

  const hasCalendar = isGoogleCalendarUrl(schedule.calendarUrl);

  const phone = schedule.phone.replace(/\D/g, "");
  const waUrl = (msg: string) =>
    `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

  const quickGoogleCalendarUrl = getGoogleCalendarQuickEventUrl({
    title: "Cita con Psicóloga Abigail Sánchez",
    details: `Sesión de psicología de ${schedule.sessionDurationMinutes} min. Modalidad: ${selectedDay.modality}.`,
    location: schedule.address || "Consultorio Abigail Sánchez",
    durationMinutes: schedule.sessionDurationMinutes,
  });

  return (
    <div className="schedule-viewer">
      <div className="schedule-header">
        <div className="schedule-badge">
          <Clock size={15} />
          <span>
            {schedule.available
              ? "Horarios disponibles para citas"
              : "Agenda cerrada temporalmente"}
          </span>
        </div>
        <div className="session-duration">
          <span>⏱️ Sesiones de {schedule.sessionDurationMinutes} min</span>
        </div>
      </div>

      {/* Selector de días de la semana */}
      <div
        className="schedule-days-nav"
        role="tablist"
        aria-label="Días de la semana"
      >
        {schedule.days.map((day: DaySchedule) => {
          const isToday = day.dayId === todayId;
          const isSelected = day.dayId === selectedDayId;
          return (
            <button
              key={day.dayId}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`schedule-day-pill ${isSelected ? "selected" : ""} ${
                day.active ? "active" : "inactive"
              } ${isToday ? "is-today" : ""}`}
              onClick={() => setSelectedDayId(day.dayId)}
            >
              <span className="pill-short">{day.shortName}</span>
              {isToday && <span className="today-dot" title="Hoy" />}
              {!day.active && <span className="pill-status">Cerrado</span>}
            </button>
          );
        })}
      </div>

      {/* Tarjeta de detalle del día seleccionado */}
      <div className="schedule-day-card">
        <div className="day-card-header">
          <div>
            <h3>
              {selectedDay.dayName}
              {selectedDay.dayId === todayId && (
                <span className="badge-today">Hoy</span>
              )}
            </h3>
            <span
              className={`status-pill ${
                selectedDay.active ? "open" : "closed"
              }`}
            >
              {selectedDay.active ? "Atención disponible" : "Cerrado"}
            </span>
          </div>

          <div className="day-modalities">
            {(selectedDay.modality === "presencial" ||
              selectedDay.modality === "ambas") && (
              <span className="modality-chip">
                <MapPin size={14} /> Presencial
              </span>
            )}
            {(selectedDay.modality === "virtual" ||
              selectedDay.modality === "ambas") && (
              <span className="modality-chip">
                <Video size={14} /> Virtual
              </span>
            )}
          </div>
        </div>

        {selectedDay.active && selectedDay.ranges.length > 0 ? (
          <div className="ranges-list">
            <span className="ranges-title">Horarios de consulta:</span>
            <div className="ranges-grid">
              {selectedDay.ranges.map((range, i) => (
                <div key={i} className="range-item">
                  <Clock size={16} />
                  <strong>
                    {range.start} – {range.end}
                  </strong>
                  <span className="range-tag">Turno {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="closed-day-info">
            <p>
              No hay atención regular los {selectedDay.dayName.toLowerCase()}s.
              Puedes consultar disponibilidad extraordinaria por WhatsApp.
            </p>
          </div>
        )}

        {schedule.notice && (
          <p className="schedule-notice">{schedule.notice}</p>
        )}

        {/* Acciones de agendado */}
        <div className="schedule-actions">
          {schedule.available ? (
            hasCalendar ? (
              <a
                className="button schedule-btn-calendar"
                href={schedule.calendarUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <CalendarDays size={18} />
                Agendar en Google Calendar
                <ArrowUpRight size={17} />
              </a>
            ) : (
              <a
                className="button schedule-btn-wa"
                href={waUrl(
                  `Hola Abigail, quisiera consultar citas para el día ${selectedDay.dayName}.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={18} />
                Agendar {selectedDay.dayName} por WhatsApp
                <ArrowUpRight size={17} />
              </a>
            )
          ) : (
            <button className="button" disabled>
              <CalendarDays size={18} />
              Agenda cerrada
            </button>
          )}

          {!hasCalendar && schedule.available && (
            <a
              className="button outline small"
              href={quickGoogleCalendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Añade un recordatorio o reserva previa en tu Google Calendar"
            >
              <CalendarCheck size={16} />
              Crear recordatorio en Google Calendar
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
