import { BrowserRouter as Router, Routes, Route, useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "./Components/Navbar";
import Inicio from "./pages/inicio/inicio";
import Login from "./pages/login/login";
import Registro from "./pages/registro/registro";
import Perfil from "./pages/perfil/perfil";
import { AuthProvider, useAuth } from "./context/AuthContext";
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
import Negocios from "./pages/negocios/Negocios";

function AppContent() {
  const location = useLocation();
  const { user } = useAuth();
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
          <Route path="/negocios" element={<Negocios />} />
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
                  {(() => {
                    const userId = user?.user_id;
                    if (!userId) {
                      return (
                        <p style={{ marginTop: '1rem' }}>
                          Inicia sesión para ver y gestionar tus lugares guardados.
                        </p>
                      );
                    }

                    const key = `saved_places_${userId}`;
                    let places: any[] = [];
                    try {
                      const raw = localStorage.getItem(key);
                      if (raw) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed)) {
                          places = parsed;
                        }
                      }
                    } catch {
                      places = [];
                    }

                    if (!places.length) {
                      return (
                        <p style={{ marginTop: '1rem' }}>
                          Aún no has guardado ningún local como favorito.
                        </p>
                      );
                    }

                    return (
                      <ul
                        style={{
                          marginTop: '1.5rem',
                          listStyle: 'none',
                          padding: 0,
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                          gap: '1rem',
                        }}
                      >
                        {places.map((p) => (
                          <li
                            key={p.business_id}
                            style={{
                              border: '1px solid var(--color-border)',
                              borderRadius: '16px',
                              background: 'var(--color-card-bg)',
                              boxShadow: 'var(--shadow-sm)',
                            }}
                          >
                            <Link
                              to={`/local/${p.business_id}`}
                              style={{
                                display: 'flex',
                                gap: '0.75rem',
                                alignItems: 'center',
                                padding: '0.9rem 1rem',
                                textDecoration: 'none',
                                color: 'inherit',
                              }}
                            >
                              {p.logo_url && (
                                <img
                                  src={p.logo_url}
                                  alt={p.business_name}
                                  style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 14,
                                    objectFit: 'cover',
                                  }}
                                />
                              )}
                              <div>
                                <h3 style={{ margin: 0, fontSize: '1rem' }}>{p.business_name}</h3>
                                {p.address && (
                                  <p
                                    style={{
                                      margin: '0.25rem 0 0',
                                      fontSize: '0.9rem',
                                      color: 'var(--color-text-muted)',
                                    }}
                                  >
                                    {p.address}
                                  </p>
                                )}
                                <p
                                  style={{
                                    marginTop: '0.3rem',
                                    fontSize: '0.9rem',
                                  }}
                                >
                                  {p.average_rating !== undefined && p.average_rating !== null
                                    ? `⭐ ${Number(p.average_rating).toFixed(1)} / 5`
                                    : 'Sin calificación'}
                                </p>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
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