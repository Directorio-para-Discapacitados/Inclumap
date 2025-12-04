// frontend/src/pages/adminLogin/AdminLogin.tsx (CORREGIDO)

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../../config/auth';
import './AdminLogin.css';
import { FaEye, FaEyeSlash } from "react-icons/fa"; // --- 1. IMPORTA LOS ÍCONOS ---

// Tu función decodeJwt
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

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const isValid = email && password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;
    setError('');
    setLoading(true);

    try {
      const res = await loginUser({
        user_email: email,
        user_password: password,
      });

      if (!res?.token) {
        throw new Error('No se recibió token');
      }

      const token = res.token;
      const decoded = decodeJwt(token);
      if (!decoded) {
        throw new Error('Token inválido');
      }
      
      const rolIds: number[] = decoded.rolIds || (decoded.rol_id ? [decoded.rol_id] : []);
      
      if (rolIds.includes(1)) {
        await auth.login(token);
        navigate('/');
      } else {
        setError('Acceso denegado. Esta sección es solo para administradores.');
      }

    } catch (err: any) {
      setError(err.message || 'Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        
        <section className="login-illustration" aria-hidden="true">
          <div className="login-illustration-copy">
            <h1>Conectando mundos, construyendo puentes</h1>
          </div>
          <img
            className="login-illustration-img"
            src="/inclumap-login-admin.png"
            alt="Ilustración de inclusión con espacios y comercios accesibles"
            loading="eager"
          />
        </section>

        <section className="login-form-panel">
          <div className="brand">
            <h2>IncluMap</h2>
            <p style={{ marginBottom: '1rem' }}>Acceso Administrador</p>
          </div>

          <div className="login-container">
            <form onSubmit={handleSubmit}>
              <label>Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label>Contraseña</label>
              <div className="password-container">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {/* --- 2. USA LOS ÍCONOS EN LUGAR DE EMOJIS --- */}
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                  {/* ------------------------------------------- */}
                </button>
              </div>

              {error && <p className="error-text" role="alert">{error}</p>}

              <button type="submit" disabled={!isValid || loading}>
                {loading ? "Ingresando..." : "Iniciar sesión"}
              </button>
            </form>

            <div className="divider">O</div>

            <div className="google-btn-container" style={{ textAlign: 'center', color: '#666', fontSize: '0.9em', padding: '1rem 0' }}>
              <p>Inicio de sesión con Google deshabilitado para Administradores.</p>
            </div>

            <div className="links" style={{ justifyContent: 'center' }}>
              <Link to="/login">Ir al inicio de sesión de usuario</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminLoginPage;
