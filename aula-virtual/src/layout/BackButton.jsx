// Botón de regreso reutilizable — la usuaria pidió que "cada UI" lo tenga.
// Por defecto vuelve al Panel General; `to` lo sobrescribe si hace falta
// volver a otro lado puntual.

import { Link } from 'react-router-dom';
import './BackButton.css';

const BackButton = ({ to = '/', label = 'Volver' }) => (
  <Link to={to} className="bb-link">
    <i className="fa-solid fa-arrow-left" /> {label}
  </Link>
);

export default BackButton;
