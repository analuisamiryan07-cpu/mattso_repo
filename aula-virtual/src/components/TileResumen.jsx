// Una de las 4 tarjetas del dashboard de Área Personal — la usan tanto
// Coursera (AreaPersonal.jsx) como Moodle (moodle/AreaPersonalMoodle.jsx).
import './TileResumen.css';

const TileResumen = ({ icono, valor, label }) => (
  <div className="tr-tile">
    <i className={`fa-solid ${icono}`} />
    <strong>{valor}</strong>
    <span>{label}</span>
  </div>
);

export default TileResumen;
