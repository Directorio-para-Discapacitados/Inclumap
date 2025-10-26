import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  
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
      <div className="logo">
        <img src="/inclumap.jpg" alt="Logo Inclumap" style={{ height: '50px', width: 'auto' }} />
      </div>
      <ul className="nav-links">
        <li><Link to="/">Inicio</Link></li>
        
        {/* Botones cuando NO está autenticado */}
        {!isAuthenticated && (
          <>
            <li><Link to="/registro">Registro</Link></li>
            <li><Link to="/login">Iniciar sesión</Link></li>
          </>
        )}

        {/* Menú de perfil cuando SÍ está autenticado */}
        {isAuthenticated && (
          <li className="profile-container">
            <div onClick={handleProfileClick} className="profile-trigger">
                <img 
                  src={user?.avatar || 'https://cdn-icons-png.flaticon.com/512/711/711769.png'} 
                  alt="Perfil" 
                  className="profile-image"
                  onError={(e) => {
                    console.log('Error loading profile image');
                    e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/711/711769.png';
                  }}
                />
            </div>
            {isMenuOpen && (
              <div className="profile-menu">
                <div className="profile-info">
                    <img 
                      src={user?.avatar || 'https://cdn-icons-png.flaticon.com/512/711/711769.png'} 
                      alt="Perfil" 
                      className="profile-menu-image"
                      onError={(e) => {
                        e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/711/711769.png';
                      }}
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
    </nav>
  );
}
