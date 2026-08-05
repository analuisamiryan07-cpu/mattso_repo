import React from 'react';
import { Link } from 'react-router-dom';
import './Terminos.css';

const Terminos = () => {
  return (
    <div className="terminos-page">

      <section className="terminos-hero">
        <div className="terminos-hero-overlay" />
        <div className="terminos-hero-content">
          <h1>Términos y Condiciones</h1>
          <p>Última actualización: enero de 2026</p>
        </div>
      </section>

      <div className="container terminos-body">

        <div className="terminos-intro">
          <p>
            Bienvenido a <strong>Sapper Industries</strong>. Al acceder y utilizar nuestra plataforma
            de capacitación y certificación profesional, usted acepta estos Términos y Condiciones.
            Le recomendamos leerlos detenidamente antes de utilizar nuestros servicios.
          </p>
        </div>

        <section className="terminos-section">
          <h2>1. Uso de la plataforma</h2>
          <p>
            Al registrarse en Sapper Industries, usted declara que la información proporcionada es
            verdadera, completa y actualizada. Queda prohibido el uso de la plataforma con fines
            ilícitos, fraudulentos o contrarios a la ley ecuatoriana.
          </p>
          <p>
            Sapper Industries se reserva el derecho de suspender o cancelar cuentas que incumplan
            estos términos, sin previo aviso y sin responsabilidad alguna.
          </p>
        </section>

        <section className="terminos-section">
          <h2>2. Registro y cuenta de usuario</h2>
          <ul>
            <li>Cada usuario debe registrar únicamente una cuenta personal con datos verídicos.</li>
            <li>El usuario es responsable de mantener la confidencialidad de su contraseña.</li>
            <li>Cualquier actividad realizada bajo su cuenta es de su exclusiva responsabilidad.</li>
            <li>
              Los datos de registro (nombre, cédula, correo, teléfono) son necesarios para la
              emisión de certificados y documentos oficiales.
            </li>
          </ul>
        </section>

        <section className="terminos-section">
          <h2>3. Proceso de inscripción y pagos</h2>
          <p>
            Al adquirir un programa de certificación o capacitación, el usuario acepta las
            siguientes condiciones:
          </p>
          <ul>
            <li>
              El pago se realiza mediante transferencia bancaria o DEUNA al número de cuenta
              indicado en el carrito de compras.
            </li>
            <li>
              La inscripción se confirma una vez que Sapper Industries verifique el comprobante
              de pago adjuntado por el usuario.
            </li>
            <li>
              Los precios están expresados en dólares estadounidenses (USD) e incluyen IVA del 15%.
            </li>
            <li>
              Sapper Industries se reserva el derecho de modificar los precios de sus programas
              sin previo aviso, aplicándose siempre el precio vigente al momento de la compra.
            </li>
          </ul>
        </section>

        <section className="terminos-section">
          <h2>4. Política de cancelación y reembolsos</h2>
          <p>
            Las solicitudes de cancelación deben realizarse con un mínimo de 48 horas de
            anticipación al inicio del programa. Pasado este plazo, Sapper Industries no garantiza
            el reembolso del valor pagado. Cada caso será analizado individualmente.
          </p>
          <p>
            En caso de cancelación del programa por parte de Sapper Industries, se ofrecerá al
            usuario la opción de reprogramación o devolución total del valor pagado.
          </p>
        </section>

        <section className="terminos-section">
          <h2>5. Proceso de certificación</h2>
          <p>
            El proceso de certificación implica la evaluación de competencias laborales mediante
            pruebas teóricas y prácticas. Para obtener la certificación el candidato debe:
          </p>
          <ul>
            <li>Presentar los documentos requeridos para cada programa.</li>
            <li>Aprobar la evaluación teórica con un mínimo del 70%.</li>
            <li>Aprobar la evaluación práctica en su totalidad (100%).</li>
            <li>Cumplir con los requisitos de experiencia y formación establecidos por el Ministerio del Trabajo.</li>
          </ul>
          <p>
            La certificación emitida por Sapper Industries tiene una vigencia de 2 años y es reconocida
            por la Subsecretaría de Cualificaciones Profesionales del Ministerio del Trabajo del Ecuador.
          </p>
        </section>

        <section className="terminos-section">
          <h2>6. Propiedad intelectual</h2>
          <p>
            Todo el contenido de la plataforma Sapper Industries —incluyendo textos, imágenes, logos,
            materiales de estudio y vídeos— es propiedad de Sapper Industries y está protegido por las
            leyes de propiedad intelectual vigentes en Ecuador. Queda prohibida su reproducción total
            o parcial sin autorización expresa y por escrito de Sapper Industries.
          </p>
        </section>

        <section className="terminos-section">
          <h2>7. Protección de datos personales</h2>
          <p>
            Sapper Industries recoge y trata los datos personales de los usuarios de conformidad con
            la Ley Orgánica de Protección de Datos Personales del Ecuador. Sus datos serán utilizados
            exclusivamente para la prestación de nuestros servicios, emisión de certificados,
            comunicaciones sobre sus programas y mejora de la plataforma.
          </p>
          <p>
            Sus datos no serán vendidos ni cedidos a terceros sin su consentimiento expreso, salvo
            obligación legal. Puede ejercer sus derechos de acceso, rectificación y eliminación
            escribiendo a <a href="mailto:info@sapper-industries.com">info@sapper-industries.com</a>.
          </p>
        </section>

        <section className="terminos-section">
          <h2>8. Limitación de responsabilidad</h2>
          <p>
            Sapper Industries no será responsable de daños directos o indirectos derivados del uso
            o imposibilidad de uso de la plataforma, interrupciones del servicio por causas de
            fuerza mayor, ni por decisiones tomadas por el usuario con base en la información
            publicada en el sitio.
          </p>
        </section>

        <section className="terminos-section">
          <h2>9. Modificaciones</h2>
          <p>
            Sapper Industries se reserva el derecho de modificar estos Términos y Condiciones en
            cualquier momento. Las modificaciones entrarán en vigor desde su publicación en la
            plataforma. El uso continuado de la plataforma implica la aceptación de los términos
            vigentes.
          </p>
        </section>

        <section className="terminos-section">
          <h2>10. Legislación aplicable</h2>
          <p>
            Estos Términos y Condiciones se rigen por las leyes de la República del Ecuador.
            Para cualquier controversia derivada de su interpretación o cumplimiento, las partes
            se someten a los jueces y tribunales competentes de la ciudad de Quito, Ecuador.
          </p>
        </section>

        <section className="terminos-section">
          <h2>11. Contacto</h2>
          <p>
            Para consultas relacionadas con estos Términos y Condiciones, contáctenos:
          </p>
          <ul>
            <li><strong>Correo:</strong> <a href="mailto:info@sapper-industries.com">info@sapper-industries.com</a></li>
            <li><strong>WhatsApp:</strong> <a href="https://wa.me/593983555081" target="_blank" rel="noopener noreferrer">+593 98 355 5081</a></li>
            <li><strong>Dirección:</strong> Quito, Ecuador</li>
          </ul>
        </section>

        <div className="terminos-footer-nav">
          <Link to="/" className="terminos-back-link">
            <i className="fa-solid fa-chevron-left" /> Volver al inicio
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Terminos;
