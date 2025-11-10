// frontend/src/Components/Navbar.tsx (Corregido)

import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { FaMoon, FaSun } from "react-icons/fa";
import Avatar from "./Avatar/Avatar";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const location = useLocation();
  const showSearch = location.pathname === "/";

  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const profileMenuRef = useRef<HTMLLIElement | null>(null); 

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

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
  };

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
              placeholder="Buscar lugares accesibles..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                  src={user?.avatar}
                  alt="Perfil"
                  size="small"
                  className="profile-image"
                />
              </div>

              {isMenuOpen && (
                <div className="profile-menu">
                  <div className="profile-info">
                    <Avatar
                      src={user?.avatar}
                      alt="Perfil"
                      size="medium"
                      className="profile-menu-image"
                    />
                    <div className="profile-details">
                      <p className="profile-name">{user?.displayName || "Usuario"}</p>
                      
                      <p className="profile-email">
                        {user?.email || "No disponible"}
                      </p>
                      
                      <p className="profile-role">
                        {user?.roleDescription || "Usuario"}
                      </p>
                    </div>
                  </div>

                  {/* --- INICIO DE LA MODIFICACIÓN --- */}
                  <div className="profile-menu-items">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate("/perfil");
                      }}
                      className="menu-item"
                    >
                      👤 Mi Perfil
                    </button>
                    
                    {/* Crear Negocio - Solo para usuarios normales */}
                    {user?.roleDescription === "Usuario" && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate("/crear-negocio");
                        }}
                        className="menu-item"
                      >
                        🏪 Crear Negocio
                      </button>
                    )}
                    {/* Este botón solo se mostrará si la descripción del rol
                      es "Usuario". No aparecerá para "Administrador" o "Propietario".
                    */}
                    {user?.roleDescription === "Usuario" && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate("/guardados");
                        }}
                        className="menu-item"
                      >
                        📍 Lugares Guardados
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate("/ajustes");
                      }}
                      className="menu-item"
                    >
                      ⚙️ Ajustes
                    </button>
                    <button onClick={handleLogout} className="menu-item logout">
                      🚪 Cerrar sesión
                    </button>
                  </div>
                  {/* --- FIN DE LA MODIFICACIÓN --- */}

                  {/* --- FIN DE LA MODIFICACIÓN --- */}

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
    </nav>
  );
}