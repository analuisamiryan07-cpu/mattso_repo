import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { cursosService } from '@api/cursosService';

const ESTADO_STYLES = {
  VIGENTE:    { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
  EXPIRADO:   { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
  SUSPENDIDO: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
};

const VerificarCertificado = () => {
  const { codigo } = useParams();
  const [cert, setCert]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    cursosService.verificarCertificado(codigo)
      .then(data => { setCert(data); setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [codigo]);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)' }} />
        <p style={{ color: '#6b7280', margin: 0 }}>Verificando certificado...</p>
      </div>
    );
  }

  if (notFound || !cert) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '40px 20px' }}>
        <div style={{ fontSize: '3rem' }}>❌</div>
        <h2 style={{ margin: 0, color: '#111827' }}>Certificado no encontrado</h2>
        <p style={{ color: '#6b7280', margin: 0, textAlign: 'center' }}>
          El código <strong>{codigo}</strong> no corresponde a ningún certificado emitido por Sapper Industries.
        </p>
      </div>
    );
  }

  const estadoStyle = ESTADO_STYLES[cert.estado] || ESTADO_STYLES['SUSPENDIDO'];

  return (
    <div style={{ maxWidth: 620, margin: '48px auto', padding: '0 20px 60px' }}>

      {/* Encabezado de verificación */}
      <div style={{
        background: 'linear-gradient(135deg, #002147 0%, #1a3d7a 100%)',
        borderRadius: '14px 14px 0 0',
        padding: '28px 32px',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <div style={{ fontSize: '2.5rem', lineHeight: 1 }}>✅</div>
        <div>
          <p style={{ margin: 0, fontSize: '.8rem', letterSpacing: '.1em', opacity: .7, textTransform: 'uppercase' }}>
            Sapper Industries · Verificación de Certificado
          </p>
          <h1 style={{ margin: '4px 0 0', fontSize: '1.35rem', fontWeight: 800 }}>
            Certificado verificado
          </h1>
        </div>
      </div>

      {/* Tabla de datos */}
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 14px 14px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,33,71,.08)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {[
              { label: 'Nombres completos', value: cert.nombres },
              { label: 'Certificado',       value: cert.certificado },
              { label: 'Fecha de emisión',  value: cert.fecha_emision },
              { label: 'Expira',            value: cert.fecha_expiracion },
            ].map(({ label, value }) => (
              <tr key={label} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '14px 24px', color: '#6b7280', fontSize: '.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', width: '40%', background: '#fafafa' }}>
                  {label}
                </td>
                <td style={{ padding: '14px 24px', fontWeight: 600, color: '#111827' }}>
                  {value}
                </td>
              </tr>
            ))}
            <tr>
              <td style={{ padding: '14px 24px', color: '#6b7280', fontSize: '.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', background: '#fafafa' }}>
                Estado
              </td>
              <td style={{ padding: '14px 24px' }}>
                <span style={{
                  display: 'inline-block',
                  background: estadoStyle.bg,
                  color: estadoStyle.color,
                  border: `1px solid ${estadoStyle.border}`,
                  borderRadius: 99,
                  padding: '3px 14px',
                  fontSize: '.8rem',
                  fontWeight: 800,
                  letterSpacing: '.06em',
                }}>
                  {cert.estado}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ padding: '16px 24px', background: '#f8faff', borderTop: '1px solid #e5e7eb' }}>
          <p style={{ margin: 0, fontSize: '.78rem', color: '#9ca3af', textAlign: 'center' }}>
            Código de verificación: <strong style={{ color: '#6b7280', fontFamily: 'monospace' }}>{cert.codigo}</strong>
            {' · '}Sapper Industries
          </p>
        </div>
      </div>

    </div>
  );
};

export default VerificarCertificado;
