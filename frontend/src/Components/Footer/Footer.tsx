import React from 'react';
import './Footer.css';
import { Link } from 'react-router-dom';
import { useSpeakable } from '../../hooks/useSpeakable';

export default function Footer() {
  const { onMouseEnter, onFocus } = useSpeakable();

  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__brand">
          <div className="footer__logo-container"> {/* Nuevo contenedor para los logos */}
          <img 
              src="/inclumap.png" 
              alt="Logo IncluMap" 
              className="footer__logo-img footer__logo-inclumap" /* Clase adicional para inclumap.png */
            />
            <img 
              src="/logo-UniPutumayo.png" 
              alt="Logo UniPutumayo" 
              className="footer__logo-img"
            />
            
          </div>
          <p className="footer__tagline">Tu mapa hacia la inclusión</p>
        </div>

        <nav className="footer__columns">
          <div className="footer__col">
            <h4 className="footer__title">Solución</h4>
            <Link 
              to="/" 
              className="footer__link"
              aria-label="Ir a inicio"
              onMouseEnter={onMouseEnter}
              onFocus={onFocus}
            >
              Inicio
            </Link>
            <Link 
              to="/crear-negocio" 
              className="footer__link"
              aria-label="Crear negocio"
              onMouseEnter={onMouseEnter}
              onFocus={onFocus}
            >
              Crear negocio
            </Link>
            <Link 
              to="/perfil" 
              className="footer__link"
              aria-label="Mi perfil"
              onMouseEnter={onMouseEnter}
              onFocus={onFocus}
            >
              Mi perfil
            </Link>
          </div>
          <div className="footer__col">
            <h4 className="footer__title">Enlaces útiles</h4>
            <Link 
              to="/registro" 
              className="footer__link"
              aria-label="Crear cuenta nueva"
              onMouseEnter={onMouseEnter}
              onFocus={onFocus}
            >
              Crear cuenta
            </Link>
            <Link 
              to="/login" 
              className="footer__link"
              aria-label="Iniciar sesión"
              onMouseEnter={onMouseEnter}
              onFocus={onFocus}
            >
              Iniciar sesión
            </Link>
            <Link 
              to="/forgot-password" 
              className="footer__link"
              aria-label="Recuperar contraseña"
              onMouseEnter={onMouseEnter}
              onFocus={onFocus}
            >
              Recuperar contraseña
            </Link>
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
