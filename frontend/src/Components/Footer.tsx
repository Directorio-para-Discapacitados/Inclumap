import React from 'react';
import './Footer.css';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__brand">
          <div className="footer__logo">IncluMap</div>
          <p className="footer__tagline">Tu mapa hacia la inclusión</p>
        </div>

        <nav className="footer__columns">
          <div className="footer__col">
            <h4 className="footer__title">Solución</h4>
            <Link to="/" className="footer__link">Inicio</Link>
            <Link to="/crear-negocio" className="footer__link">Crear negocio</Link>
            <Link to="/perfil" className="footer__link">Mi perfil</Link>
          </div>
          <div className="footer__col">
            <h4 className="footer__title">Enlaces útiles</h4>
            <Link to="/registro" className="footer__link">Crear cuenta</Link>
            <Link to="/login" className="footer__link">Iniciar sesión</Link>
            <Link to="/forgot-password" className="footer__link">Recuperar contraseña</Link>
          </div>
        </nav>
      </div>

      <div className="footer__divider" />

      <div className="footer__bottom">
        <div className="footer__copy">© 2025 IncluMap</div>
      </div>
    </footer>
  );
}
