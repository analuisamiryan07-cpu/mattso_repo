import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ScrollToTop from '@components/ScrollToTop';
import Header from '@components/layout/Header';
import Footer from '@components/layout/Footer';
import Home from '@pages/Home';
import Capacitaciones from '@pages/Capacitaciones';
import Certificaciones from '@pages/Certificaciones';
import CertificationDetail from '@pages/CertificationDetail';
import CapacitacionDetail from '@pages/CapacitacionDetail';
import Carrito from '@pages/Carrito';
import Login from '@pages/Login';
import ForgotPassword from '@pages/ForgotPassword';
import ResetPassword from '@pages/ResetPassword';
import Contacto from '@pages/Contacto';
import Nosotros from '@pages/Nosotros';
import Terminos from '@pages/Terminos';
import MisCertificados from '@pages/MisCertificados';
import VerificarCertificado from '@pages/VerificarCertificado';
import PaymentSuccess from '@pages/PaymentSuccess';
import PaymentCancelled from '@pages/PaymentCancelled';
import Chatbot from './components/ui/Chatbot';
import { CatalogProvider } from './context/CatalogContext';
import AulaVirtualApp from './aula-virtual/AulaVirtualApp';

// Sitio público de marketing/e-commerce — Header, Footer y Chatbot solo viven
// aquí. Aula Virtual (más abajo) es deliberadamente otra app: sin este layout.
function SitioPublico() {
  return (
    <CatalogProvider>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/"                     element={<Home />} />
            <Route path="/nosotros"             element={<Nosotros />} />
            <Route path="/capacitaciones"       element={<Capacitaciones />} />
            <Route path="/certificaciones"      element={<Certificaciones />} />
            <Route path="/certificacion/:slug"  element={<CertificationDetail />} />
            <Route path="/capacitacion/:slug"   element={<CapacitacionDetail />} />
            <Route path="/carrito"              element={<Carrito />} />
            <Route path="/login"                element={<Login />} />
            <Route path="/forgot-password"     element={<ForgotPassword />} />
            <Route path="/reset-password"      element={<ResetPassword />} />
            <Route path="/contacto"             element={<Contacto />} />
            <Route path="/terminos"             element={<Terminos />} />
            <Route path="/mis-certificados"    element={<MisCertificados />} />
            <Route path="/verificar/:codigo"   element={<VerificarCertificado />} />
            <Route path="/pago-exitoso"        element={<PaymentSuccess />} />
            <Route path="/pago-cancelado"      element={<PaymentCancelled />} />
            <Route path="*" element={
              <div style={{ textAlign: 'center', padding: '120px 20px' }}>
                <h2 style={{ fontSize: '2rem', color: 'var(--primary-blue)' }}>Página no encontrada</h2>
                <a href="/" style={{ color: 'var(--primary-yellow)', fontWeight: 700, marginTop: 16, display: 'inline-block' }}>
                  ← Volver al inicio
                </a>
              </div>
            } />
          </Routes>
        </main>
        <Footer />
        <Chatbot />
      </div>
    </CatalogProvider>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/aula-virtual/*" element={<AulaVirtualApp />} />
        <Route path="/*" element={<SitioPublico />} />
      </Routes>
    </Router>
  );
}

export default App;
