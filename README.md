# Tarjeta digital · Abigail Sánchez

Aplicación React + TypeScript + Vite, con panel de administración de horarios y sincronización con Google Calendar.

## Uso

- Instalar dependencias: `npm install`
- Servidor de desarrollo: `npm run dev`
- Compilar para producción: `npm run build`
- Publicar el contenido de la carpeta `dist` en cualquier alojamiento web (Netlify, Vercel, GitHub Pages, etc.).

## Panel de Administrador (`/admin` o `/configuracion`)

Puedes acceder al panel de administración haciendo clic en el botón **"Panel Administrador"** en el pie de página o visitando directamente `/admin` o `/configuracion`.

- **PIN de acceso inicial:** `5630` (puede cambiarse desde el mismo panel).
- **Gestión de Días y Horarios:**
  - Activar o desactivar días de la semana (Lunes a Domingo).
  - Configurar múltiples turnos y rangos de horas por día (ej. matutino y vespertino).
  - Modalidades por día: Presencial, Virtual o Ambas.
  - Duración de las sesiones y nota informativa.
  - Plantillas rápidas para configurar en un clic.
- **Guardado en el código del front:**
  - Al hacer clic en **"Guardar cambios"**, se guardan directamente en el código de la aplicación (`src/data/scheduleData.json` y `public/schedule.json`).
  - Todos los visitantes del sitio verán inmediatamente los días y horarios actualizados en el bloque interactivo de la sección **Agenda**.
  - Opciones adicionales para copiar el código JSON o descargarlo como respaldo.

## Integración con Google Calendar

1. **Agenda de citas en Google Calendar:**
   - En la pestaña **Google Calendar** del panel de administrador, pega la URL de tu *Página de citas* de Google Calendar (`calendar.app.google` o `calendar.google.com`).
   - Los visitantes que hagan clic en "Agendar en Google Calendar" podrán seleccionar el horario disponible directamente en tu calendario y la cita se registrará de forma automática.
2. **Exportar Horarios a Google Calendar (.ics):**
   - El panel incluye un botón para generar y descargar un archivo `.ics` con tus horarios de trabajo recurrentes para importarlo en Google Calendar y bloquear tus horas de consulta.
   - Acceso directo a la configuración de citas de Google Calendar.

## Imágenes y Marca

- Emblema botánico extraído con transparencia en `/ilustracion.png`.
- Monograma AS en `/marca.png`.
