import { getStore } from "@netlify/blobs";
import defaultSchedule from "../../src/data/scheduleData.json";

export default async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  let store: any = null;
  try {
    store = getStore("schedule-store");
  } catch (err) {
    console.warn("Netlify Blobs no inicializado:", err);
  }

  // GET: Obtener el horario en vivo desde la nube
  if (req.method === "GET") {
    try {
      if (store) {
        const cloudData = await store.get("schedule", { type: "json" });
        if (cloudData && typeof cloudData === "object") {
          return new Response(JSON.stringify(cloudData), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              ...corsHeaders,
            },
          });
        }
      }
    } catch (e) {
      console.error("Error al leer de Netlify Blobs:", e);
    }

    return new Response(JSON.stringify(defaultSchedule), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        ...corsHeaders,
      },
    });
  }

  // POST: Guardar cambios de la psicóloga en la nube con validación de PIN
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { pin, schedule, newPin } = body || {};

      let validPin = process.env.ADMIN_PIN || "5630";
      if (store) {
        try {
          const storedPin = await store.get("admin-pin", { type: "text" });
          if (storedPin) validPin = storedPin;
        } catch {}
      }

      if (!pin || String(pin).trim() !== String(validPin).trim()) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "PIN incorrecto. Revisa tu PIN e intenta nuevamente.",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }

      if (newPin && String(newPin).trim().length >= 4 && store) {
        try {
          await store.set("admin-pin", String(newPin).trim());
        } catch (e) {
          console.error("Error guardando nuevo PIN:", e);
        }
      }

      if (!schedule || typeof schedule !== "object") {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Datos de horario no válidos.",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }

      const toSave = {
        ...schedule,
        lastModified: new Date().toISOString(),
      };

      if (store) {
        await store.setJSON("schedule", toSave);
      }

      return new Response(
        JSON.stringify({
          success: true,
          schedule: toSave,
          message:
            "¡Horarios y estado guardados en la nube! Visibles de inmediato para todos los visitantes.",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({
          success: false,
          error: err?.message || "Error al procesar la solicitud.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }
  }

  return new Response(JSON.stringify({ error: "Método no permitido" }), {
    status: 405,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
};
