import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  CalendarDays,
  MessageCircle,
  Phone,
  Mail,
  Download,
  Heart,
  Compass,
  Sprout,
  Users,
  ChartNoAxesCombined,
  ClipboardCheck,
  Presentation,
  Network,
  MapPin,
  Video,
  Settings,
  X,
  Instagram,
  Facebook,
  Menu,
  Check,
  Lock,
  ChevronDown,
} from "lucide-react";
import "./style.css";
import "./refinements.css";
import "./admin.css";
import initialScheduleData from "./data/scheduleData.json";
import { SiteScheduleConfig } from "./types/schedule";
import { ScheduleViewer } from "./components/ScheduleViewer";
import { AdminPanel } from "./components/AdminPanel";
import {
  getScheduleSummaryText,
  isGoogleCalendarUrl,
} from "./utils/googleCalendar";
import { ShareCard } from "./ShareCard";

const SCHEDULE_STORAGE_KEY = "abigail-schedule-config";

function readInitialSchedule(): SiteScheduleConfig {
  try {
    const stored = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...initialScheduleData,
        ...parsed,
        days: parsed.days || initialScheduleData.days,
      } as SiteScheduleConfig;
    }
  } catch {
    // fallback to bundled JSON
  }
  return initialScheduleData as SiteScheduleConfig;
}

function safeUrl(v: string, kind = "") {
  try {
    const u = new URL(v);
    if (u.protocol !== "https:") return "";
    if (
      kind === "calendar" &&
      !["calendar.google.com", "calendar.app.google"].includes(u.hostname)
    )
      return "";
    return u.href;
  } catch {
    return "";
  }
}

const clinical = [
  {
    name: "Orientación Psicológica",
    text: "Un espacio para comprender tus pensamientos, emociones y conductas con un enfoque cognitivo-conductual.",
    icon: Sprout,
  },
  {
    name: "Acompañamiento Emocional",
    text: "Acompañamiento y orientación para transitar diferentes situaciones personales y emocionales.",
    icon: Heart,
  },
  {
    name: "Orientación Vocacional",
    text: "Explora tus intereses, habilidades y alternativas para tomar decisiones académicas y profesionales.",
    icon: Compass,
  },
];

const organizational = [
  {
    name: "Reclutamiento y Selección",
    text: "Acompañamiento para identificar perfiles acordes con las necesidades de tu organización.",
    icon: Users,
  },
  {
    name: "Psicometría",
    text: "Evaluación de habilidades y características que aportan información a la toma de decisiones.",
    icon: ClipboardCheck,
  },
  {
    name: "Evaluación de Desempeño",
    text: "Identificación de fortalezas y oportunidades de mejora en el entorno laboral.",
    icon: ChartNoAxesCombined,
  },
  {
    name: "Capacitación y Talleres",
    text: "Espacios de aprendizaje para fortalecer habilidades y el trabajo en equipo.",
    icon: Presentation,
  },
  {
    name: "Desarrollo Organizacional",
    text: "Acompañamiento en procesos de mejora, comunicación y desarrollo de los equipos.",
    icon: Network,
  },
];

function App({ showIntro = false }: { showIntro?: boolean } = {}) {
  const [schedule, setSchedule] = useState<SiteScheduleConfig>(readInitialSchedule);
  const [currentView, setCurrentView] = useState<"site" | "admin">(() => {
    return window.location.pathname === "/admin" ||
      window.location.pathname === "/configuracion" ||
      window.location.hash === "#admin"
      ? "admin"
      : "site";
  });

  // Secciones 01, 02 y 03 en tarjetas plegables con botón "Abrir"
  const [isClinicalOpen, setIsClinicalOpen] = useState(false);
  const [isOrgOpen, setIsOrgOpen] = useState(false);
  const [isAgendaOpen, setIsAgendaOpen] = useState(false);

  const [notice, setNotice] = useState("");
  const [menu, setMenu] = useState(false);
  const settingsButton = useRef<HTMLButtonElement>(null);

  // Derive phone and links from current schedule
  const digits = schedule.phone.replace(/\D/g, "");
  const phone = /^\d{10,15}$/.test(digits) ? digits : "524427045630";
  const defaultMessage =
    schedule.whatsappMessage ||
    "Hola, quisiera agendar una cita. ¿Me puedes compartir los horarios disponibles?";

  const wa = (message = defaultMessage) =>
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  const calendar =
    isGoogleCalendarUrl(schedule.calendarUrl)
      ? schedule.calendarUrl
      : safeUrl(schedule.calendarUrl, "calendar") || "https://calendar.google.com/calendar/u/0/r";
  const instagram = safeUrl(schedule.instagram);
  const facebook = safeUrl(schedule.facebook);

  // Sync with browser history and hash navigation
  useEffect(() => {
    const handlePopState = () => {
      const isAdmin =
        window.location.pathname === "/admin" ||
        window.location.pathname === "/configuracion" ||
        window.location.hash === "#admin";
      setCurrentView(isAdmin ? "admin" : "site");
    };
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handlePopState);
    };
  }, []);

  // Suprimir cualquier iframe o badge inyectado por Netlify
  useEffect(() => {
    const purgeNetlifyHud = () => {
      document
        .querySelectorAll(
          'iframe#nl-badge-frame, iframe#nl-hud-frame, iframe[title*="Netlify" i], iframe[title*="Powered by Netlify" i]',
        )
        .forEach((el) => {
          el.remove();
        });
    };
    purgeNetlifyHud();
    const obs = new MutationObserver(purgeNetlifyHud);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);

  // Cargar horario en tiempo real desde la nube (Netlify Blobs)
  useEffect(() => {
    async function loadCloudSchedule() {
      try {
        const res = await fetch("/.netlify/functions/schedule", {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === "object" && Array.isArray(data.days)) {
            setSchedule(data);
            localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(data));
          }
        }
      } catch (err) {
        console.warn("Sin conexión a la nube, usando horario local/caché:", err);
      }
    }
    loadCloudSchedule();
  }, []);

  // Guardar horario en la nube en tiempo real (visible para todos los visitantes)
  async function handleSaveSchedule(
    updated: SiteScheduleConfig,
    pin?: string,
    newPin?: string,
  ) {
    try {
      localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(updated));
      setSchedule(updated);

      const effectivePin =
        pin || localStorage.getItem("abigail-admin-pin") || "5630";

      const response = await fetch("/.netlify/functions/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: effectivePin,
          schedule: updated,
          newPin,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        return {
          success: true,
          message:
            json.message ||
            "¡Horarios y estado guardados en la nube! Visibles de inmediato para todos los visitantes.",
        };
      } else {
        const errJson = await response.json().catch(() => ({}));
        return {
          success: false,
          message:
            errJson.error ||
            "Error al guardar en la nube. Verifica tu PIN e intenta nuevamente.",
        };
      }
    } catch {
      return {
        success: true,
        message:
          "Guardado localmente. Se sincronizará con la nube en cuanto haya conexión.",
      };
    }
  }

  function openAdmin() {
    setCurrentView("admin");
    if (window.location.pathname !== "/admin") {
      history.pushState(null, "", "/admin");
    }
  }

  function closeAdmin() {
    setCurrentView("site");
    if (
      window.location.pathname === "/admin" ||
      window.location.pathname === "/configuracion"
    ) {
      history.pushState(null, "", "/");
    }
  }

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const o = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            o.unobserve(e.target);
          }
        }),
      { threshold: 0.08 },
    );
    document.querySelectorAll(".reveal").forEach((e) => {
      e.classList.add("will-reveal");
      o.observe(e);
    });
    return () => o.disconnect();
  }, []);

  function saveContact() {
    const content = `BEGIN:VCARD\r\nVERSION:3.0\r\nN:Sánchez;Abigail;;;\r\nFN:Abigail Sánchez\r\nTITLE:Psicóloga\r\nTEL;TYPE=CELL:+${phone}\r\nEMAIL:ma.sanvag@gmail.com\r\nEND:VCARD\r\n`;
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/vcard;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "Abigail-Sanchez.vcf";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Contacto descargado. Ábrelo para guardarlo en tu teléfono.");
  }

  const Booking = ({
    label = "Agendar cita",
    className = "button btn-booking-hero",
  }: {
    label?: string;
    className?: string;
  }) =>
    schedule.available ? (
      <a
        className={className}
        href={calendar}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Abrir Google Calendar para agendar cita con Abigail Sánchez"
      >
        <CalendarDays size={18} />
        {label}
        <ArrowUpRight size={17} />
      </a>
    ) : (
      <button className={className} disabled>
        <CalendarDays size={18} />
        Agenda cerrada
      </button>
    );

  const Whatsapp = ({
    label = "WhatsApp",
    message = defaultMessage,
    className = "button btn-whatsapp-hero",
  }: {
    label?: string;
    message?: string;
    className?: string;
  }) => (
    <a
      className={className}
      href={wa(message)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <MessageCircle size={18} />
      {label}
    </a>
  );

  return (
    <>
      <a className="skip" href="#inicio">
        Ir al contenido
      </a>
      <header>
        <a
          className="brand brand-image-link"
          href="#inicio"
          aria-label="Abigail Sánchez, psicóloga"
        >
          <img
            src="/logo-abigail.png"
            alt="Abigail Sánchez · Psicóloga"
            className="brand-logo-img"
            width="820"
            height="640"
          />
        </a>
        <nav className={menu ? "open" : ""} aria-label="Navegación principal">
          {[
            ["inicio", "Inicio"],
            ["clinicos", "Servicios clínicos"],
            ["organizaciones", "Organizaciones"],
            ["agenda", "Agenda"],
            ["contacto", "Contacto"],
          ].map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={() => {
                setMenu(false);
                if (id === "clinicos") setIsClinicalOpen(true);
                if (id === "organizaciones") setIsOrgOpen(true);
                if (id === "agenda") setIsAgendaOpen(true);
              }}
            >
              {label}
            </a>
          ))}
        </nav>
        <a
          className="button small header-book"
          href={calendar}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Abrir Google Calendar para agendar cita"
        >
          <CalendarDays size={16} />
          Agendar cita <ArrowUpRight size={16} />
        </a>
        <button
          className="menu-button"
          aria-label={menu ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <main>
        <section className="hero" id="inicio">
          <div className="hero-copy">
            <span className={`status ${!schedule.available ? "closed" : ""}`}>
              <i />
              {schedule.available
                ? "Disponible para citas"
                : "Agenda cerrada temporalmente"}
            </span>
            <p className="eyebrow">
              PSICOLOGÍA · ATENCIÓN PRESENCIAL Y VIRTUAL
            </p>
            <h1>
              Un espacio para ti.
              <br />
              <em>
                Un paso hacia
                <br />
                tu bienestar.
              </em>
            </h1>
            <p className="intro">
              Soy Abigail Sánchez, psicóloga. Te acompaño a comprender lo que
              sientes y a construir herramientas para tu día a día.
            </p>
            <div className="hero-cta-group">
    
              <div className="hero-quick-buttons">
                <a
                  className="subtle-pill-btn"
                  href={`tel:+${phone}`}
                  title="Llamar a Abigail Sánchez"
                >
                  <Phone size={14} />
                  <span>Llamar</span>
                </a>
                <a
                  className="subtle-pill-btn"
                  href="mailto:ma.sanvag@gmail.com"
                  title="Enviar correo a Abigail Sánchez"
                >
                  <Mail size={14} />
                  <span>Correo</span>
                </a>
                <button
                  type="button"
                  className="subtle-pill-btn"
                  onClick={saveContact}
                  title="Guardar contacto en tu teléfono"
                >
                  <Download size={14} />
                  <span>Guardar contacto</span>
                </button>
              </div>
            </div>
          </div>
          <div className="hero-art hero-floating-only">
            <img
              className="hero-floating-logo"
              src="/ilustracion.png?v=5"
              width="1024"
              height="682"
              alt="Emblema de Abigail Sánchez: mente, corazón y hojas entrelazados"
            />
          </div>
        </section>

        <div className="approach">
          <span>Un acompañamiento cercano, a tu ritmo.</span>
          <span>
            Enfoque cognitivo-conductual <ArrowUpRight size={17} />
          </span>
        </div>

        {/* SECCIÓN 01: SERVICIOS CLÍNICOS EN TARJETA PLEGABLE */}
        <section
          className={`section-card clinical-card-section reveal ${isClinicalOpen ? "is-open" : "is-folded"}`}
          id="clinicos"
        >
          <div
            className="section-card-header"
            onClick={() => setIsClinicalOpen(!isClinicalOpen)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsClinicalOpen(!isClinicalOpen);
              }
            }}
            aria-expanded={isClinicalOpen}
            title={isClinicalOpen ? "Toca para cerrar" : "Toca para abrir"}
          >
            <div>
              <p className="eyebrow">01 / ATENCIÓN PERSONAL</p>
              <h2>Servicios Clínicos</h2>
              <p className="section-card-subtitle">
                Cada proceso es diferente. Encuentra el acompañamiento para ti.
              </p>
            </div>
            <button
              type="button"
              className="card-toggle-pill"
              aria-label={isClinicalOpen ? "Cerrar servicios clínicos" : "Abrir servicios clínicos"}
            >
              <span>{isClinicalOpen ? "Cerrar" : "Abrir"}</span>
              <ChevronDown
                size={20}
                className={`card-chevron-icon ${isClinicalOpen ? "rotated" : ""}`}
              />
            </button>
          </div>

          {isClinicalOpen && (
            <div className="section-card-body">
              <div className="clinical-grid">
                {clinical.map(({ name, text, icon: Icon }, i) => (
                  <article className="clinical-card" key={name}>
                    <div className="card-top">
                      <Icon size={29} strokeWidth={1.2} />
                      <span>0{i + 1}</span>
                    </div>
                    <h3>{name}</h3>
                    <p>{text}</p>
                    <a
                      className="text-link"
                      href={
                        schedule.available && calendar
                          ? calendar
                          : wa(
                              `Hola, quisiera información para una cita de ${name.toLowerCase()}.`,
                            )
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsAgendaOpen(true)}
                    >
                      {schedule.available ? "Agendar cita" : "Consultar por WhatsApp"}
                      <ArrowUpRight size={18} />
                    </a>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* SECCIÓN 02: SERVICIOS ORGANIZACIONALES EN TARJETA PLEGABLE */}
        <section
          className={`section-card org-card-section reveal ${isOrgOpen ? "is-open" : "is-folded"}`}
          id="organizaciones"
        >
          <div
            className="section-card-header"
            onClick={() => setIsOrgOpen(!isOrgOpen)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsOrgOpen(!isOrgOpen);
              }
            }}
            aria-expanded={isOrgOpen}
            title={isOrgOpen ? "Toca para cerrar" : "Toca para abrir"}
          >
            <div>
              <p className="eyebrow">02 / PERSONAS Y ORGANIZACIONES</p>
              <h2>Servicios Organizacionales</h2>
              <p className="section-card-subtitle">
                Herramientas para acompañar el desarrollo de las personas y fortalecer tu organización.
              </p>
            </div>
            <button
              type="button"
              className="card-toggle-pill"
              aria-label={isOrgOpen ? "Cerrar servicios organizacionales" : "Abrir servicios organizacionales"}
            >
              <span>{isOrgOpen ? "Cerrar" : "Abrir"}</span>
              <ChevronDown
                size={20}
                className={`card-chevron-icon ${isOrgOpen ? "rotated" : ""}`}
              />
            </button>
          </div>

          {isOrgOpen && (
            <div className="section-card-body">
              <div className="org-intro-block">
                <h2>
                  El bienestar también
                  <br />
                  <em>se construye en equipo.</em>
                </h2>
                <div className="org-art" aria-hidden="true">
                  <div />
                  <div />
                  <div />
                </div>
              </div>
              <div className="org-services">
                {organizational.map(({ name, text, icon: Icon }) => (
                  <article key={name}>
                    <Icon size={24} strokeWidth={1.3} />
                    <div>
                      <h3>{name}</h3>
                      <p>{text}</p>
                      <a
                        className="text-link"
                        href={wa(
                          `Hola, quisiera recibir información sobre el servicio de ${name}.`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Solicitar información <ArrowUpRight size={16} />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* SECCIÓN 03: AGENDA Y HORARIOS EN TARJETA PLEGABLE */}
        <section
          className={`section-card agenda-card-section agenda reveal ${isAgendaOpen ? "is-open" : "is-folded"}`}
          id="agenda"
        >
          <div
            className="section-card-header"
            onClick={() => setIsAgendaOpen(!isAgendaOpen)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsAgendaOpen(!isAgendaOpen);
              }
            }}
            aria-expanded={isAgendaOpen}
            title={isAgendaOpen ? "Toca para cerrar" : "Toca para abrir"}
          >
            <div>
              <p className="eyebrow">03 / TU PRÓXIMO PASO</p>
              <h2>Agenda tu cita</h2>
              <p className="section-card-subtitle">
                {isAgendaOpen
                  ? "Consulta los horarios disponibles y reserva tu espacio."
                  : "Toca para desplegar horarios y reservar."}
              </p>
            </div>
            <button
              type="button"
              className="card-toggle-pill"
              aria-label={isAgendaOpen ? "Cerrar agenda" : "Abrir agenda"}
            >
              <span>{isAgendaOpen ? "Cerrar" : "Abrir"}</span>
              <ChevronDown
                size={20}
                className={`card-chevron-icon ${isAgendaOpen ? "rotated" : ""}`}
              />
            </button>
          </div>

          {isAgendaOpen && (
            <div className="section-card-body agenda-body-layout">
              <div className="agenda-intro-col">
                <p>
                  {calendar
                    ? "Consulta los horarios disponibles y selecciona el que mejor se adapte a ti."
                    : "Escríbeme por WhatsApp para consultar los horarios disponibles y encontrar un espacio para ti."}
                </p>
                <div className="modalities">
                  <span>
                    <MapPin size={18} /> Presencial
                  </span>
                  <span>
                    <Video size={18} /> Virtual
                  </span>
                </div>
                <div className="agenda-actions-wrapper">
                  <Booking />
                  <Whatsapp />
                </div>
              </div>
              <div className="agenda-viewer-col">
                <ScheduleViewer schedule={schedule} />
              </div>
            </div>
          )}
        </section>

        <section className="section contact reveal" id="contacto">
          <div>
            <p className="eyebrow">04 / ESTAMOS EN CONTACTO</p>
            <h2>Hablemos.</h2>
            <p>El primer paso puede ser una conversación.</p>
            <Whatsapp label="Escribir por WhatsApp" />
            <button className="text-link download" onClick={saveContact}>
              <Download size={17} /> Guardar contacto
            </button>
          </div>
          <div className="contact-details">
            <a href={`tel:+${phone}`}>
              <Phone size={20} />
              <div>
                <small>TELÉFONO Y WHATSAPP</small>
                <span>
                  {phone === "524427045630" ? "+52 442 704 5630" : `+${phone}`}
                </span>
              </div>
              <ArrowUpRight size={20} />
            </a>
            <a href="mailto:ma.sanvag@gmail.com">
              <Mail size={20} />
              <div>
                <small>CORREO ELECTRÓNICO</small>
                <span>ma.sanvag@gmail.com</span>
              </div>
              <ArrowUpRight size={20} />
            </a>
            {/* <div className="address">
              <MapPin size={20} />
            
            </div> */}
            {(instagram || facebook) && (
              <div className="socials">
                {instagram && (
                  <a href={instagram} target="_blank" rel="noopener noreferrer">
                    <Instagram size={19} /> Instagram
                  </a>
                )}
                {facebook && (
                  <a href={facebook} target="_blank" rel="noopener noreferrer">
                    <Facebook size={19} /> Facebook
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        <ShareCard />
      </main>

      <footer>
        <a className="brand brand-image-link" href="#inicio" aria-label="Abigail Sánchez, psicóloga">
          <img
            src="/logo-abigail.png"
            alt="Abigail Sánchez · Psicóloga"
            className="brand-logo-img footer-brand-img"
            width="820"
            height="640"
          />
        </a>
        <span>Psicología y servicios organizacionales</span>

        <div className="footer-actions">
          <button
            type="button"
            className="admin-link-btn"
            onClick={openAdmin}
            title="Panel de Administración (Días, Horarios y Google Calendar)"
          >
            <Lock size={14} /> Panel Administrador
          </button>
          <button
            type="button"
            ref={settingsButton}
            aria-label="Panel Administrador"
            title="Panel Administrador"
            onClick={openAdmin}
          >
            <Settings size={17} />
          </button>
        </div>
      </footer>

      {!showIntro && (
        <div className="floating">
          <Booking className="button small" />
          <Whatsapp className="button small floating-wa" />
        </div>
      )}

      {notice && (
        <div className="toast" role="status">
          <Check size={18} />
          {notice}
        </div>
      )}

      {/* PANEL DE ADMINISTRADOR EN MODAL RESPONSIVO */}
      <AdminPanel
        isOpen={currentView === "admin"}
        initialConfig={schedule}
        onSaveConfig={handleSaveSchedule}
        onClose={closeAdmin}
      />
    </>
  );
}

function IntroCard() {
  const isDirectAdmin =
    location.pathname === "/admin" ||
    location.pathname === "/configuracion" ||
    location.hash === "#admin";

  const [showIntro, setShowIntro] = useState(
    () =>
      !isDirectAdmin &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (!showIntro) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const finish = () => setShowIntro(false);
    const timeout = window.setTimeout(finish, 2200);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => {
      if (motion.matches) finish();
    };
    motion.addEventListener("change", onMotionChange);
    return () => {
      window.clearTimeout(timeout);
      motion.removeEventListener("change", onMotionChange);
      document.body.style.overflow = previousOverflow;
    };
  }, [showIntro]);

  return (
    <>
      <div
        inert={showIntro}
        aria-hidden={showIntro || undefined}
        className={`app-wrapper ${showIntro ? "is-revealing-behind" : "is-revealed"}`}
      >
        <App showIntro={showIntro} />
      </div>
      {showIntro && (
        <div className="opening-intro" aria-label="Abigail Sánchez, psicóloga">
          <div className="opening-intro-content">
            <div className="opening-emblem-clean">
              <img
                className="opening-logo-clean"
                src="/ilustracion.png?v=6"
                alt="Emblema de Abigail Sánchez: mente, corazón y hojas entrelazados"
                width="1024"
                height="682"
              />
            </div>
            <div className="opening-name">
              <p>Abigail Sánchez</p>
              <span>PSICÓLOGA</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <IntroCard />
  </React.StrictMode>,
);
