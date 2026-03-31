import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientesPage from './pages/clientes/ClientesPage';
import PremiosPage from './pages/premios/PremiosPage';
import PromocionesPage from './pages/promociones/PromocionesPage';
import CajerosPage from './pages/cajeros/CajerosPage';
import SucursalesPage from './pages/sucursales/SucursalesPage';

const ProtectedRoute = ({ children }) => {
  const { usuario, rol, cargando } = useAuth();

  if (cargando) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#C8102E' }}>
      <div style={{ color: 'white', fontSize: 18 }}>Cargando...</div>
    </div>
  );

  if (!usuario || (rol !== 'admin' && rol !== 'cajero')) {
    return <Navigate to="/login" />;
  }

  return children;
};

const AppRoutes = () => {
  const { usuario, rol, cargando } = useAuth();

  if (cargando) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#C8102E' }}>
      <div style={{ color: 'white', fontSize: 18 }}>Cargando...</div>
    </div>
  );

  return (
    <Routes>
      <Route path="/login" element={!usuario ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/clientes" element={<ProtectedRoute><ClientesPage /></ProtectedRoute>} />
      <Route path="/premios" element={<ProtectedRoute><PremiosPage /></ProtectedRoute>} />
      <Route path="/promociones" element={<ProtectedRoute><PromocionesPage /></ProtectedRoute>} />
      <Route path="/cajeros" element={<ProtectedRoute><CajerosPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
      <Route path="/sucursales" element={<ProtectedRoute><SucursalesPage /></ProtectedRoute>} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;