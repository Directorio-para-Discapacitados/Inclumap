import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { FaMoon, FaSun } from "react-icons/fa";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(() => {
    // Recuperar el estado guardado en localStorage
    return localStorage.getItem("darkMode") === "true";
  });

  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

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

  return (
    <nav className={`navbar ${darkMode ? "dark" : ""}`}>
      <div className="navbar-inner">
        {/* Logo */}
        <div className="logo-box">
          <img src="/inclumap.jpg" alt="Logo Inclumap" className="logo-img" />
        </div>

        {/* Barra de búsqueda */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar lugares accesibles..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
          <span className="search-icon">🔍</span>
        </div>

        {/* Links a la derecha */}
        <ul className="nav-links">
          <li><Link to="/">Inicio</Link></li>
          <li><Link to="/nosotros">Sobre nosotros</Link></li>

          {!isAuthenticated && (
            <>
              <li><Link to="/registro">Registro</Link></li>
              <li><Link to="/login">Iniciar sesión</Link></li>
            </>
          )}

          {isAuthenticated && (
            <li className="profile-container">
              <div onClick={handleProfileClick} className="profile-trigger">
                <img
                  src={
                    user?.avatar ||
                    "https://cdn-icons-png.flaticon.com/512/711/711769.png"
                  }
                  alt="Perfil"
                  className="profile-image"
                  onError={(e) =>
                    (e.currentTarget.src =
                      "https://cdn-icons-png.flaticon.com/512/711/711769.png")
                  }
                />
              </div>

              {isMenuOpen && (
                <div className="profile-menu">
                  <div className="profile-info">
                    <img
                      src={
                        user?.avatar ||
                        "https://cdn-icons-png.flaticon.com/512/711/711769.png"
                      }
                      alt="Perfil"
                      className="profile-menu-image"
                    />
                    <div className="profile-details">
                      <p className="profile-name">{user?.name || "Usuario"}</p>
                      <p className="profile-email">
                        {user?.email || "No disponible"}
                      </p>
                      <p className="profile-role">
                        {user?.rol_name || "Usuario"}
                      </p>
                    </div>
                  </div>

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
