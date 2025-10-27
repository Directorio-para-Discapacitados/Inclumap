import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../../config/auth";
import { useAuth } from "../../context/AuthContext";
import "./login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; text: string }>({ visible: false, text: "" });
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

  return (
    <div className="login-page">
      {toast.visible && (
        <div className="toast toast-success" role="status" aria-live="polite">
          <span className="toast-icon">✓</span>
          <span>{toast.text}</span>
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
            <form
              onSubmit={async (e) => {
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
              }}
            >
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
            <button className="google-btn" onClick={() => { /* lógica Google */ }}>
              <img
                src="https://image.similarpng.com/file/similarpng/original-picture/2020/06/Logo-google-icon-PNG.png"
                alt="Google"
                width="24"
                height="24"
              />
              Continuar con Google
            </button>

            <div className="links">
              <span />
              <a href="/register">¿No tienes cuenta? Regístrate</a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}