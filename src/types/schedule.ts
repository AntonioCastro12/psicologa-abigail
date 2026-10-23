export type DayId =
  | "lunes"
  | "martes"
  | "miercoles"
  | "jueves"
  | "viernes"
  | "sabado"
  | "domingo";

export type ModalityType = "presencial" | "virtual" | "ambas";

export interface TimeRange {
  start: string; // e.g. "09:00"
  end: string;   // e.g. "14:00"
}

export interface DaySchedule {
  dayId: DayId;
  dayName: string;   // "Lunes", "Martes", etc.
  shortName: string; // "Lun", "Mar", etc.
  active: boolean;
  ranges: TimeRange[];
  modality: ModalityType;
}

export interface SiteScheduleConfig {
  available: boolean; // Agenda abierta general
  sessionDurationMinutes: number; // e.g. 50
  notice: string; // Nota visible sobre la atención
  calendarUrl: string; // Enlace Google Calendar de citas
  googleCalendarEmail?: string;
  phone: string; // Teléfono / WhatsApp
  whatsappMessage: string;
  officeName: string;
  address: string;
  instagram: string;
  facebook: string;
  days: DaySchedule[];
  lastModified?: string;
}
