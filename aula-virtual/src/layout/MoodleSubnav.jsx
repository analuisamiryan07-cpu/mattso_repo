// Barra con los dos botones "Área personal" / "Mis cursos" debajo del
// MoodleHeader — así lo aclaró la usuaria: no es que estén pegados, son dos
// pestañas separadas bajo una barra de navegación propia.

import { Link } from 'react-router-dom';
import { useIdioma } from '@context/IdiomaContext';
import './MoodleSubnav.css';

const MoodleSubnav = ({ activo }) => {
  const { t } = useIdioma();
  return (
    <nav className="msn-bar">
      <Link to="/moodle" className={`msn-btn ${activo === 'area-personal' ? 'is-active' : ''}`}>
        {t('areaPersonal')}
      </Link>
      <Link to="/moodle/mis-cursos" className={`msn-btn ${activo === 'mis-cursos' ? 'is-active' : ''}`}>
        {t('misCursos')}
      </Link>
    </nav>
  );
};

export default MoodleSubnav;
