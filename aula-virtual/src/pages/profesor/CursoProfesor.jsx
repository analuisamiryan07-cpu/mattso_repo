// Detalle de curso del profesor: módulos + contenido, con formularios para
// agregar ambos. Para VIDEO/DOCUMENT se pide la URL de Cloudinary a mano
// (pegar el link después de subir el archivo desde cloudinary.com) — un
// selector de archivo con subida directa desde el navegador queda pendiente
// (necesita un upload preset firmado, ver Moodles/lms/docs/INTEGRACION.md).

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { lmsService } from '@api/lmsService';
import { useToast } from '@context/ToastContext';
import './CursoProfesor.css';

const TIPOS = [
  { value: 'DOCUMENT', label: 'Documento' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'ASSIGNMENT', label: 'Tarea' },
  { value: 'QUIZ', label: 'Quiz (crear preguntas próximamente)' },
];

const CursoProfesor = () => {
  const { courseId } = useParams();
  const { addToast } = useToast();
  const [curso, setCurso] = useState(null);
  const [moduloActivo, setModuloActivo] = useState(null);
  const [nuevoModulo, setNuevoModulo] = useState('');
  const [nuevoModuloModo, setNuevoModuloModo] = useState('TRADICIONAL');
  const [nuevoContenido, setNuevoContenido] = useState({ titulo: '', item_type: 'DOCUMENT', cloudinary_url: '', video_duration_seconds: '', assignment_instructions: '' });
  const [guardando, setGuardando] = useState(false);

  const cargar = () => {
    lmsService.getMiCursoProfesor(courseId).then(setCurso).catch(() => addToast('No se pudo cargar el curso.', 'error'));
  };
  useEffect(cargar, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (curso && !curso.modo_moodle && curso.modo_coursera) setNuevoModuloModo('ASINCRONO_VOD');
  }, [curso]);

  // Un curso puede tener las dos modalidades — el orden del módulo es
  // independiente por modalidad (module_id_delivery_mode_sequence_order en
  // el backend), por eso el sequence_order se calcula contando solo los
  // módulos de la modalidad elegida, no todos.
  const handleCrearModulo = async (e) => {
    e.preventDefault();
    if (!nuevoModulo.trim()) return;
    const modulosDeEstaModalidad = (curso?.modules ?? []).filter((m) => m.delivery_mode === nuevoModuloModo);
    const sequence_order = modulosDeEstaModalidad.length + 1;
    try {
      await lmsService.crearModuloProfesor(courseId, { titulo: nuevoModulo, delivery_mode: nuevoModuloModo, sequence_order });
      setNuevoModulo('');
      addToast('Módulo creado.', 'success');
      cargar();
    } catch (err) {
      addToast(err.response?.data?.message || 'No se pudo crear el módulo.', 'error');
    }
  };

  const handleCrearContenido = async (e) => {
    e.preventDefault();
    if (!moduloActivo) return;
    if (!nuevoContenido.titulo.trim()) { addToast('Ponle un título al contenido.', 'error'); return; }
    if (nuevoContenido.item_type === 'VIDEO' && (!nuevoContenido.cloudinary_url || !nuevoContenido.video_duration_seconds)) {
      addToast('Para video hace falta la URL de Cloudinary y la duración en segundos.', 'error');
      return;
    }
    const modulo = curso.modules.find((m) => m.id === moduloActivo);
    const sequence_order = (modulo?.content_items?.length ?? 0) + 1;

    setGuardando(true);
    try {
      await lmsService.crearContenidoProfesor(moduloActivo, {
        titulo: nuevoContenido.titulo,
        item_type: nuevoContenido.item_type,
        sequence_order,
        cloudinary_url: nuevoContenido.cloudinary_url || undefined,
        cloudinary_public_id: nuevoContenido.cloudinary_url ? nuevoContenido.titulo : undefined,
        video_duration_seconds: nuevoContenido.video_duration_seconds ? Number(nuevoContenido.video_duration_seconds) : undefined,
        assignment_instructions: nuevoContenido.assignment_instructions || undefined,
      });
      addToast('Contenido agregado.', 'success');
      setNuevoContenido({ titulo: '', item_type: 'DOCUMENT', cloudinary_url: '', video_duration_seconds: '', assignment_instructions: '' });
      cargar();
    } catch (err) {
      addToast(err.response?.data?.message || 'No se pudo agregar el contenido.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  if (!curso) return <p>Cargando…</p>;

  return (
    <div className="cp">
      <Link to="/" className="cp-back"><i className="fa-solid fa-arrow-left" /> Mis cursos</Link>
      <h1 className="cp-title">{curso.titulo}</h1>

      <div className="cp-layout">
        <div className="cp-modulos">
          {curso.modules.map((m) => (
            <div key={m.id} className="cp-modulo">
              <div className="cp-modulo-head">
                <b>
                  <span className="cp-tipo-tag">{m.delivery_mode === 'ASINCRONO_VOD' ? 'Coursera' : 'Moodle'}</span>{' '}
                  {m.sequence_order}. {m.titulo}
                </b>
                <button className="cp-add-content-btn" onClick={() => setModuloActivo(m.id)}>+ Contenido</button>
              </div>
              <ul>
                {m.content_items.map((item) => (
                  <li key={item.id}>
                    <i className={`fa-solid ${{ VIDEO: 'fa-circle-play', DOCUMENT: 'fa-file-lines', ASSIGNMENT: 'fa-file-pen', QUIZ: 'fa-list-check' }[item.item_type]}`} />
                    {item.titulo}
                    <span className="cp-tipo-tag">{item.item_type}</span>
                  </li>
                ))}
                {m.content_items.length === 0 && <li className="cp-empty">Sin contenido todavía.</li>}
              </ul>
            </div>
          ))}
          {curso.modules.length === 0 && <p className="cp-empty">Todavía no hay módulos.</p>}

          <form className="cp-form" onSubmit={handleCrearModulo}>
            <input
              type="text" placeholder="Título del nuevo módulo"
              value={nuevoModulo}
              onChange={(e) => setNuevoModulo(e.target.value)}
            />
            {curso.modo_moodle && curso.modo_coursera && (
              <select value={nuevoModuloModo} onChange={(e) => setNuevoModuloModo(e.target.value)}>
                <option value="TRADICIONAL">Moodle</option>
                <option value="ASINCRONO_VOD">Coursera</option>
              </select>
            )}
            <button type="submit" className="cp-btn">+ Agregar módulo</button>
          </form>
        </div>

        {moduloActivo && (
          <form className="cp-form cp-content-form" onSubmit={handleCrearContenido}>
            <h2>Nuevo contenido en "{curso.modules.find((m) => m.id === moduloActivo)?.titulo}"</h2>
            <input
              type="text" placeholder="Título"
              value={nuevoContenido.titulo}
              onChange={(e) => setNuevoContenido((p) => ({ ...p, titulo: e.target.value }))}
            />
            <select
              value={nuevoContenido.item_type}
              onChange={(e) => setNuevoContenido((p) => ({ ...p, item_type: e.target.value }))}
            >
              {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>

            {(nuevoContenido.item_type === 'VIDEO' || nuevoContenido.item_type === 'DOCUMENT') && (
              <input
                type="text" placeholder="URL de Cloudinary"
                value={nuevoContenido.cloudinary_url}
                onChange={(e) => setNuevoContenido((p) => ({ ...p, cloudinary_url: e.target.value }))}
              />
            )}
            {nuevoContenido.item_type === 'VIDEO' && (
              <input
                type="number" placeholder="Duración en segundos"
                value={nuevoContenido.video_duration_seconds}
                onChange={(e) => setNuevoContenido((p) => ({ ...p, video_duration_seconds: e.target.value }))}
              />
            )}
            {nuevoContenido.item_type === 'ASSIGNMENT' && (
              <textarea
                placeholder="Instrucciones de la tarea"
                value={nuevoContenido.assignment_instructions}
                onChange={(e) => setNuevoContenido((p) => ({ ...p, assignment_instructions: e.target.value }))}
              />
            )}
            {nuevoContenido.item_type === 'QUIZ' && (
              <p className="cp-hint">El contenido QUIZ se crea vacío — las preguntas se agregan después (todavía no tiene formulario aquí).</p>
            )}

            <div className="cp-form-actions">
              <button type="button" className="cp-btn-ghost" onClick={() => setModuloActivo(null)}>Cancelar</button>
              <button type="submit" className="cp-btn" disabled={guardando}>{guardando ? 'Guardando…' : 'Agregar'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CursoProfesor;
