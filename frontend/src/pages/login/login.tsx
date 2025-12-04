// frontend/src/pages/login/login.tsx

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, loginWithGoogle } from "../../config/auth";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useSpeakable } from "../../hooks/useSpeakable";
import { LoadingSpinner } from "../../Components/LoadingSpinner/LoadingSpinner";
import { Eye, EyeOff } from "lucide-react";
import "./login.css";

export default function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<Array<{ email: string; password: string }>>([]);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [showAccountsDropdown, setShowAccountsDropdown] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { onMouseEnter, onFocus } = useSpeakable();
  const { darkMode } = useTheme();

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.email-input-wrapper')) {
        setShowAccountsDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

      if (res?.token) {
        const payload = decodeJwt(res.token);
        
        // --- LOGICA CORREGIDA: Permitir acceso a todos los roles ---
        // Se ha eliminado la restricción: if (rolIds.includes(1)) ...
        
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

        navigate("/");

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
        const payload = decodeJwt(res.token);
        
        // --- LOGICA CORREGIDA: Permitir acceso a todos los roles (Google) ---
        
        await login(res.token);
        navigate("/", { replace: true });

      } else {
        setError("Respuesta inesperada del servidor tras login con Google.");
      }
    } catch (err: any) {
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

  const handleSelectAccount = (account: { email: string; password: string }) => {
    setEmail(account.email);
    setPassword(account.password);
    setRememberMe(true);
    setShowAccountsDropdown(false);
  };

  const handleRemoveAccount = (emailToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedAccounts.filter(a => a.email !== emailToRemove);
    setSavedAccounts(updated);
    localStorage.setItem('savedAccounts', JSON.stringify(updated));
    
    // Si es la cuenta actualmente seleccionada, limpiar los campos
    if (email === emailToRemove) {
      setEmail('');
      setPassword('');
      setRememberMe(false);
    }
  };

  return (
    <div className="login-page">
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
            src= {
              darkMode 
              ? "/inclumap-login-illustration-dark.png" 
              : "/inclumap-login-illustration.png"
            }
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
              <div className="email-input-wrapper">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => savedAccounts.length > 0 && setShowAccountsDropdown(true)}
                  required
                  aria-label="Correo electrónico para iniciar sesión"
                  onMouseEnter={onMouseEnter}
                />
                {showAccountsDropdown && savedAccounts.length > 0 && (
                  <div className="saved-accounts-dropdown">
                    {savedAccounts.map((account) => (
                      <div
                        key={account.email}
                        className="saved-account-item"
                        onClick={() => handleSelectAccount(account)}
                      >
                        <span className="account-email">{account.email}</span>
                        <button
                          type="button"
                          className="remove-account-btn"
                          onClick={(e) => handleRemoveAccount(account.email, e)}
                          aria-label={`Eliminar cuenta ${account.email}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label>Contraseña</label>
              <div className="password-container">
                <input
                  type={mostrarPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-label="Contraseña"
                  onMouseEnter={onMouseEnter}
                  onFocus={onFocus}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="password-toggle"
                  aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onMouseEnter={onMouseEnter}
                  onFocus={onFocus}
                >
                  {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="login-row">
                <label className="remember-me">
                  <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)}
                    aria-label={rememberMe ? "Recordarme activado" : "Recordarme desactivado"}
                    onMouseEnter={onMouseEnter}
                    onFocus={onFocus}
                  />
                  Recordarme
                </label>
                <Link 
                  className="link subtle" 
                  to="/forgot-password"
                  aria-label="¿Olvidaste tu contraseña? Recuperar"
                  onMouseEnter={onMouseEnter}
                  onFocus={onFocus}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {error && <p className="error-text" role="alert">{error}</p>}

              <button 
                type="submit" 
                disabled={!isValid || loading}
                aria-label={loading ? "Ingresando..." : "Iniciar sesión"}
                onMouseEnter={onMouseEnter}
                onFocus={onFocus}
              >
                {loading ? "Ingresando..." : "Iniciar sesión"}
              </button>
            </form>

            <div className="divider">O</div>

            <div className="google-btn-container">
              {loading ? (
                <LoadingSpinner message="" size="small" />
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  shape="pill"
                  width="300px"
                  theme={darkMode ? "filled_black" : "outline"}
                  text="continue_with"
                  locale="es"
                />
              )}
            </div>

            <div className="links" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a 
                href="/registro"
                aria-label="¿No tienes cuenta? Regístrate aquí"
                onMouseEnter={onMouseEnter}
                onFocus={onFocus}
              >
                ¿No tienes cuenta? Regístrate
              </a>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}
