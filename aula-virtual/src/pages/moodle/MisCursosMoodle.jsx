// "Mis cursos" de Moodle — pestaña separada de Área Personal (ver
// MoodleSubnav). Grilla de cursos con buscador, igual que pidió la usuaria.

import { useEffect, useMemo, useState } from 'react';
import { lmsService } from '@api/lmsService';
import MoodleHeader from '@layout/MoodleHeader';
import MoodleSubnav from '@layout/MoodleSubnav';
import MoodleFooter from '@layout/MoodleFooter';
import CursosGrid from '@components/CursosGrid';
import AñadirCursoForm from '@components/AñadirCursoForm';
import { useIdioma } from '@context/IdiomaContext';
import '@pages/MisCursos.css';
import './MisCursosMoodle.css';

const MisCursosMoodle = () => {
  const { t } = useIdioma();
  const [cursos, setCursos] = useState(null);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const cargar = () => {
    lmsService.getMisCursos()
      .then((data) => setCursos(data.moodle))
      .catch(() => setError('No se pudieron cargar tus cursos.'));
  };

  useEffect(cargar, []);

  const cursosFiltrados = useMemo(() => {
    if (!cursos) return [];
    if (!busqueda.trim()) return cursos;
    const q = busqueda.trim().toLowerCase();
    return cursos.filter((c) => c.course.titulo.toLowerCase().includes(q));
  }, [cursos, busqueda]);

  return (
    <div className="mcm-shell">
      <MoodleHeader />
      <MoodleSubnav activo="mis-cursos" />

      <main className="mcm-main">
        <div className="lms-page-header">
          <h1 className="lms-page-title" style={{ marginBottom: 0 }}>{t('misCursos')}</h1>
        </div>

        {cursos && cursos.length > 0 && (
          <div className="mcm-buscador">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              type="text"
              placeholder={t('buscarCursos')}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        )}

        {error && <p className="lms-error">{error}</p>}

        {cursos && cursos.length === 0 && (
          <div className="mcm-vacio">
            <p>Todavía no tienes cursos de Moodle vigentes.</p>
            <AñadirCursoForm onSuccess={cargar} embebido />
          </div>
        )}

        {cursosFiltrados.length > 0 && (
          <CursosGrid cursos={cursosFiltrados} rutaBase="/curso/tradicional" label="Moodle" tipoBadge="trad" />
        )}
        {cursos && cursos.length > 0 && cursosFiltrados.length === 0 && (
          <p className="lms-empty">Sin coincidencias para "{busqueda}".</p>
        )}
      </main>

      <MoodleFooter />
    </div>
  );
};

export default MisCursosMoodle;
