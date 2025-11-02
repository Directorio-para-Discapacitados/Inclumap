import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, loginWithGoogle } from "../../config/auth";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import "./login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; text: string }>({ visible: false, text: "" });
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const isValid = email && password;

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
      if (res?.token) {
        await login(res.token);
        const payload = decodeJwt(res.token);
        const firstName = payload?.firstName || "";
        const lastName = payload?.firstLastName || "";
        const name = `${firstName} ${lastName}`.trim() || email;
        setToast({ visible: true, text: `Bienvenido, ${name}` });
        setTimeout(() => {
          setToast({ visible: false, text: "" });
          navigate("/");
        }, 1000);
      } else {
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

      if (res?.token) {
        await login(res.token);
        const payload = decodeJwt(res.token);
        const name = `${payload?.firstName || ''} ${payload?.firstLastName || ''}`.trim() || payload?.user_email || 'Usuario';

        setToast({ visible: true, text: `Bienvenido, ${name}` });

        setTimeout(() => {
          setToast({ visible: false, text: "" });
          navigate("/", { replace: true });
        }, 1000);
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
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="login-row">
                <label className="remember-me">
                  <input type="checkbox" />
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

            <div className="links">
              <span />
              <a href="/registro">¿No tienes cuenta? Regístrate</a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}