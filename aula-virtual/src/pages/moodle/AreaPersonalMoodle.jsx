// Área Personal de Moodle — dashboard de 4 tarjetas + línea de tiempo +
// calendario descargable. Separado de "Mis cursos" (ver MisCursosMoodle.jsx)
// por la barra MoodleSubnav, tal como lo aclaró la usuaria.

import { useEffect, useMemo, useState } from 'react';
import { lmsService } from '@api/lmsService';
import MoodleHeader from '@layout/MoodleHeader';
import MoodleSubnav from '@layout/MoodleSubnav';
import AulaFooter from '@layout/AulaFooter';
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

      <AulaFooter />
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

  const diasConActividad = useMemo(() => {
    const map = new Map();
    (actividades || []).forEach((a) => {
      const key = new Date(a.fecha_limite).toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    });
    return map;
  }, [actividades]);

  const primerDiaSemana = (mesBase.getDay() + 6) % 7; // lunes = 0
  const diasEnMes = new Date(mesBase.getFullYear(), mesBase.getMonth() + 1, 0).getDate();

  const celdas = [];
  for (let i = 0; i < primerDiaSemana; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d);

  const cambiarMes = (delta) => {
    setMesBase((d) => { const n = new Date(d); n.setMonth(n.getMonth() + delta); return n; });
  };

  const descargarIcs = () => {
    const lineas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sapper Industries//Aula Virtual//ES'];
    (actividades || []).forEach((a) => {
      const dt = new Date(a.fecha_limite);
      const stamp = `${dt.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
      lineas.push(
        'BEGIN:VEVENT',
        `UID:${a.content_item_id}@aula.sapper-industries.com`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${stamp}`,
        `SUMMARY:${a.titulo.replace(/\r?\n/g, ' ')}`,
        `DESCRIPTION:${a.course_titulo} - ${a.modulo_titulo}`,
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

  return (
    <section id="calendario" className="apm-seccion">
      <div className="apm-cal-header">
        <h2>{t('calendario')}</h2>
        <button className="apm-descargar" onClick={descargarIcs}>
          <i className="fa-solid fa-download" /> {t('descargar')}
        </button>
      </div>

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
          const items = diasConActividad.get(key);
          return (
            <div key={dia} className={`apm-cal-cell ${items ? 'apm-cal-cell--con-actividad' : ''}`}>
              <span>{dia}</span>
              {items && <i className="fa-solid fa-circle apm-cal-dot" title={items.map((x) => x.titulo).join(', ')} />}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default AreaPersonalMoodle;
