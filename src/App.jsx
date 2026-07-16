import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import AdminLogin from '@pages/admin/AdminLogin';
import AdminDashboard from '@pages/admin/AdminDashboard';
import { AdminProvider } from './context/AdminContext';

// Layout del panel admin (sin Header/Footer/Chatbot del sitio público)
function AdminLayout() {
  return (
    <Routes>
      <Route path="login"     element={<AdminLogin />} />
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="*"         element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}

// Layout público con navegación y chatbot
function PublicLayout() {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/"                     element={<Home />} />
          <Route path="/capacitaciones"       element={<Navigate to="/certificaciones" replace />} />
          <Route path="/certificaciones"      element={<Certificaciones />} />
          <Route path="/certificacion/:slug"  element={<CertificationDetail />} />
          <Route path="/carrito"              element={<Carrito />} />
          <Route path="/login"                element={<Login />} />
          <Route path="/contacto"             element={<Contacto />} />
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
  );
}

function App() {
  return (
    <Router>
      <AdminProvider>
        <Routes>
          <Route path="/admin/*" element={<AdminLayout />} />
          <Route path="/*"       element={<PublicLayout />} />
        </Routes>
      </AdminProvider>
    </Router>
  );
}

export default App;
