import { DaySchedule, SiteScheduleConfig } from "../types/schedule";

// Map dayId to iCalendar day codes (RFC 5545)
const DAY_CODE_MAP: Record<string, string> = {
  lunes: "MO",
  martes: "TU",
  miercoles: "WE",
  jueves: "TH",
  viernes: "FR",
  sabado: "SA",
  domingo: "SU",
};

/**
 * Validates Google Calendar appointment scheduling or booking URL
 */
export function isGoogleCalendarUrl(url: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      (u.hostname === "calendar.google.com" ||
        u.hostname === "calendar.app.google" ||
        u.hostname.endsWith(".google.com"))
    );
  } catch {
    return false;
  }
}

/**
 * Direct URL to Google Calendar Appointment Schedules configuration page
 */
export function getGoogleCalendarAppointmentSettingsUrl(): string {
  return "https://calendar.google.com/calendar/u/0/r/settings/appointment-schedules";
}

/**
 * Helper to format a time string into 12-hour format or keep 24h
 */
export function formatTimeDisplay(timeStr: string): string {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":").map(Number);
  if (isNaN(hours)) return timeStr;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes < 10 ? "0" + minutes : minutes} ${period}`;
}

/**
 * Creates human-readable schedule summary (e.g. "Lunes a Viernes: 09:00 - 18:00")
 */
export function getScheduleSummaryText(days: DaySchedule[]): string {
  const activeDays = days.filter((d) => d.active && d.ranges.length > 0);
  if (activeDays.length === 0) return "Horarios por definir. Contactar por WhatsApp.";

  return activeDays
    .map((day) => {
      const rangesStr = day.ranges
        .map((r) => `${r.start} - ${r.end}`)
        .join(" y ");
      return `${day.dayName}: ${rangesStr}`;
    })
    .join(" · ");
}

/**
 * Formats a Date object for iCalendar (YYYYMMDDTHHMMSSZ)
 */
function toIcsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Generates an .ics file content representing the psychologist's weekly working schedule
 */
export function generateIcsCalendar(config: SiteScheduleConfig): string {
  const now = new Date();
  const timestamp = toIcsDate(now);

  const events: string[] = [];

  // Find next occurrence for each day of week to set DTSTART
  const dayIndexMap: Record<string, number> = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
  };

  config.days.forEach((day) => {
    if (!day.active || !day.ranges.length) return;
    const dayCode = DAY_CODE_MAP[day.dayId];
    const targetDayIdx = dayIndexMap[day.dayId];

    day.ranges.forEach((range, idx) => {
      if (!range.start || !range.end) return;
      const [sH, sM] = range.start.split(":").map(Number);
      const [eH, eM] = range.end.split(":").map(Number);

      // Calculate upcoming date for this day of week
      const startDate = new Date(now);
      const currentDay = startDate.getDay();
      let distance = targetDayIdx - currentDay;
      if (distance < 0) distance += 7;
      startDate.setDate(startDate.getDate() + distance);
      startDate.setHours(sH, sM, 0, 0);

      const endDate = new Date(startDate);
      endDate.setHours(eH, eM, 0, 0);

      const uid = `schedule-${day.dayId}-${idx}-${Date.now()}@abigailsanchez.psicologa`;
      const modalityLabel =
        day.modality === "presencial"
          ? "Presencial"
          : day.modality === "virtual"
            ? "Virtual"
            : "Presencial y Virtual";

      const eventBlock = [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${timestamp}`,
        `DTSTART:${toIcsDate(startDate)}`,
        `DTEND:${toIcsDate(endDate)}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${dayCode}`,
        `SUMMARY:Horario de Consulta · Psicóloga Abigail Sánchez (${day.shortName})`,
        `DESCRIPTION:Horario de atención disponible (${modalityLabel}). Duración estándar de sesión: ${config.sessionDurationMinutes} min.\\nTeléfono: +${config.phone}`,
        `LOCATION:${config.address || "Consultorio Abigail Sánchez / Modalidad en línea"}`,
        "STATUS:CONFIRMED",
        "TRANSP:OPAQUE",
        "END:VEVENT",
      ].join("\r\n");

      events.push(eventBlock);
    });
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Abigail Sanchez//Horario de Atencion//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Horarios Abigail Sánchez · Psicóloga",
    "X-WR-TIMEZONE:America/Mexico_City",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Triggers a browser download of the generated .ics file
 */
export function downloadIcsFile(config: SiteScheduleConfig): void {
  const content = generateIcsCalendar(config);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "horarios-abigail-sanchez-calendar.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Creates a Google Calendar Web Event Template URL to add a single consultation or time block
 */
export function getGoogleCalendarQuickEventUrl(params: {
  title: string;
  details?: string;
  location?: string;
  startDate?: Date;
  durationMinutes?: number;
}): string {
  const title = encodeURIComponent(params.title);
  const details = encodeURIComponent(
    params.details ||
      "Cita con Psicóloga Abigail Sánchez. Sesión de acompañamiento y orientación psicológica.",
  );
  const location = encodeURIComponent(
    params.location || "Consultorio Abigail Sánchez",
  );

  const start = params.startDate || new Date();
  const end = new Date(
    start.getTime() + (params.durationMinutes || 50) * 60 * 1000,
  );

  const dates = `${toIcsDate(start)}/${toIcsDate(end)}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
}
