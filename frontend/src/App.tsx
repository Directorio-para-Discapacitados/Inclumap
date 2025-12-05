import { BrowserRouter as Router, Routes, Route, useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "./Components/Navbar";
import Inicio from "./pages/inicio/inicio";
import Login from "./pages/login/login";
import Registro from "./pages/registro/registro";
import Perfil from "./pages/perfil/perfil";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";
import { SpeechProvider } from "./context/SpeechContext";
import { GlobalSpeechListener } from "./Components/GlobalSpeechListener";
import VoiceCommander from "./Components/VoiceCommander";
import SpeechToggle from "./Components/SpeechToggle";
import ProtectedRoute from "./Components/ProtectedRoute";
import ChatWidget from "./Components/ChatWidget";
import AccessibilitySidebar from "./Components/AccessibilitySidebar/AccessibilitySidebar";
import ForgotPasswordPage from "./pages/reseteoPassword/ForgotPasswordPage";
import AjustesPage from "./pages/ajustes/Ajustes";
import AdminLoginPage from './pages/adminLogin/AdminLogin';
import GestionUsuarios from "./pages/admin/gestion-roles/usuarios/GestionUsuarios";
import GestionPropietarios from "./pages/admin/gestion-roles/propietarios/GestionPropietarios";
import GestionNegocios from "./pages/admin/gestion-negocios/GestionNegocios";
import GestionCategorias from "./pages/admin/gestion-categorias/GestionCategorias";
import GestionAccesibilidad from "./pages/admin/gestion-accesibilidad/GestionAccesibilidad";
import Reportes from "./pages/admin/reportes/Reportes";
import OffensiveContent from "./pages/admin/moderation/OffensiveContent";
import ReportedReviews from "./pages/admin/moderation/ReportedReviews";
import ReportHistory from "./pages/admin/moderation/ReportHistory";
import CrearNegocio from "./pages/crearNegocio/CrearNegocio";
import LocalDetalle from "./pages/local/LocalDetalle";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Footer from "./Components/Footer/Footer";
import LocalRecognitionPage from './pages/LocalRecognition/LocalRecognition';
import ReviewsPage from "./pages/reviews/ReviewsPage";
import OwnerBusinessReviewsPage from "./pages/reviews/OwnerBusinessReviewsPage";
import PendingReportsPage from "./pages/reviews/PendingReportsPage";
import SessionModal from "./Components/SessionModal/SessionModal";
import { setSessionModalCallback } from "./config/api";
import Accesibilidad from "./pages/accesibilidad/Accesibilidad";
import TodasAccesibilidades from "./pages/accesibilidad/TodasAccesibilidades";
import Negocios from "./pages/negocios/Negocios";
import AdminDashboard from "./Components/AdminDashboard/AdminDashboard";
import BrowseBusinesses from "./pages/explore-businesses/BrowseBusinesses";
import Tutorial from "./pages/tutoriales/Tutorial";

function AppContent() {
  const location = useLocation();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionPromiseResolve, setSessionPromiseResolve] = useState<((value: boolean) => void) | null>(null);
  const [savedVersion, setSavedVersion] = useState(0);
  const [hoveredSavedId, setHoveredSavedId] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const callback = () => {
      return new Promise<boolean>((resolve) => {
        setIsSessionModalOpen(true);
        setSessionPromiseResolve(() => resolve);
      });
    };

    setSessionModalCallback(callback);
  }, []);

  const handleKeepSession = () => {
    setIsSessionModalOpen(false);
    if (sessionPromiseResolve) {
      sessionPromiseResolve(true);
      setSessionPromiseResolve(null);
    }
  };

  const handleCloseSession = () => {
    setIsSessionModalOpen(false);
    if (sessionPromiseResolve) {
      sessionPromiseResolve(false);
      setSessionPromiseResolve(null);
    }
  };

  return (
    <>
      <Navbar />
      <GlobalSpeechListener />
      <VoiceCommander />
      <SpeechToggle />
      <AccessibilitySidebar />
      <main style={{ paddingTop: '70px' }}>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/accesibilidad/:id" element={<Accesibilidad />} />
          <Route path="/accesibilidades" element={<TodasAccesibilidades />} />
          <Route path="/negocios" element={<Negocios />} />
          <Route path="/tutoriales" element={<Tutorial />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/admin" element={<AdminLoginPage />} />

          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/reviews/:businessId" element={<ReviewsPage />} />
          <Route path="/reviews/pending-reports" element={<PendingReportsPage />} />

          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/owner/reviews" element={<OwnerBusinessReviewsPage />} />

            <Route path="/reconocimiento" element={<LocalRecognitionPage />} />

            <Route
              path="/guardados"
              element={
                <div
                  style={{
                    maxWidth: '1100px',
                    margin: '2.5rem auto 3rem',
                    padding: '2.5rem 2rem 2.8rem',
                    borderRadius: '30px',
                    background: darkMode
                      ? 'linear-gradient(135deg, rgba(30,41,59,0.95) 0%, rgba(51,65,85,0.95) 50%, rgba(30,41,59,0.95) 100%)'
                      : 'linear-gradient(135deg, rgba(56,189,248,0.25) 0%, rgba(129,140,248,0.25) 50%, #e5f1ff 100%)',
                    boxShadow: '0 25px 60px rgba(15,23,42,0.35)',
                  }}
                >
                  <header
                    style={{
                      borderRadius: '22px',
                      background: darkMode ? '#1e293b' : '#ffffff',
                      boxShadow: '0 18px 40px rgba(15,23,42,0.15)',
                      padding: '1.6rem 2rem',
                      marginBottom: '1.8rem',
                      border: darkMode ? '1px solid rgba(71,85,105,0.5)' : '1px solid rgba(148,163,184,0.3)',
                    }}
                  >
                    <h1
                      style={{
                        margin: 0,
                        fontSize: '1.9rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.7rem',
                        color: darkMode ? '#f1f5f9' : '#0f172a',
                      }}
                    >
                      <span style={{ fontSize: '1.8rem' }}>⭐</span>
                      Mis Lugares Guardados
                    </h1>
                    <p
                      style={{
                        margin: '0.5rem 0 0',
                        fontSize: '0.96rem',
                        color: darkMode ? '#94a3b8' : '#6b7280',
                      }}
                    >
                      Accede rápido a los locales que más te gustan y que consideras accesibles.
                    </p>
                  </header>

                  {(() => {
                    const userId = user?.user_id;
                    void savedVersion; // asegurar re-render cuando cambia

                    if (!userId) {
                      return (
                        <div
                          style={{
                            padding: '1.6rem',
                            borderRadius: '18px',
                            background: darkMode ? '#1e293b' : '#ffffff',
                            border: darkMode ? '1px solid rgba(71,85,105,0.5)' : '1px solid rgba(148,163,184,0.35)',
                            textAlign: 'center',
                            fontSize: '0.95rem',
                            color: darkMode ? '#cbd5e1' : '#374151',
                          }}
                        >
                          Inicia sesión para ver y gestionar tus lugares guardados.
                        </div>
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
                        <div
                          style={{
                            padding: '2rem 1.5rem',
                            borderRadius: '22px',
                            background: darkMode ? '#1e293b' : '#ffffff',
                            border: darkMode ? '1px dashed rgba(71,85,105,0.7)' : '1px dashed rgba(148,163,184,0.7)',
                            textAlign: 'center',
                            color: darkMode ? '#94a3b8' : '#6b7280',
                            fontSize: '0.95rem',
                          }}
                        >
                          <p style={{ margin: 0 }}>
                            Aún no has guardado ningún local como favorito.
                          </p>
                          <p style={{ margin: '0.3rem 0 0' }}>
                            Explora los negocios accesibles y usa el botón ⭐ para añadirlos aquí.
                          </p>
                        </div>
                      );
                    }

                    const count = places.length;

                    return (
                      <section
                        style={{
                          borderRadius: '24px',
                          background: darkMode ? '#1e293b' : '#ffffff',
                          border: darkMode ? '1px solid rgba(71,85,105,0.5)' : '1px solid rgba(148,163,184,0.4)',
                          padding: '1.6rem 1.7rem 1.8rem',
                          boxShadow: '0 18px 40px rgba(15,23,42,0.18)',
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            marginBottom: '1.2rem',
                            fontSize: '0.9rem',
                            color: darkMode ? '#94a3b8' : '#6b7280',
                          }}
                        >
                          Tienes {count} {count === 1 ? 'lugar guardado' : 'lugares guardados'}.
                        </p>

                        <ul
                          style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: 0,
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                            gap: '1.3rem',
                          }}
                        >
                          {places.map((p) => {
                            const ratingLabel =
                              p.average_rating !== undefined && p.average_rating !== null
                                ? `${Number(p.average_rating).toFixed(1)} / 5`
                                : 'Sin calificación';
                            const numericId = Number(p.business_id);
                            const isHovered = hoveredSavedId === numericId;

                            return (
                              <li
                                key={p.business_id}
                                style={{
                                  borderRadius: '20px',
                                  border: isHovered
                                    ? (darkMode ? '1px solid #3b82f6' : '1px solid #2563eb')
                                    : (darkMode ? '1px solid rgba(71,85,105,0.6)' : '1px solid rgba(209,213,219,0.9)'),
                                  background: isHovered
                                    ? (darkMode ? '#334155' : '#ffffff')
                                    : (darkMode ? '#1e293b' : '#f9fafb'),
                                  boxShadow: isHovered
                                    ? '0 18px 40px rgba(15,23,42,0.22)'
                                    : '0 10px 30px rgba(15,23,42,0.12)',
                                  overflow: 'hidden',
                                  transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                                  transition:
                                    'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background-color 0.18s ease',
                                }}
                                onMouseEnter={() => setHoveredSavedId(numericId)}
                                onMouseLeave={() => setHoveredSavedId(null)}
                              >
                                <Link
                                  to={`/local/${p.business_id}`}
                                  style={{
                                    display: 'flex',
                                    gap: '0.9rem',
                                    alignItems: 'center',
                                    padding: '1rem 1.2rem 0.85rem',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                  }}
                                >
                                  {p.logo_url && (
                                    <img
                                      src={p.logo_url}
                                      alt={p.business_name}
                                      style={{
                                        width: 58,
                                        height: 58,
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        flexShrink: 0,
                                        border: '2px solid rgba(59,130,246,0.6)',
                                        boxShadow: '0 4px 12px rgba(15,23,42,0.35)',
                                      }}
                                    />
                                  )}
                                  <div style={{ flex: 1 }}>
                                    <span
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        padding: '0.12rem 0.55rem',
                                        borderRadius: '999px',
                                        fontSize: '0.7rem',
                                        letterSpacing: '0.06em',
                                        textTransform: 'uppercase',
                                        background: 'rgba(37,99,235,0.12)',
                                        color: '#2563eb',
                                        marginBottom: '0.35rem',
                                        fontWeight: 600,
                                      }}
                                    >
                                      Favorito
                                    </span>
                                    <h3
                                      style={{
                                        margin: 0,
                                        fontSize: '1.02rem',
                                        fontWeight: 700,
                                        color: darkMode ? '#f1f5f9' : '#111827',
                                      }}
                                    >
                                      {p.business_name}
                                    </h3>
                                    {p.address && (
                                      <p
                                        style={{
                                          margin: '0.28rem 0 0',
                                          fontSize: '0.9rem',
                                          color: darkMode ? '#94a3b8' : '#6b7280',
                                        }}
                                      >
                                        {p.address}
                                      </p>
                                    )}
                                    <p
                                      style={{
                                        marginTop: '0.45rem',
                                        fontSize: '0.85rem',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.3rem',
                                        padding: '0.23rem 0.55rem',
                                        borderRadius: '999px',
                                        background: darkMode ? '#0f172a' : '#ffffff',
                                        border: darkMode ? '1px solid rgba(71,85,105,0.7)' : '1px solid rgba(209,213,219,0.7)',
                                      }}
                                    >
                                      <span>⭐</span>
                                      <span>{ratingLabel}</span>
                                    </p>
                                  </div>
                                </Link>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    try {
                                      const keyInner = `saved_places_${userId}`;
                                      const rawInner = localStorage.getItem(keyInner);
                                      let listInner = rawInner ? JSON.parse(rawInner) : [];
                                      if (!Array.isArray(listInner)) listInner = [];
                                      listInner = listInner.filter(
                                        (x: any) => Number(x.business_id) !== Number(p.business_id)
                                      );
                                      localStorage.setItem(keyInner, JSON.stringify(listInner));
                                      setSavedVersion((v) => v + 1);
                                    } catch {
                                      // si falla, simplemente no actualizamos
                                    }
                                  }}
                                  style={{
                                    width: '100%',
                                    border: 'none',
                                    borderTop: darkMode ? '1px solid rgba(71,85,105,0.7)' : '1px solid rgba(229,231,235,0.9)',
                                    background: 'transparent',
                                    padding: '0.7rem 1.2rem 0.85rem',
                                    textAlign: 'right',
                                    fontSize: '0.86rem',
                                    color: darkMode ? '#94a3b8' : '#6b7280',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Quitar de favoritos
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    );
                  })()}
                </div>
              }
            />
            <Route
              path="/ajustes"
              element={<AjustesPage />}
            />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/gestion-usuarios" element={<GestionUsuarios />} />
            <Route path="/admin/gestion-propietarios" element={<GestionPropietarios />} />
            <Route path="/admin/gestion-negocios" element={<GestionNegocios />} />
            <Route path="/admin/gestion-categorias" element={<GestionCategorias />} />
            <Route path="/admin/gestion-accesibilidad" element={<GestionAccesibilidad />} />
            <Route path="/admin/reportes" element={<Reportes />} />
            <Route path="/admin/moderation/offensive" element={<OffensiveContent />} />
            <Route path="/admin/moderation/reported" element={<ReportedReviews />} />
            <Route path="/admin/moderation/history" element={<ReportHistory />} />
            <Route path="/crear-negocio" element={<CrearNegocio />} />
            <Route path="/explorar-negocios" element={<BrowseBusinesses />} />

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
        autoClose={3000}
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
      <SpeechProvider>
        <Router>
          <AppContent />
        </Router>
      </SpeechProvider>
    </AuthProvider>
  );
}

export default App;
