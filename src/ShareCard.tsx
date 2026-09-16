import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, QrCode } from 'lucide-react';

function publicLink(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname;
    if (url.protocol !== 'https:' || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.includes(':') || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return '';
    url.hash = '';
    return url.href;
  } catch { return ''; }
}

export function ShareCard() {
  const hostedLink = publicLink(window.location.origin + window.location.pathname);
  const [link, setLink] = useState(hostedLink);
  const [draft, setDraft] = useState('');
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setImage('');
    if (link) QRCode.toDataURL(link, {
      width: 1024, margin: 4, errorCorrectionLevel: 'M',
      color: { dark: '#493b31', light: '#ffffff' },
    }).then(result => { if (active) setImage(result); })
      .catch(() => { if (active) setError('No se pudo generar el QR. Vuelve a intentarlo.'); });
    return () => { active = false; };
  }, [link]);
  return <section className="share-card" aria-labelledby="share-title">
    <div className="share-copy">
      <p className="eyebrow">MI TARJETA, SIEMPRE A MANO</p>
      <h2 id="share-title">Escanea y conecta.</h2>
      <p>Abre esta tarjeta en tu teléfono escaneando el código QR.</p>
      {image && <a className="button outline" href={image} download="QR-Abigail-Sanchez.png"><Download size={18} /> Descargar QR</a>}
      {!hostedLink && <form className="qr-link-form" onSubmit={e => {
        e.preventDefault(); const valid = publicLink(draft.trim());
        if (!valid) { setError('Introduce el enlace HTTPS donde está publicada la tarjeta.'); return; }
        setError(''); setLink(valid);
      }}>
        <label htmlFor="qr-public-link">Enlace publicado de la tarjeta</label>
        <input id="qr-public-link" type="url" required value={draft} onChange={e => setDraft(e.target.value)} placeholder="https://tu-tarjeta.com" />
        <button className="button small" type="submit">Generar QR</button>
        <p className="fine">En la versión publicada se usará automáticamente la dirección del sitio. Aquí puedes indicar el enlace para generar y descargar el QR.</p>
      </form>}
      {error && <p role="alert" className="error">{error}</p>}
    </div>
    <div className="qr-frame">
      {image ? <><img src={image} width="224" height="224" alt="Código QR para abrir la tarjeta de Abigail Sánchez" /><a className="qr-destination" href={link} target="_blank" rel="noopener noreferrer">{link}</a></> : <div className="qr-empty"><QrCode size={44} strokeWidth={1} /><p>{link ? 'Preparando tu QR…' : 'Añade el enlace publicado para generar tu QR.'}</p></div>}
      <span>ABIGAIL SÁNCHEZ · PSICÓLOGA</span>
    </div>
  </section>;
}
