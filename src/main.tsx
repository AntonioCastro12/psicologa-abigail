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
} from "lucide-react";
import "./style.css";
import "./refinements.css";
import { ShareCard } from "./ShareCard";
const KEY = "abigail-preferencias-v1";
const defaults = {
  available: true,
  phone: "524427045630",
  message:
    "Hola, quisiera agendar una cita. ¿Me puedes compartir los horarios disponibles?",
  intro:
    "Soy Abigail Sánchez, psicóloga. Te acompaño a comprender lo que sientes y a construir herramientas para tu día a día.",
  calendar: "",
  instagram: "",
  facebook: "",
  address: "",
  hours: "",
  office: "",
};
type Config = typeof defaults;
function readConfig(): Config {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "{}");
    return Object.fromEntries(
      Object.entries(defaults).map(([k, val]) => [
        k,
        typeof v?.[k] === typeof val ? v[k] : val,
      ]),
    ) as Config;
  } catch {
    return { ...defaults };
  }
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
function App() {
  const [config, setConfig] = useState(readConfig),
    [panel, setPanel] = useState(location.pathname === "/configuracion"),
    [unlocked, setUnlocked] = useState(false),
    [pin, setPin] = useState(""),
    [error, setError] = useState(""),
    [draft, setDraft] = useState(config),
    [notice, setNotice] = useState(""),
    [menu, setMenu] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null),
    settingsButton = useRef<HTMLButtonElement>(null);
  const digits = config.phone.replace(/\D/g, ""),
    phone = /^\d{10,15}$/.test(digits) ? digits : defaults.phone;
  const wa = (message = config.message) =>
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  const calendar = safeUrl(config.calendar, "calendar"),
    instagram = safeUrl(config.instagram),
    facebook = safeUrl(config.facebook);
  useEffect(() => {
    if (panel) {
      dialog.current?.showModal();
      setDraft(config);
      setError("");
    } else {
      dialog.current?.close();
      setUnlocked(false);
      setPin("");
    }
  }, [panel]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    const fn = () => setConfig(readConfig());
    window.addEventListener("storage", fn);
    return () => window.removeEventListener("storage", fn);
  }, []);
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
  function closePanel() {
    setPanel(false);
    if (location.pathname === "/configuracion")
      history.replaceState(null, "", "/");
    settingsButton.current?.focus();
  }
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
  function save(e: React.FormEvent) {
    e.preventDefault();
    const clean = draft.phone.replace(/\D/g, "");
    if (!/^\d{10,15}$/.test(clean)) {
      setError("Escribe de 10 a 15 dígitos, incluido el código de país.");
      return;
    }
    if (draft.calendar && !safeUrl(draft.calendar, "calendar")) {
      setError(
        "Usa un enlace HTTPS de calendar.google.com o calendar.app.google.",
      );
      return;
    }
    if (
      (draft.instagram && !safeUrl(draft.instagram)) ||
      (draft.facebook && !safeUrl(draft.facebook))
    ) {
      setError("Los enlaces de redes deben comenzar con https://.");
      return;
    }
    const next = { ...draft, phone: clean };
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setConfig(next);
      closePanel();
      setNotice("Cambios guardados únicamente en este navegador.");
    } catch {
      setError(
        "No se pudo guardar. Revisa si tu navegador permite almacenamiento local.",
      );
    }
  }
  const Booking = ({
    label = "Agendar cita",
    className = "button",
  }: {
    label?: string;
    className?: string;
  }) =>
    config.available ? (
      <a
        className={className}
        href={calendar || wa(defaults.message)}
        target="_blank"
        rel="noopener noreferrer"
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
    message = config.message,
    className = "button outline",
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
          className="brand"
          href="#inicio"
          aria-label="Abigail Sánchez, inicio"
        >
          AS
          <span>
            ABIGAIL SÁNCHEZ<small>PSICÓLOGA</small>
          </span>
        </a>
        <nav className={menu ? "open" : ""} aria-label="Navegación principal">
          {[
            ["inicio", "Inicio"],
            ["clinicos", "Servicios clínicos"],
            ["organizaciones", "Organizaciones"],
            ["agenda", "Agenda"],
            ["contacto", "Contacto"],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={() => setMenu(false)}>
              {label}
            </a>
          ))}
        </nav>
        <a className="button small header-book" href="#agenda">
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
            <span className={`status ${!config.available ? "closed" : ""}`}>
              <i />
              {config.available
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
            <p className="intro">{config.intro}</p>
            <div className="actions">
              <Booking />
              <Whatsapp />
            </div>
            <div className="quick">
              <a href={`tel:+${phone}`}>
                <Phone size={16} /> Llamar
              </a>
              <a href="mailto:ma.sanvag@gmail.com">
                <Mail size={16} /> Correo
              </a>
              <button onClick={saveContact}>
                <Download size={16} /> Guardar contacto
              </button>
            </div>
            <p className="hero-contact">
              +{phone} <span>·</span>{" "}
              <a href="mailto:ma.sanvag@gmail.com">ma.sanvag@gmail.com</a>
            </p>
          </div>
          <div className="hero-art">
            <div className="stripes top" />
            <img
              className="botanical"
              src="/ilustracion.png"
              width="461"
              height="308"
              alt="Ilustración de la tarjeta original: mente, corazón y hojas entrelazados"
            />
            <div className="signature">
              <img
                src="/marca.png"
                width="630"
                height="470"
                alt="Monograma AS de Abigail Sánchez"
              />
              <span>
                ABIGAIL SÁNCHEZ<small>PSICÓLOGA</small>
              </span>
            </div>
            <div className="stripes bottom" />
          </div>
        </section>
        <div className="approach">
          <span>Un acompañamiento cercano, a tu ritmo.</span>
          <span>
            Enfoque cognitivo-conductual <ArrowUpRight size={17} />
          </span>
        </div>
        <section className="section reveal" id="clinicos">
          <div className="section-heading">
            <div>
              <p className="eyebrow">01 / ATENCIÓN PERSONAL</p>
              <h2>Servicios Clínicos</h2>
            </div>
            <p>
              Cada proceso es diferente.
              <br />
              Encuentra el acompañamiento para ti.
            </p>
          </div>
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
                    config.available && calendar
                      ? calendar
                      : wa(
                          `Hola, quisiera información para una cita de ${name.toLowerCase()}.`,
                        )
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {config.available ? "Agendar cita" : "Consultar por WhatsApp"}
                  <ArrowUpRight size={18} />
                </a>
              </article>
            ))}
          </div>
        </section>
        <section className="section organization reveal" id="organizaciones">
          <div className="org-intro">
            <p className="eyebrow">02 / PERSONAS Y ORGANIZACIONES</p>
            <h2>
              El bienestar también
              <br />
              <em>se construye en equipo.</em>
            </h2>
            <p>Servicios Organizacionales</p>
            <p className="muted">
              Herramientas para acompañar el desarrollo de las personas y
              fortalecer tu organización.
            </p>
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
        </section>
        <section className="section agenda reveal" id="agenda">
          <div>
            <p className="eyebrow">03 / TU PRÓXIMO PASO</p>
            <h2>Agenda tu cita</h2>
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
          </div>
          <div className="availability">
            <span className={`status ${!config.available ? "closed" : ""}`}>
              <i />
              {config.available
                ? "Agenda abierta"
                : "Agenda temporalmente cerrada"}
            </span>
            <h3>Disponibilidad</h3>
            <p>
              {config.available
                ? "Agenda disponible para nuevas citas."
                : "Por el momento no se están recibiendo nuevas citas."}
            </p>
            <Booking
              label={
                calendar
                  ? "Ver horarios disponibles"
                  : "Consultar horarios por WhatsApp"
              }
            />
            <Whatsapp
              label={
                config.available
                  ? "Agendar por WhatsApp"
                  : "Contactar por WhatsApp"
              }
              message={defaults.message}
              className="text-link"
            />
          </div>
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
                  {phone === defaults.phone ? "+52 442 704 5630" : `+${phone}`}
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
            <div className="address">
              <MapPin size={20} />
              <div>
                <small>ATENCIÓN PRESENCIAL Y VIRTUAL</small>
                {config.office && <strong>{config.office}</strong>}
                <p>
                  {config.address ||
                    "Consulta la ubicación del consultorio por WhatsApp."}
                </p>
                {config.hours && <p>{config.hours}</p>}
                <a
                  className="text-link"
                  href={
                    config.address
                      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.address)}`
                      : wa(
                          "Hola, quisiera conocer la ubicación del consultorio y los horarios de atención.",
                        )
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {config.address ? "Cómo llegar" : "Consultar ubicación"}
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </div>
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
        <a className="brand" href="#inicio">
          AS
          <span>
            ABIGAIL SÁNCHEZ<small>PSICÓLOGA</small>
          </span>
        </a>
        <span>Psicología y servicios organizacionales</span>
        <button
          ref={settingsButton}
          aria-label="Configuración local"
          title="Configuración local"
          onClick={() => setPanel(true)}
        >
          <Settings size={17} />
        </button>
      </footer>
      <div className="floating">
        <Booking className="button small" />
        <Whatsapp className="button small floating-wa" />
      </div>
      {notice && (
        <div className="toast" role="status">
          <Check size={18} />
          {notice}
        </div>
      )}
      <dialog
        ref={dialog}
        onCancel={closePanel}
        onClick={(e) => {
          if (e.target === dialog.current) closePanel();
        }}
        aria-labelledby="settings-title"
      >
        <div className="dialog-content">
          <button
            className="close"
            onClick={closePanel}
            aria-label="Cerrar configuración"
          >
            <X />
          </button>
          <p className="eyebrow">SOLO EN ESTE NAVEGADOR</p>
          <h2 id="settings-title">Configuración local</h2>
          {!unlocked ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (pin === "5630") {
                  setUnlocked(true);
                  setError("");
                } else setError("PIN incorrecto. Inténtalo de nuevo.");
              }}
            >
              <p>
                Introduce el PIN para editar las preferencias de esta tarjeta en
                tu dispositivo.
              </p>
              <label>
                PIN
                <input
                  type="password"
                  autoComplete="off"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                />
              </label>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <button className="button" type="submit">
                Entrar
              </button>
              <p className="fine">
                El PIN evita cambios accidentales. No protege información
                privada.
              </p>
            </form>
          ) : (
            <form onSubmit={save}>
              <p className="local-note">
                Los cambios solo se guardan en este navegador. Tus visitantes no
                los verán. Para actualizar la tarjeta para todos, modifica la
                configuración del sitio y vuelve a publicarlo. Gestiona los
                horarios reales en Google Calendar.
              </p>
              <label className="toggle-row">
                Disponible para citas
                <input
                  type="checkbox"
                  role="switch"
                  checked={draft.available}
                  onChange={(e) =>
                    setDraft({ ...draft, available: e.target.checked })
                  }
                />
              </label>
              {(
                [
                  ["phone", "Número de WhatsApp (con código de país)"],
                  ["message", "Mensaje de WhatsApp"],
                  ["intro", "Texto de presentación"],
                  ["calendar", "Enlace de reserva de Google Calendar"],
                  ["office", "Nombre del consultorio"],
                  ["address", "Dirección completa"],
                  ["hours", "Horarios generales"],
                  ["instagram", "Enlace de Instagram"],
                  ["facebook", "Enlace de Facebook"],
                ] as const
              ).map(([key, label]) => (
                <label key={key}>
                  {label}
                  {key === "intro" || key === "message" ? (
                    <textarea
                      rows={3}
                      value={draft[key]}
                      onChange={(e) =>
                        setDraft({ ...draft, [key]: e.target.value })
                      }
                      required
                    />
                  ) : (
                    <input
                      type={
                        ["calendar", "instagram", "facebook"].includes(key)
                          ? "url"
                          : "text"
                      }
                      value={draft[key]}
                      onChange={(e) =>
                        setDraft({ ...draft, [key]: e.target.value })
                      }
                      required={key === "phone"}
                    />
                  )}
                </label>
              ))}
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <button className="button" type="submit">
                Guardar en este navegador <Check size={18} />
              </button>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
function IntroCard() {
  const [showIntro, setShowIntro] = useState(
    () => location.pathname !== "/configuracion" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (!showIntro) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const finish = () => setShowIntro(false);
    const timeout = window.setTimeout(finish, 2000);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => { if (motion.matches) finish(); };
    motion.addEventListener("change", onMotionChange);
    return () => {
      window.clearTimeout(timeout);
      motion.removeEventListener("change", onMotionChange);
      document.body.style.overflow = previousOverflow;
    };
  }, [showIntro]);

  return (
    <>
      <div inert={showIntro} aria-hidden={showIntro || undefined}>
        <App />
      </div>
      {showIntro && (
        <div className="opening-intro" aria-label="Abigail Sánchez, psicóloga">
          <div className="opening-intro-content">
            <div className="opening-emblem">
              <span className="opening-lines opening-lines-right" aria-hidden="true" />
              <span className="opening-lines opening-lines-left" aria-hidden="true" />
              <img className="opening-logo" src="/ilustracion.png" alt="Emblema de Abigail Sánchez: mente, corazón y hojas entrelazados" width="461" height="308" />
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
