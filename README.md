# Tarjeta digital · Abigail Sánchez

Aplicación React + TypeScript + Vite, totalmente frontend.

## Uso

- Instalar: `npm install`
- Desarrollo: `npm run dev`
- Compilar: `npm run build`
- Publicar el contenido de `dist` en un alojamiento estático.

## Configuración

Abre el engrane del pie de página o `/configuracion`. PIN inicial: **5630**.
El PIN es una barrera para evitar cambios accidentales, no autenticación segura.
Las preferencias se guardan exclusivamente en el navegador actual mediante LocalStorage.
Para cambiar los valores para todos los visitantes, edita `defaults` en `src/main.tsx` y vuelve a compilar y publicar.

Pendiente de proporcionar: enlace de reservas de Google Calendar, dirección, horarios, nombre del consultorio, Instagram y Facebook. Mientras faltan, la agenda y la consulta de ubicación abren WhatsApp. Las redes sin configurar no se muestran.
No se simulan horarios ni reservas. El indicador de agenda representa una preferencia visual, no consulta disponibilidad en tiempo real.

## Imágenes

La ilustración original se extrajo con su transparencia del PDF proporcionado. El monograma se obtuvo de la primera página. No se inventó una fotografía de la profesional.

## Validación

Compilación de TypeScript y producción de Vite completadas. La vista local responde HTTP 200. No se realizó una prueba visual automatizada en navegador.
