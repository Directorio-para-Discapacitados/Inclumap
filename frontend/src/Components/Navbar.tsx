// frontend/src/Components/Navbar.tsx (Corregido)

import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";
import { useState, useEffect, useRef, useContext } from "react";
import { useAuth } from "../context/AuthContext";
import { FaMoon, FaSun } from "react-icons/fa";
import Avatar from "./Avatar/Avatar";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const [showNotification, setShowNotification] = useState(false);
  const [missingItems, setMissingItems] = useState<string[]>([]);
  const location = useLocation();
  const showSearch = location.pathname === "/";

  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const authContext = useContext(AuthContext);
  const profileMenuRef = useRef<HTMLLIElement | null>(null); 

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  // Verificar notificación de perfil incompleto
  useEffect(() => {
    // Solo mostrar la notificación en la página de inicio
    const isOnHomePage = location.pathname === '/';
    
    if (user?.roleDescription === "Propietario" && isOnHomePage) {
      const missing: string[] = [];
      
      if (!user?.logo_url) {
        missing.push("logo");
      }
      if (!user?.verified) {
        missing.push("verificación");
      }

      if (missing.length > 0) {
        setMissingItems(missing);
        setShowNotification(true);
      } else {
        setShowNotification(false);
      }
    } else {
      setShowNotification(false);
    }
  }, [user?.logo_url, user?.verified, user?.roleDescription, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuRef]);

  const toggleTheme = () => setDarkMode(!darkMode);
  const handleProfileClick = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate("/login", { replace: true });
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    if (location.pathname === "/") {
      window.history.replaceState({}, "", location.pathname);
    }
    // Notificar a la página de inicio para ocultar resultados inmediatamente
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('inclumap:clear-search'));
    }
  };

  useEffect(() => {
    if (!showSearch) return;
    const params = new URLSearchParams(location.search);
    const q = (params.get("q") || "").trim();
    setSearchQuery(q);
  }, [location.pathname, location.search, showSearch]);

  useEffect(() => {
    if (!showSearch) return;
    const timer = setTimeout(() => {
      const trimmed = searchQuery.trim();
      const params = new URLSearchParams(location.search);
      const current = (params.get("q") || "").trim();
      if (trimmed) {
        if (current !== trimmed) {
          navigate(`/?q=${encodeURIComponent(trimmed)}`, { replace: true });
        }
      } else if (location.search) {
        window.history.replaceState({}, "", location.pathname);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, showSearch, navigate, location.pathname, location.search]);

  return (
    <nav className={`navbar ${darkMode ? "dark" : ""}`}>
      <div className="navbar-inner">
        {/* Logo */}
        <div className="logo-box">
          <img src="/inclumap.svg" alt="Logo Inclumap" className="logo-img" />
        </div>

        {/* Barra de búsqueda solo en Inicio */}
        {showSearch && (
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar nombre de lugares"
              className="search-input"
              value={searchQuery}
              onChange={(e) => {
                const v = e.target.value;
                setSearchQuery(v);
                if (!v.trim() && location.search) {
                  // Limpiar inmediatamente el parámetro q para ocultar locales al borrar todo
                  window.history.replaceState({}, "", location.pathname);
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('inclumap:clear-search'));
                  }
                }
              }}
              onKeyDown={handleSearch}
            />

          {searchQuery && (
            <span className="clear-icon" onClick={clearSearch}>
              &times;
            </span>
          )}

            <span className="search-icon">🔍</span>
          </div>
        )}

        {/* Links a la derecha */}
        <ul className="nav-links">
          <li><Link to="/">Inicio</Link></li>

          {!isAuthenticated && (
            <>
              <li><Link to="/registro">Registro</Link></li>
              <li><Link to="/login">Iniciar sesión</Link></li>
            </>
          )}

          {isAuthenticated && (
            <li className="profile-container" ref={profileMenuRef}>
              <div onClick={handleProfileClick} className="profile-trigger">
                <Avatar
                  key={user?.avatar || 'default-trigger'}
                  src={user?.avatar}
                  alt="Perfil"
                  size="small"
                  className="profile-image"
                />
              </div>

              {isMenuOpen && (
                <div className="profile-menu">
                  {/* Cerrar menú */}
                  <button 
                    className="profile-menu-close"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="Cerrar menú"
                  >
                    ✕
                  </button>

                  {/* Correo en la parte superior */}
                  <div className="profile-menu-email">
                    {user?.email || "No disponible"}
                  </div>

                  {/* Avatar e información centrada */}
                  <div className="profile-menu-header">
                    <Avatar
                      key={user?.avatar || 'default-menu'}
                      src={user?.avatar}
                      alt="Perfil"
                      size="large"
                      className="profile-menu-avatar"
                    />
                    <div className="profile-menu-user-info">
                      <h3 className="profile-menu-greeting">
                        ¡Hola, {user?.displayName?.split(' ')[0] || "Usuario"}!
                        {user?.roleDescription === "Propietario" && user?.verified && (
                          <i className="fas fa-check-circle verified-icon"></i>
                        )}
                      </h3>
                      <p className="profile-menu-role">
                        {user?.roleDescription || "Usuario"}
                      </p>
                    </div>
                  </div>

                  {/* Botón de administrar cuenta */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate("/perfil");
                    }}
                    className="profile-menu-manage-btn"
                  >
                    Administrar tu Cuenta de Inclumap
                  </button>

                  {/* Separador */}
                  <div className="profile-menu-divider"></div>

                  {/* Opciones del menú */}
                  <div className="profile-menu-items">
                    {user?.roleDescription === "Usuario" && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate("/crear-negocio");
                        }}
                        className="menu-item"
                      >
                        <span className="menu-item-icon">🏪</span>
                        <span className="menu-item-text">Crear Negocio</span>
                      </button>
                    )}
                    
                    {user?.roleDescription === "Usuario" && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate("/guardados");
                        }}
                        className="menu-item"
                      >
                        <span className="menu-item-icon">📍</span>
                        <span className="menu-item-text">Lugares Guardados</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate("/ajustes");
                      }}
                      className="menu-item"
                    >
                      <span className="menu-item-icon">⚙️</span>
                      <span className="menu-item-text">Ajustes</span>
                    </button>
                  </div>

                  {/* Separador */}
                  <div className="profile-menu-divider"></div>

                  {/* Cerrar sesión */}
                  <button onClick={handleLogout} className="menu-item logout">
                    <span className="menu-item-icon">🚪</span>
                    <span className="menu-item-text">Cerrar sesión</span>
                  </button>
                </div>
              )}
            </li>
          )}

          {/* Botón de tema oscuro */}
          <li className="theme-toggle" onClick={toggleTheme}>
            {darkMode ? <FaSun /> : <FaMoon />}
          </li>
        </ul>
      </div>

      {/* Notificación de perfil incompleto */}
      {showNotification && (
        <div 
          className="navbar-notification"
          onClick={() => {
            // Si es propietario, navega a perfil con la sección owner-profile
            if (user?.roleDescription === "Propietario") {
              navigate("/perfil?section=owner-profile");
            } else {
              navigate("/perfil");
            }
          }}
          role="alert"
          aria-live="polite"
        >
          <div className="notification-badge">
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <div className="notification-message">
            <span className="notification-title">Completa tu perfil</span>
            <span className="notification-detail">
              {missingItems.includes("logo") && missingItems.includes("verificación")
                ? "Sube el logo de tu empresa"
                : missingItems.includes("logo")
                ? "Falta el logo"
                : "Verifica tu negocio"}
            </span>
          </div>
          <i className="fas fa-chevron-right notification-arrow"></i>
        </div>
      )}
    </nav>
  );
}