import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from '@components/layout/Header';
import Footer from '@components/layout/Footer';
import Home from '@pages/Home';
import Capacitaciones from '@pages/Capacitaciones';
import Certificaciones from '@pages/Certificaciones';
import CertificationDetail from '@pages/CertificationDetail';
import Carrito from '@pages/Carrito';
import Login from '@pages/Login';
import Contacto from '@pages/Contacto';
import Chatbot from './components/ui/Chatbot';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/"                         element={<Home />} />
            <Route path="/capacitaciones"           element={<Capacitaciones />} />
            <Route path="/certificaciones"          element={<Certificaciones />} />
            <Route path="/certificacion/:slug"      element={<CertificationDetail />} />
            <Route path="/carrito"                  element={<Carrito />} />
            <Route path="/login"                    element={<Login />} />
            <Route path="/contacto"                 element={<Contacto />} />
            {/* 404 */}
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
    </Router>
  );
}

export default App;
