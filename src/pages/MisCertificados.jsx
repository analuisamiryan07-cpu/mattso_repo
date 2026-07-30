import React, { useState, useCallback } from 'react';
import { certificatesService } from '@api/certificatesService';
import './MisCertificados.css';

function formatSize(bytes) {
  if (!bytes) return null;
  const n = parseInt(bytes, 10);
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
}

function PreviewModal({ file, onClose }) {
  return (
    <div className="cert-modal-backdrop" onClick={onClose}>
      <div className="cert-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cert-modal-header">
          <span className="cert-modal-title">{file.name}</span>
          <button className="cert-modal-close" onClick={onClose} aria-label="Cerrar">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="cert-modal-body">
          <iframe src={file.viewUrl} title={file.name} allowFullScreen />
        </div>
      </div>
    </div>
  );
}

function CertCard({ file, onPreview }) {
  const size = formatSize(file.size);
  const date = formatDate(file.modifiedTime);

  return (
    <div className="cert-card">
      <div className="cert-card-top">
        <div className="cert-icon cert-icon--pdf">
          <i className="fa-regular fa-file-pdf" />
        </div>
        <div className="cert-info">
          <p className="cert-name">{file.name.replace(/\.pdf$/i, '')}</p>
          {file.curso && <p className="cert-curso">{file.curso}</p>}
          {(date || size) && (
            <p className="cert-meta">{[date, size].filter(Boolean).join(' · ')}</p>
          )}
        </div>
      </div>
      <div className="cert-actions">
        <button className="cert-btn cert-btn--view" onClick={() => onPreview(file)}>
          <i className="fa-regular fa-eye" />
          <span>Ver</span>
        </button>
        <a
          className="cert-btn cert-btn--download"
          href={file.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          download
        >
          <i className="fa-solid fa-download" />
          <span>Descargar</span>
        </a>
      </div>
    </div>
  );
}

const MisCertificados = () => {
  const [nombre, setNombre]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState(null);
  const [searched, setSearched] = useState(false);
  const [preview, setPreview]   = useState(null);

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    const clean = nombre.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, '').trim();
    if (clean.length < 2) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSearched(true);

    try {
      const data = await certificatesService.searchByName(clean);
      setResult(data);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        setError('No encontramos certificados para ese nombre. Verifica la ortografía e intenta con tus apellidos.');
      } else if (status === 400) {
        setError('Ingresa al menos 2 letras de tu nombre o apellido.');
      } else if (status === 429) {
        setError('Demasiadas consultas. Espera un momento e intenta de nuevo.');
      } else if (status === 503) {
        setError('El servicio aún no está disponible. Contáctanos para más información.');
      } else {
        setError('Ocurrió un error al consultar. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  }, [nombre]);

  const canSearch = nombre.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, '').trim().length >= 2;

  return (
    <div className="certs-page">

      <section className="certs-hero">
        <div className="certs-hero-content">
          <h1>Mis <span>Certificados</span></h1>
          <p>Consulta y descarga tus certificados ingresando tu nombre o apellido.</p>
        </div>
      </section>

      <div className="certs-body">

        <div className="certs-search-wrap">
          <label className="certs-search-label" htmlFor="nombre-input">
            Nombre o apellido
          </label>
          <form className="certs-search-box" onSubmit={handleSearch}>
            <input
              id="nombre-input"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Rodríguez Tacuri"
              maxLength={100}
              autoComplete="off"
              aria-label="Nombre o apellido"
            />
            <button
              className="certs-search-btn"
              type="submit"
              disabled={loading || !canSearch}
            >
              {loading
                ? <><i className="fa-solid fa-circle-notch fa-spin" /> Buscando…</>
                : <><i className="fa-solid fa-magnifying-glass" /> <span>Buscar</span></>
              }
            </button>
          </form>
          <p className="certs-search-hint">Puedes buscar solo con tus apellidos para ver todos tus certificados.</p>
        </div>

        {loading && (
          <div className="certs-state">
            <div className="certs-spinner" />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Consultando tu historial de certificados…
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="certs-state certs-state--error">
            <div className="certs-state-icon"><i className="fa-solid fa-circle-exclamation" /></div>
            <h3>No encontramos resultados</h3>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && !searched && (
          <div className="certs-state">
            <div className="certs-state-icon"><i className="fa-solid fa-folder-open" /></div>
            <h3>Consulta tus certificados</h3>
            <p>Ingresa tu nombre o apellido en el buscador para ver todos tus certificados emitidos.</p>
          </div>
        )}

        {!loading && result && (
          <>
            <div className="certs-result-header">
              <h2>Certificados de <em>{result.nombre}</em></h2>
              <span className="certs-count-badge">
                {result.total} {result.total === 1 ? 'documento' : 'documentos'}
              </span>
            </div>
            <div className="certs-grid">
              {result.certificados.map((file) => (
                <CertCard key={file.id} file={file} onPreview={setPreview} />
              ))}
            </div>
          </>
        )}

      </div>

      {preview && <PreviewModal file={preview} onClose={() => setPreview(null)} />}

    </div>
  );
};

export default MisCertificados;
