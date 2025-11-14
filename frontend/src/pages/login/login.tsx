// frontend/src/pages/login/login.tsx (Corregido)

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, loginWithGoogle } from "../../config/auth";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import "./login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; text: string }>({ visible: false, text: "" });
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<Array<{ email: string; password: string }>>([]);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const isValid = email && password;

  useEffect(() => {
    try {
      const raw = localStorage.getItem('savedAccounts');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedAccounts(parsed);
        }
      }
    } catch {
      // ignorar errores de lectura de localStorage
    }
  }, []);

  const decodeJwt = (token: string): any => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await loginUser({
        user_email: email,
        user_password: password,
      });

      // --- INICIO MODIFICACIÓN: Lógica de Admin ---
      if (res?.token) {
        const payload = decodeJwt(res.token);
        // Basado en tu AuthContext, los roles vienen en 'rolIds'. El ID 1 es Admin.
        const rolIds: number[] = payload?.rolIds || []; 

        if (rolIds.includes(1)) {
          // Si es Admin, rechazar
          setError("Acceso denegado");
        } else {
          // Si NO es Admin (Usuario o Propietario), proceder con tu lógica original
          await login(res.token);
          // Guardar o eliminar la cuenta según "Recordarme"
          try {
            const next = [...savedAccounts];
            const idx = next.findIndex((a) => a.email === email);
            if (rememberMe) {
              const entry = { email, password };
              if (idx >= 0) next[idx] = entry; else next.push(entry);
            } else if (idx >= 0) {
              next.splice(idx, 1);
            }
            localStorage.setItem('savedAccounts', JSON.stringify(next));
            setSavedAccounts(next);
          } catch {
            // si falla localStorage no debe romper el login
          }
          const firstName = payload?.firstName || "";
          const lastName = payload?.firstLastName || "";
          const name = `${firstName} ${lastName}`.trim() || email;
          setToast({ visible: true, text: `Bienvenido, ${name}` });
          setTimeout(() => {
            setToast({ visible: false, text: "" });
            navigate("/");
          }, 1000);
        }
      // --- FIN MODIFICACIÓN ---
      } else {
        // Tu lógica original si no hay token
        navigate("/");
      }
    } catch (err: any) {
      setError(err?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setError(null);
    setLoading(true);

    const idToken = credentialResponse.credential;
    if (!idToken) {
      setError("No se recibió el token de Google.");
      setLoading(false);
      return;
    }

    try {
      const res = await loginWithGoogle(idToken);

      // --- INICIO MODIFICACIÓN: Lógica de Admin (Google) ---
      if (res?.token) {
        const payload = decodeJwt(res.token);
        const rolIds: number[] = payload?.rolIds || [];

        if (rolIds.includes(1)) {
           // Si es Admin, rechazar
          setError("Acceso denegado");
        } else {
          // Si NO es Admin, proceder con tu lógica original
          await login(res.token);
          const name = `${payload?.firstName || ''} ${payload?.firstLastName || ''}`.trim() || payload?.user_email || 'Usuario';

          setToast({ visible: true, text: `Bienvenido, ${name}` });

          setTimeout(() => {
            setToast({ visible: false, text: "" });
            navigate("/", { replace: true });
          }, 1000);
        }
      // --- FIN MODIFICACIÓN ---
      } else {
        setError("Respuesta inesperada del servidor tras login con Google.");
      }
    } catch (err: any) {
      // Verificar si es el error de usuario no registrado
      if (err?.message?.includes('Usuario no registrado')) {
        setShowRegistrationModal(true);
      } else {
        setError(err?.message || "Error al iniciar sesión con Google");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Error al autenticar con Google. Inténtalo de nuevo.");
  };

  const handleModalClose = () => {
    setShowRegistrationModal(false);
  };

  const handleNavigateToRegister = () => {
    setShowRegistrationModal(false);
    navigate("/registro");
  };

  return (
    <div className="login-page">
      {toast.visible && (
        <div className="toast toast-success" role="status" aria-live="polite">
          <span className="toast-icon">✓</span>
          <span>{toast.text}</span>
        </div>
      )}

      {showRegistrationModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Registro Requerido</h3>
              <button className="modal-close" onClick={handleModalClose}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-icon">⚠️</div>
              <p>Usuario no registrado, Porfavor primero debes registrarte con correo y contraseña.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={handleModalClose}>
                Entendido
              </button>
              <button className="btn-primary" onClick={handleNavigateToRegister}>
                Ir a Registro
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="login-card">
        <section className="login-illustration" aria-hidden="true">
          <div className="login-illustration-copy">
            <h1>Conectando mundos, construyendo puentes</h1>
          </div>
          <img
            className="login-illustration-img"
            src="/inclumap-login-illustration.png"
            alt="Ilustración de inclusión con espacios y comercios accesibles"
            loading="eager"
          />
        </section>

        <section className="login-form-panel">
          <div className="brand">
            <h2>IncluMap</h2>
            <p>Tu mapa hacia la inclusión</p>
          </div>

          <div className="login-container">
            <form onSubmit={handleEmailLogin}>
              <label>Correo electrónico</label>
              <input
                type="email"
                value={email}
                list="saved-emails"
                onChange={(e) => {
                  const v = e.target.value;
                  setEmail(v);
                  const acc = savedAccounts.find((a) => a.email === v);
                  if (acc) {
                    setPassword(acc.password);
                    setRememberMe(true);
                  }
                }}
                required
              />
              <datalist id="saved-emails">
                {savedAccounts.map((a) => (
                  <option key={a.email} value={a.email} />
                ))}
              </datalist>

              <label>Contraseña</label>
              <div className="password-container">
                <input
                  type={mostrarPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="password-toggle"
                >
                  {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="login-row">
                <label className="remember-me">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  Recordarme
                </label>
                <Link className="link subtle" to="/forgot-password">¿Olvidaste tu contraseña?</Link>
              </div>

              {error && <p className="error-text" role="alert">{error}</p>}

              <button type="submit" disabled={!isValid || loading}>
                {loading ? "Ingresando..." : "Iniciar sesión"}
              </button>
            </form>

            <div className="divider">O</div>

            <div className="google-btn-container">
              {loading ? (
                <p>Cargando...</p>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  shape="pill"
                  width="300px"
                  theme="outline"
                  text="continue_with"
                  locale="es"
                />
              )}
            </div>

            {/* --- INICIO MODIFICACIÓN: Enlace a /admin --- */}
            <div className="links" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a href="/registro">¿No tienes cuenta? Regístrate</a>
            </div>
            {/* --- FIN MODIFICACIÓN --- */}

          </div>
        </section>
      </div>
    </div>
  );
}