import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Debug logs
  console.log('Navbar render - isAuthenticated:', isAuthenticated);
  console.log('Navbar render - user:', user);

  const handleProfileClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleProfileLinkClick = () => {
    setIsMenuOpen(false);
    navigate('/perfil');
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    // usar replace para no mantener la página anterior en el historial
    navigate('/login', { replace: true });
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="logo-box">
          <img src="/inclumap.jpg" alt="Logo Inclumap" className="logo-img" />
        </div>

        <div className="center-search">
          <div className="search-wrap">
            {/* Search input controlled so it can navigate to results */}
            <input
              className="search-input-main"
              placeholder="Search for accessible places, or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { navigate(`/?q=${encodeURIComponent(searchQuery)}`); } }}
            />
            <button
              className="search-btn"
              onClick={() => navigate(`/?q=${encodeURIComponent(searchQuery)}`)}
              aria-label="Buscar"
            >
              <i className="fas fa-search" />
            </button>
          </div>
        </div>

        <div className="right-links">
          <ul className="nav-links">
            <li><Link to="/">Inicio</Link></li>
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
                    src={user?.avatar || 'https://cdn-icons-png.flaticon.com/512/711/711769.png'} 
                    alt="Perfil" 
                    className="profile-image"
                    onError={(e) => { e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/711/711769.png'; }}
                  />
                </div>
                {isMenuOpen && (
                  <div className="profile-menu">
                    <div className="profile-info">
                      <img 
                        src={user?.avatar || 'https://cdn-icons-png.flaticon.com/512/711/711769.png'} 
                        alt="Perfil" 
                        className="profile-menu-image"
                        onError={(e) => { e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/711/711769.png'; }}
                      />
                      <div className="profile-details">
                        <p className="profile-name">{user?.name || 'Usuario'}</p>
                        <p className="profile-email">{user?.email || 'No disponible'}</p>
                        <p className="profile-role">{user?.rol_name || 'Usuario'}</p>
                      </div>
                    </div>
                    <div className="profile-menu-items">
                      <button onClick={handleProfileLinkClick} className="menu-item">
                        <span className="menu-icon">👤</span>
                        Mi Perfil
                      </button>
                      <button onClick={() => { setIsMenuOpen(false); navigate('/ajustes'); }} className="menu-item">
                        <span className="menu-icon">⚙️</span>
                        Ajustes
                      </button>
                      <button onClick={handleLogout} className="menu-item logout">
                        <span className="menu-icon">🚪</span>
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
