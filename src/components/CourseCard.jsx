import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@context/CartContext';
import { useToast } from '@context/ToastContext';
import CloudinaryImage from '@components/ui/CloudinaryImage';
import './CourseCard.css';

/**
 * Tarjeta de curso/certificación reutilizable.
 * Recibe un objeto `course` con el esquema unificado:
 * { id, titulo, precio, imagen, categoria, modalidad, horas, vigencia, inicia, slug, tipo }
 */
const CourseCard = ({ course }) => {
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const isCertificacion = course.tipo === 'certificacion';
  const badgeColor = isCertificacion ? '#8E24AA' : 'var(--primary-yellow)';
  const badgeText = isCertificacion ? 'CERTIFICACIÓN' : 'CAPACITACIÓN';
  const detailPath = isCertificacion
    ? `/certificacion/${course.slug}`
    : `/capacitacion/${course.slug}`;

  const handleAddToCart = () => {
    addToCart(course);
    addToast(`"${course.titulo}" añadido al carrito`, 'success');
  };

  return (
    <div className="course-card-modern">
      <div className="ccm__image">
        <CloudinaryImage
          publicId={`${course.cloudinaryFolder}/hero`}
          alt={course.titulo}
          width={400}
          height={250}
        />
        <span className="ccm__badge" style={{ background: badgeColor }}>
          {badgeText}
        </span>
      </div>

      <div className="ccm__body">
        <h3 className="ccm__title">{course.titulo}</h3>

        {course.inicia && (
          <p className="ccm__date">
            <i className="fa-regular fa-calendar" /> Inicia: {course.inicia}
          </p>
        )}

        <div className="ccm__metrics">
          <div className="ccm__metric">
            <i className="fa-regular fa-clock" />
            <span>{course.horas}</span>
          </div>
          <div className="ccm__metric">
            <i className={course.modalidad === 'Presencial' ? 'fa-solid fa-users' : 'fa-solid fa-laptop'} />
            <span>{course.modalidad}</span>
          </div>
          {course.vigencia && (
            <div className="ccm__metric">
              <i className="fa-solid fa-shield-halved" />
              <span>{course.vigencia} año{course.vigencia !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        <p className="ccm__price">
          <span>Inversión:</span>
          <strong>${course.precio?.toFixed(2)}</strong>
        </p>

        <div className="ccm__actions">
          <button className="ccm__btn-cart" onClick={handleAddToCart}>
            <i className="fa-solid fa-cart-plus" /> Agregar
          </button>
          <Link to={detailPath} state={{ cert: course }} className="ccm__btn-info">
            Ver más
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
