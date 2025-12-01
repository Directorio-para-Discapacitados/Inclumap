import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { FaMoon, FaSun } from "react-icons/fa";
import Avatar from "./Avatar/Avatar";
import NotificationBell from "./Notifications/NotificationBell";
import SpeechToggle from "./SpeechToggle";
import { useSpeakable } from "../hooks/useSpeakable";
import { getAllCategories, Category } from "../services/categoryService";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // --- ESTADOS DEL BUSCADOR ---
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const { darkMode, toggleTheme } = useTheme();
  const [showNotification, setShowNotification] = useState(false);
  const [missingItems, setMissingItems] = useState<string[]>([]);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const profileMenuRef = useRef<HTMLLIElement | null>(null);

  // Hook para Text-to-Speech
  const { onMouseEnter, onFocus } = useSpeakable();

  // Ocultar buscador si el usuario es admin o si es propietario en la página de inicio
  const isAdmin = user?.rolIds?.includes(1);
  const isOwnerOnHomePage = user?.roleDescription === "Propietario" && location.pathname === "/";
  const showSearch = !isAdmin && !isOwnerOnHomePage && (location.pathname === "/" || location.pathname === "/negocios");

  // 1. Cargar categorías
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getAllCategories();
        setCategories(data || []);
      } catch (e: any) {
        console.error("Error cargando categorías:", e.message);
      }
    };
    fetchCategories();
  }, []);

  // 2. Sincronizar inputs con la URL (para que no se pierda al recargar)
  useEffect(() => {
    if (!showSearch) return;
    const params = new URLSearchParams(location.search);
    const q = (params.get("q") || "").trim();
    const cat = params.get("categoryId") || "";

    // Solo actualizamos si es diferente para evitar loops
    setSearchQuery(prev => prev !== q ? q : prev);
    setSelectedCategory(prev => prev !== cat ? cat : prev);
  }, [location.search, showSearch]);

  // Función central para navegar
  const updateSearchUrl = (q: string, cat: string) => {
    const params = new URLSearchParams();
    if (q) params.append("q", q);
    if (cat) params.append("categoryId", cat);

    // replace: true evita llenar el historial del navegador con cada letra
    navigate(`/?${params.toString()}`, { replace: true });
  };

  // 3. CAMBIO DE CATEGORÍA (Inmediato)
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCat = e.target.value;
    setSelectedCategory(newCat);
    updateSearchUrl(searchQuery.trim(), newCat);
  };

  // 4. CAMBIO DE TEXTO (Con Debounce / Tiempo Real)
  useEffect(() => {
    if (!showSearch) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(location.search);
      const currentQ = (params.get("q") || "").trim();

      // Solo navegar si el texto ha cambiado respecto a la URL actual
      if (searchQuery.trim() !== currentQ) {
        updateSearchUrl(searchQuery.trim(), selectedCategory);
      }
    }, 400); // Espera 400ms

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, showSearch]);

  // Opcional: Enter para buscar inmediatamente
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      updateSearchUrl(searchQuery.trim(), selectedCategory);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedCategory("");
    navigate("/");
  };

  // ... (Resto de lógica de perfil, notificaciones y efectos de click outside se mantienen igual) ...
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuRef]);

  useEffect(() => {
    const isOnHomePage = location.pathname === '/';
    if (user?.roleDescription === "Propietario" && isOnHomePage) {
      const missing: string[] = [];
      if (!user?.logo_url) missing.push("logo");
      if (!user?.verified) missing.push("verificación");
      if (missing.length > 0) {
        setMissingItems(missing);
        setShowNotification(true);
      } else setShowNotification(false);
    } else setShowNotification(false);
  }, [user?.logo_url, user?.verified, user?.roleDescription, location.pathname]);

  const handleProfileClick = () => setIsMenuOpen(!isMenuOpen);
  const handleLogout = () => { logout(); setIsMenuOpen(false); navigate("/login", { replace: true }); };

  return (
    <nav className={`navbar ${darkMode ? "dark" : ""}`}>
      <div className="navbar-inner">
        <div className="logo-box">
          <Link to="/">
            <img src="/inclumap.svg" alt="Logo Inclumap" className="logo-img" />
          </Link>
        </div>

        {showSearch && (
          <div className="search-container unified-search-bar">
            {/* SELECTOR DE CATEGORÍA */}
            <select
              className="search-select"
              value={selectedCategory}
              onChange={handleCategoryChange} // <--- Acción inmediata
              aria-label={selectedCategory ? `Categoría seleccionada: ${categories.find(c => c.category_id === Number(selectedCategory))?.name || 'Todas'}` : 'Seleccionar categoría. Todas las categorías'}
              onMouseEnter={onMouseEnter}
              onFocus={onFocus}
            >
              <option value="" aria-label="Todas las categorías">Todas</option>
              {categories.map((cat) => (
                <option
                  key={cat.category_id}
                  value={cat.category_id}
                  aria-label={`Categoría ${cat.name}`}
                >
                  {cat.name}
                </option>
              ))}
            </select>

            <div className="search-divider"></div>

            {/* INPUT DE TEXTO (Reactivo vía useEffect) */}
            <input
              type="text"
              placeholder="Buscar locales..."
              className="search-input-text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label={searchQuery ? `Buscar locales: ${searchQuery}` : "Buscar locales por nombre o dirección"}
              onMouseEnter={onMouseEnter}
              onFocus={onFocus}
            />

            <div className="search-actions">
              {(searchQuery || selectedCategory) && (
                <button
                  className="clear-btn"
                  onClick={clearSearch}
                  title="Limpiar"
                  aria-label="Limpiar búsqueda"
                  onMouseEnter={onMouseEnter}
                  onFocus={onFocus}
                >
                  &times;
                </button>
              )}
              <button
                className="search-btn"
                onClick={() => updateSearchUrl(searchQuery, selectedCategory)}
                title="Buscar"
                aria-label="Buscar locales"
                onMouseEnter={onMouseEnter}
                onFocus={onFocus}
              >
                🔍
              </button>
            </div>
          </div>
        )}

        <ul className="nav-links">
          <li>
            <Link
              to="/"
              aria-label="Ir a inicio"
              onMouseEnter={onMouseEnter}
              onFocus={onFocus}
            >
              Inicio
            </Link>
          </li>
          <li>
            <Link
              to="/tutoriales"
              aria-label="Ir a ayuda y tutoriales"
              onMouseEnter={onMouseEnter}
              onFocus={onFocus}
            >
              Ayuda
            </Link>
          </li>
          {!isAuthenticated && (
            <>
              <li>
                <Link
                  to="/registro"
                  aria-label="Ir a registro"
                  onMouseEnter={onMouseEnter}
                  onFocus={onFocus}
                >
                  Registro
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  aria-label="Iniciar sesión"
                  onMouseEnter={onMouseEnter}
                  onFocus={onFocus}
                >
                  Iniciar sesión
                </Link>
              </li>
            </>
          )}

          {isAuthenticated && (
            <>
              <li><NotificationBell /></li>
              <li className="profile-container" ref={profileMenuRef}>
                <div
                  onClick={handleProfileClick}
                  className="profile-trigger"
                  aria-label="Abrir menú de perfil"
                  onMouseEnter={onMouseEnter}
                  onFocus={onFocus}
                  tabIndex={0}
                  role="button"
                >
                  <Avatar key={user?.avatar} src={user?.avatar} alt="Perfil" size="small" className="profile-image" />
                </div>
                {isMenuOpen && (
                  <div className="profile-menu">
                    <button
                      className="profile-menu-close"
                      onClick={() => setIsMenuOpen(false)}
                      aria-label="Cerrar menú de perfil"
                      onMouseEnter={onMouseEnter}
                      onFocus={onFocus}
                    >
                      ✕
                    </button>
                    <div className="profile-menu-email">{user?.email}</div>
                    <div className="profile-menu-header">
                      <Avatar src={user?.avatar} alt="Perfil" size="large" />
                      <div className="profile-menu-user-info">
                        <h3>{user?.displayName}</h3>
                        <p className="profile-menu-role">
                          {user?.roleDescription}
                          {user?.roleDescription === "Propietario" && user?.verified && (
                            <i className="fas fa-check-circle verified-icon" title="Verificado"></i>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setIsMenuOpen(false); navigate("/perfil"); }}
                      className="profile-menu-manage-btn"
                      aria-label="Administrar cuenta"
                      onMouseEnter={onMouseEnter}
                      onFocus={onFocus}
                    >
                      Administrar cuenta
                    </button>
                    <div className="profile-menu-divider"></div>
                    <div className="profile-menu-items">
                      {user?.roleDescription === "Usuario" && (
                        <>
                          <button
                            onClick={() => { setIsMenuOpen(false); navigate("/crear-negocio") }}
                            className="menu-item"
                            aria-label="Crear negocio"
                            onMouseEnter={onMouseEnter}
                            onFocus={onFocus}
                          >
                            <span>🏪</span> Crear Negocio
                          </button>
                          <button
                            onClick={() => { setIsMenuOpen(false); navigate("/guardados") }}
                            className="menu-item"
                            aria-label="Ver guardados"
                            onMouseEnter={onMouseEnter}
                            onFocus={onFocus}
                          >
                            <span>📍</span> Guardados
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => { setIsMenuOpen(false); navigate("/ajustes") }}
                        className="menu-item"
                        aria-label="Ir a ajustes"
                        onMouseEnter={onMouseEnter}
                        onFocus={onFocus}
                      >
                        <span>⚙️</span> Ajustes
                      </button>
                    </div>
                    <div className="profile-menu-divider"></div>
                    <button
                      onClick={handleLogout}
                      className="menu-item logout"
                      aria-label="Cerrar sesión"
                      onMouseEnter={onMouseEnter}
                      onFocus={onFocus}
                    >
                      <span>🚪</span> Cerrar sesión
                    </button>
                  </div>
                )}
              </li>
            </>
          )}
          <li
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            onMouseEnter={onMouseEnter}
            onFocus={onFocus}
            tabIndex={0}
            role="button"
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </li>
        </ul>
      </div>

      {showNotification && (
        <div className="navbar-notification" onClick={() => navigate(user?.roleDescription === "Propietario" ? "/perfil?section=owner-profile" : "/perfil")}>
          <div className="notification-badge"><i className="fas fa-exclamation-circle"></i></div>
          <div className="notification-message">
            <span className="notification-title">Completa tu perfil: </span>
            <span className="notification-detail">{missingItems.join(", ")}</span>
          </div>
        </div>
      )}
    </nav>
  );
}