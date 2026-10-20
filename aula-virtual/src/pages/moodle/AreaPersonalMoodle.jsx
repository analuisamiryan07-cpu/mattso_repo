// Área Personal de Moodle — dashboard de 4 tarjetas + línea de tiempo +
// calendario descargable. Separado de "Mis cursos" (ver MisCursosMoodle.jsx)
// por la barra MoodleSubnav, tal como lo aclaró la usuaria.

import { useEffect, useMemo, useState } from 'react';
import { lmsService } from '@api/lmsService';
import MoodleHeader from '@layout/MoodleHeader';
import MoodleSubnav from '@layout/MoodleSubnav';
import MoodleFooter from '@layout/MoodleFooter';
import TileResumen from '@components/TileResumen';
import { useIdioma } from '@context/IdiomaContext';
import '@components/TileResumen.css';
import './AreaPersonalMoodle.css';

const AreaPersonalMoodle = () => {
  const { t } = useIdioma();
  const [resumen, setResumen] = useState(null);
  const [actividades, setActividades] = useState(null);

  useEffect(() => {
    lmsService.getResumenModalidad('TRADICIONAL').then(setResumen).catch(() => {});
    lmsService.getLineaDeTiempo().then(setActividades).catch(() => setActividades([]));
  }, []);

  useEffect(() => {
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 150);
    }
  }, []);

  return (
    <div className="apm-shell">
      <MoodleHeader />
      <MoodleSubnav activo="area-personal" />

      <main className="apm-main">
        <h1 className="apm-title">{t('areaPersonal')}</h1>

        {resumen && (
          <div className="tr-tiles">
            <TileResumen icono="fa-graduation-cap" valor={resumen.cursos_inscritos} label={t('cursosInscritos')} />
            <TileResumen icono="fa-circle-check" valor={resumen.cursos_completados} label={t('cursosCompletados')} />
            <TileResumen icono="fa-hourglass-half" valor={`${resumen.actividades_pendientes_pct}%`} label={t('actividadesPendientes')} />
            <TileResumen icono="fa-chart-line" valor={`${resumen.actividades_completadas_pct}%`} label={t('actividadesCompletadas')} />
          </div>
        )}

        <LineaDeTiempo actividades={actividades} />
        <Calendario actividades={actividades} />
      </main>

      <MoodleFooter />
    </div>
  );
};

const LineaDeTiempo = ({ actividades }) => {
  const { t } = useIdioma();
  const [filtro, setFiltro] = useState('todos');
  const [orden, setOrden] = useState('asc');
  const [busqueda, setBusqueda] = useState('');

  const lista = useMemo(() => {
    if (!actividades) return [];
    let r = actividades.filter((a) => a.estado !== 'COMPLETADO');
    if (filtro === 'atrasados') r = r.filter((a) => a.estado === 'ATRASADO');
    if (filtro === 'proximos') r = r.filter((a) => a.estado === 'PENDIENTE');
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      r = r.filter((a) => a.titulo.toLowerCase().includes(q));
    }
    r = [...r].sort((a, b) => {
      const diff = new Date(a.fecha_limite) - new Date(b.fecha_limite);
      return orden === 'asc' ? diff : -diff;
    });
    return r;
  }, [actividades, filtro, orden, busqueda]);

  return (
    <section id="linea-de-tiempo" className="apm-seccion">
      <h2>{t('lineaDeTiempo')}</h2>

      <div className="apm-filtros">
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="todos">{t('atrasados')} + {t('proximos')}</option>
          <option value="atrasados">{t('atrasados')}</option>
          <option value="proximos">{t('proximos')}</option>
        </select>
        <select value={orden} onChange={(e) => setOrden(e.target.value)}>
          <option value="asc">{t('ordenarPorFecha')} ↑</option>
          <option value="desc">{t('ordenarPorFecha')} ↓</option>
        </select>
        <input
          type="text"
          placeholder={t('buscarActividad')}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {actividades === null && <p className="apm-vacio">Cargando…</p>}
      {actividades && lista.length === 0 && <p className="apm-vacio">{t('sinActividades')}</p>}

      <ul className="apm-lista">
        {lista.map((a) => (
          <li key={a.content_item_id} className="apm-item">
            <span className={`apm-tag apm-tag--${a.estado.toLowerCase()}`}>
              {a.estado === 'ATRASADO' ? t('atrasados') : t('proximos')}
            </span>
            <div className="apm-item-info">
              <strong>{a.titulo}</strong>
              <small>{a.course_titulo} · {a.modulo_titulo}</small>
            </div>
            <time>{new Date(a.fecha_limite).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })}</time>
          </li>
        ))}
      </ul>
    </section>
  );
};

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const Calendario = ({ actividades }) => {
  const { t } = useIdioma();
  const [mesBase, setMesBase] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [eventos, setEventos] = useState(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null); // 'YYYY-MM-DD'
  const [mostrarForm, setMostrarForm] = useState(false);

  const cargarEventos = () => {
    lmsService.getEventosPersonales().then(setEventos).catch(() => setEventos([]));
  };
  useEffect(cargarEventos, []);

  // Un solo mapa clave=día con ambos tipos, para pintar los puntos y el
  // detalle del día — las actividades (tareas/exámenes) son de solo
  // lectura, los eventos personales se pueden borrar.
  const diasConAlgo = useMemo(() => {
    const map = new Map();
    const push = (key, item) => {
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    };
    (actividades || []).forEach((a) => push(new Date(a.fecha_limite).toISOString().slice(0, 10), { ...a, origen: 'actividad' }));
    (eventos || []).forEach((e) => push(new Date(e.fecha).toISOString().slice(0, 10), { ...e, origen: 'evento' }));
    return map;
  }, [actividades, eventos]);

  const primerDiaSemana = (mesBase.getDay() + 6) % 7; // lunes = 0
  const diasEnMes = new Date(mesBase.getFullYear(), mesBase.getMonth() + 1, 0).getDate();

  const celdas = [];
  for (let i = 0; i < primerDiaSemana; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d);

  const cambiarMes = (delta) => {
    setMesBase((d) => { const n = new Date(d); n.setMonth(n.getMonth() + delta); return n; });
    setDiaSeleccionado(null);
  };

  const eliminarEvento = async (id) => {
    await lmsService.eliminarEventoPersonal(id).catch(() => {});
    cargarEventos();
  };

  const descargarIcs = () => {
    const lineas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sapper Industries//Aula Virtual//ES'];
    const stampDe = (fecha) => `${new Date(fecha).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
    (actividades || []).forEach((a) => {
      lineas.push(
        'BEGIN:VEVENT',
        `UID:${a.content_item_id}@aula.sapper-industries.com`,
        `DTSTAMP:${stampDe(a.fecha_limite)}`,
        `DTSTART:${stampDe(a.fecha_limite)}`,
        `SUMMARY:${a.titulo.replace(/\r?\n/g, ' ')}`,
        `DESCRIPTION:${a.course_titulo} - ${a.modulo_titulo}`,
        'END:VEVENT',
      );
    });
    (eventos || []).forEach((e) => {
      lineas.push(
        'BEGIN:VEVENT',
        `UID:${e.id}@aula.sapper-industries.com`,
        `DTSTAMP:${stampDe(e.fecha)}`,
        `DTSTART:${stampDe(e.fecha)}`,
        `SUMMARY:${e.titulo.replace(/\r?\n/g, ' ')}`,
        'END:VEVENT',
      );
    });
    lineas.push('END:VCALENDAR');
    const blob = new Blob([lineas.join('\r\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mis-actividades-moodle.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  const nombreMes = mesBase.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
  const itemsDelDia = diaSeleccionado ? (diasConAlgo.get(diaSeleccionado) || []) : [];

  return (
    <section id="calendario" className="apm-seccion">
      <div className="apm-cal-header">
        <h2>{t('calendario')}</h2>
        <div className="apm-cal-header-btns">
          <button className="apm-nuevo-evento" onClick={() => setMostrarForm((v) => !v)}>
            <i className="fa-solid fa-plus" /> Nuevo evento
          </button>
          <button className="apm-descargar" onClick={descargarIcs}>
            <i className="fa-solid fa-download" /> {t('descargar')}
          </button>
        </div>
      </div>

      {mostrarForm && (
        <NuevoEventoForm
          onCreado={() => { setMostrarForm(false); cargarEventos(); }}
          onCancel={() => setMostrarForm(false)}
        />
      )}

      <div className="apm-cal-nav">
        <button onClick={() => cambiarMes(-1)}><i className="fa-solid fa-chevron-left" /></button>
        <strong>{nombreMes}</strong>
        <button onClick={() => cambiarMes(1)}><i className="fa-solid fa-chevron-right" /></button>
      </div>

      <div className="apm-cal-grid">
        {DIAS_SEMANA.map((d) => <div key={d} className="apm-cal-dow">{d}</div>)}
        {celdas.map((dia, i) => {
          if (!dia) return <div key={`vacio-${i}`} className="apm-cal-cell apm-cal-cell--vacia" />;
          const key = new Date(mesBase.getFullYear(), mesBase.getMonth(), dia).toISOString().slice(0, 10);
          const items = diasConAlgo.get(key);
          return (
            <button
              key={dia}
              className={`apm-cal-cell ${items ? 'apm-cal-cell--con-actividad' : ''} ${diaSeleccionado === key ? 'apm-cal-cell--seleccionada' : ''}`}
              onClick={() => setDiaSeleccionado(key === diaSeleccionado ? null : key)}
            >
              <span>{dia}</span>
              {items && <i className="fa-solid fa-circle apm-cal-dot" title={items.map((x) => x.titulo).join(', ')} />}
            </button>
          );
        })}
      </div>

      {diaSeleccionado && (
        <div className="apm-dia-detalle">
          <h3>{new Date(`${diaSeleccionado}T00:00:00`).toLocaleDateString('es-EC', { dateStyle: 'full' })}</h3>
          {itemsDelDia.length === 0 && <p className="apm-vacio">Nada para este día.</p>}
          <ul>
            {itemsDelDia.map((item) => (
              <li key={`${item.origen}-${item.id || item.content_item_id}`}>
                <span>{item.titulo}</span>
                {item.origen === 'evento' && (
                  <button className="apm-borrar-evento" onClick={() => eliminarEvento(item.id)} title="Eliminar">
                    <i className="fa-solid fa-trash" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

const NuevoEventoForm = ({ onCreado, onCancel }) => {
  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !fecha) { setError('Completa el título y la fecha.'); return; }
    setGuardando(true);
    setError('');
    try {
      await lmsService.crearEventoPersonal(titulo.trim(), new Date(fecha).toISOString());
      onCreado();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear el evento.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className="apm-evento-form" onSubmit={handleSubmit}>
      <input type="text" placeholder="Título del evento" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      <input type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      <button type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
      <button type="button" onClick={onCancel}>Cancelar</button>
      {error && <p className="apm-error">{error}</p>}
    </form>
  );
};

export default AreaPersonalMoodle;
