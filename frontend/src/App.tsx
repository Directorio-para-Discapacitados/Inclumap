import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "./Components/Navbar";
import Inicio from "./pages/inicio/inicio";
import Login from "./pages/login/login";
import Registro from "./pages/registro/registro";
import Perfil from "./pages/perfil/perfil";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./Components/ProtectedRoute";
import ChatWidget from "./Components/ChatWidget"; 
import ForgotPasswordPage from "./pages/reseteoPassword/ForgotPasswordPage";
import AjustesPage from "./pages/ajustes/Ajustes";
import AdminLoginPage from './pages/adminLogin/AdminLogin';
import GestionUsuarios from "./pages/admin/gestion-roles/usuarios/GestionUsuarios";
import GestionPropietarios from "./pages/admin/gestion-roles/propietarios/GestionPropietarios";
import CrearNegocio from "./pages/crearNegocio/CrearNegocio";
import LocalDetalle from "./pages/local/LocalDetalle";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Footer from "./Components/Footer";
import LocalRecognitionPage from './pages/LocalRecognition/LocalRecognition';
import ReviewsPage from "./pages/reviews/ReviewsPage";
import SessionModal from "./Components/SessionModal/SessionModal";
import { setSessionModalCallback } from "./config/api";
import Accesibilidad from "./pages/accesibilidad/Accesibilidad";

function AppContent() {
  const location = useLocation();
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionPromiseResolve, setSessionPromiseResolve] = useState<((value: boolean) => void) | null>(null);

  useEffect(() => {
    // Configurar el callback que usará el interceptor para mostrar el modal
    const callback = () => {
      return new Promise<boolean>((resolve) => {
        setIsSessionModalOpen(true);
        // Guardar el resolve para usarlo cuando el usuario haga clic
        setSessionPromiseResolve(() => resolve);
      });
    };
    
    setSessionModalCallback(callback);
  }, []);

  const handleKeepSession = () => {
    setIsSessionModalOpen(false);
    if (sessionPromiseResolve) {
      sessionPromiseResolve(true); // Usuario quiere mantener la sesión
      setSessionPromiseResolve(null);
    }
  };

  const handleCloseSession = () => {
    setIsSessionModalOpen(false);
    if (sessionPromiseResolve) {
      sessionPromiseResolve(false); // Usuario quiere cerrar la sesión
      setSessionPromiseResolve(null);
    }
  };

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '70px' }}>
        <Routes>
          
          <Route path="/" element={<Inicio />} />
          <Route path="/accesibilidad/:id" element={<Accesibilidad />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/admin" element={<AdminLoginPage />} />

          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/reviews/:businessId" element={<ReviewsPage />} />

          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/reconocimiento" element={<LocalRecognitionPage />} />
            
            <Route
              path="/guardados"
              element={
                <div style={{ padding: '2rem' }}>
                  <h2>⭐ Mis Lugares Guardados</h2>
                  <p>Aquí se listarán los lugares que has marcado como favoritos.</p>
                </div>
              }
            />
            <Route
              path="/ajustes"
              element={<AjustesPage />}
            />
            <Route path="/admin/gestion-usuarios" element={<GestionUsuarios />} />
            <Route path="/admin/gestion-propietarios" element={<GestionPropietarios />} />
            {/* --- FIN DE LA CORRECCIÓN --- */}

            {/* Nueva ruta para crear negocio */}
            <Route
              path="/crear-negocio"
              element={<CrearNegocio />}
            />

          </Route>
          <Route path="/local/:id" element={<LocalDetalle />} />
        </Routes>
      </main>
      {/* Mostrar Footer solo en la página de inicio */}
      {location.pathname === '/' && <Footer />}
      <ChatWidget />
      <SessionModal
        isOpen={isSessionModalOpen}
        onKeepSession={handleKeepSession}
        onCloseSession={handleCloseSession}
        countdown={60}
      />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
}


function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;