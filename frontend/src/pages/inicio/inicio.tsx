import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./inicio.css";
import { API_URL } from "../../config/api";
import { getAllCategories, Category } from "../../services/categoryService";
import { useAuth } from "../../context/AuthContext";
import { useSpeakable } from "../../hooks/useSpeakable";
import AdminDashboard from "../../Components/AdminDashboard/AdminDashboard";
import OwnerDashboard from "../../Components/OwnerDashboard/OwnerDashboard";

/* --- IMPORTACIONES PARA EL MAPA --- */
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* --- FIX PARA ICONOS DE LEAFLET --- */
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

interface Accessibility {
  accessibility_id: number | string;
  accessibility_name: string;
  description: string;
}

export default function Inicio() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const cardsRef = useRef<HTMLDivElement | null>(null);
  const communityRef = useRef<HTMLElement | null>(null);
  const { onMouseEnter, onFocus } = useSpeakable();

  const [cards, setCards] = useState<Accessibility[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [allBusinesses, setAllBusinesses] = useState<any[]>([]);
  const [loadingAllBusinesses, setLoadingAllBusinesses] = useState(true);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [selectedAccessibility, setSelectedAccessibility] = useState<number | string | null>(null);
  const [loadingAccessibilities, setLoadingAccessibilities] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Cargar accesibilidades desde BD
  useEffect(() => {
    const fetchAccessibilities = async () => {
      try {
        setLoadingAccessibilities(true);
        
        const resp = await fetch(`${API_URL}/accessibility`, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });
        
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        }
        
        const data: Accessibility[] = await resp.json();
        setCards(data || []);
      } catch (e: any) {
        console.error("Error cargando accesibilidades:", e.message, e);
        setCards([]);
      } finally {
        setLoadingAccessibilities(false);
      }
    };
    fetchAccessibilities();
  }, []);

  // Cargar categorías desde BD
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await getAllCategories();
        setCategories(data || []);
      } catch (e: any) {
        console.error("Error cargando categorías:", e.message, e);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Cargar todos los negocios registrados
  useEffect(() => {
    const fetchAllBusinesses = async () => {
      try {
        setLoadingAllBusinesses(true);
        const resp = await fetch(`${API_URL}/business/public/search`, {
          method: "GET",
        });
        
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        }
        
        const data = await resp.json();
        // Mezclar aleatoriamente los negocios
        const shuffledData = [...data].sort(() => Math.random() - 0.5);
        setAllBusinesses(shuffledData || []);
      } catch (e: any) {
        console.error("Error cargando negocios:", e.message, e);
        setAllBusinesses([]);
      } finally {
        setLoadingAllBusinesses(false);
      }
    };
    fetchAllBusinesses();
  }, []);

  // Manejar clic en accesibilidad - navegar a página dedicada
  const handleAccessibilityClick = (accessibilityId: number | string) => {
    navigate(`/accesibilidad/${accessibilityId}`);
  };

  // Limpiar filtro de accesibilidad
  const handleClearAccessibilityFilter = () => {
    setSelectedAccessibility(null);
    setFiltered([]);
    setError(null);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = (params.get("q") || "").trim();
    const catParam = params.get("categoryId");
    const catId = catParam ? parseInt(catParam, 10) : null;

    setQuery(q);
    setSelectedCategory(catId);

    // Si no hay query y no hay categoría seleccionada, limpiar
    if (!q && !catId && !selectedAccessibility) {
      setFiltered([]);
      setSelectedAccessibility(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      try {
        setError(null);
        
        // Construir URL con parámetros opcionales
        let url = `${API_URL}/business/public/search`;
        const params = new URLSearchParams();
        
        if (q) {
          params.append('q', q);
        }
        if (catId) {
          params.append('categoryId', catId.toString());
        }
        
        const queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
        
        // Usar endpoint público de búsqueda para máxima fluidez
        const resp = await fetch(url, {
          method: "GET",
          signal,
        });
        if (!resp.ok) {
          throw new Error("No se pudo obtener locales públicos");
        }
        const data = await resp.json();
        
        if (signal.aborted) return;
        setFiltered(data || []);
        setSelectedAccessibility(null);
      } catch (e: any) {
        if (e?.name === 'AbortError') return; // ignorar abortos
        setError(e?.message || "Error al cargar locales");
      } finally {
        if (signal.aborted) return;
      }
    };

    fetchData();
    return () => controller.abort();
  }, [location.search, selectedAccessibility]); // Dependemos de la URL

  // Escuchar evento global para limpiar resultados
  useEffect(() => {
    const handler = () => {
      setQuery("");
      setFiltered([]);
      setBusinesses([]);
      setError(null);
      setLoading(false);
      setSelectedCategory(null);
    };
    window.addEventListener('inclumap:clear-search', handler as EventListener);
    return () => window.removeEventListener('inclumap:clear-search', handler as EventListener);
  }, []);

  // Escuchar cambios de categoría desde el Navbar
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const categoryId = e.detail?.categoryId;
      setSelectedCategory(categoryId);
    };
    window.addEventListener('inclumap:category-changed', handler as EventListener);
    return () => window.removeEventListener('inclumap:category-changed', handler as EventListener);
  }, []);

  // Auto-scroll a resultados
  useEffect(() => {
    if (!query && !selectedCategory) return;
    // Si hay resultados, scroll
    if (filtered.length > 0) {
        const t = setTimeout(() => {
        const el = cardsRef.current;
        if (!el) return;
        const offset = 80;
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
        }, 50);
        return () => clearTimeout(t);
    }
  }, [query, selectedCategory, loading, filtered.length]);

  // Scroll automático a la sección Comunidad y Respaldo
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get("section");
    if (section !== "community") return;

    let attempts = 0;
    const maxAttempts = 5;

    const doScroll = () => {
      const el = communityRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const offset = 140;
      const top = rect.top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    };

    doScroll();
    const interval = setInterval(() => {
      attempts += 1;
      doScroll();
      if (attempts >= maxAttempts) clearInterval(interval);
    }, 400);

    return () => clearInterval(interval);
  }, [location.search]);

  // Si el usuario es administrador, mostrar el panel de administración
  const isAdmin = user?.rolIds?.includes(1);
  
  if (isAdmin) {
    return <AdminDashboard />;
  }

  const iconMap: Record<string, string> = {
    "Rampa Acceso": "fa-wheelchair",
    "Baño adaptado": "fa-universal-access",
    "Estacionamiento para discapacitados": "fa-parking",
    "Puertas Anchas": "fa-door-open",
    "Circulación Interior": "fa-arrows-alt",
    "Ascensor Accesible": "fa-elevator",
    "Pisos": "fa-grip-lines",
    "Barras de Apoyo": "fa-hands-helping",
    "Lavamanos Accesible": "fa-sink",
    "Mostrador/Caja Accesible": "fa-cash-register",
    "Señalización (SIA)": "fa-sign",
    "Señalización Táctil/Braille": "fa-braille"
  };

  const goToDetail = (id: number | string) => {
    navigate(`/local/${id}`);
  };

  const handleClearSearch = () => {
    setQuery("");
    setSelectedAccessibility(null);
    setSelectedCategory(null);
    setFiltered([]);
    if (location.search) window.history.replaceState({}, "", window.location.pathname);
  };

  // Manejar selección de categoría
  const handleCategoryClick = (categoryId: number) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null); // Deseleccionar si ya está seleccionada
    } else {
      setSelectedCategory(categoryId);
      // Si no hay búsqueda de texto, iniciar búsqueda con solo categoría
      if (!query) {
        // setQuery(" "); // Espacio para activar la búsqueda (YA NO ES NECESARIO)
      }
    }
  };

  /* --- LÓGICA DE PUNTOS DEL MAPA CORREGIDA --- */
  // Si hay CUALQUIER filtro activo (query O categoría), mostramos 'filtered'
  // incluso si 'filtered' está vacío (0 resultados).
  // Solo mostramos 'allBusinesses' si el usuario NO está buscando nada.
  const mapPoints = (query || selectedCategory || selectedAccessibility) ? filtered : allBusinesses;

  // Si el usuario es propietario, mostrar dashboard
  if (user?.roleDescription === "Propietario") {
    return <OwnerDashboard />;
  }

  return (
    <div className="inicio-root">

      {/* 1. Sección Hero */}
      <section className="hero">
        <div className="hero-overlay">
          <div className="hero-content">

            <h1 className="hero-title">IncluMap: Tu mapa hacia la Inclusión y la Accesibilidad</h1>
            <p className="hero-sub">
                Encuentra, valora y comparte lugares accesibles para todos. Nuestro directorio ofrece filtros
                por rampas, baños adaptados, braille y más, con "reseñas valadas por la comunidad".
                ¡Descubre un mundo sin barreras!
            </p>

            <div className="hero-actions">
              <button 
                className="btn btn-primary"
                onClick={() => { 
                    navigate("/negocios"); 
                }}
              >
                ENCONTRAR LUGARES ACCESIBLES
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => { navigate("/registro"); }}
              >
                COMPARTIR TU EXPERIENCIA
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Negocios Registrados */}
      <section className="registered-businesses-section">
        <div className="section-header">
          <h2>Negocios Registrados</h2>
          <p className="sub-title">Descubre los establecimientos verificados que forman parte de nuestra red inclusiva</p>
        </div>
        
        <div className="businesses-container">
          {/* Mostrar resultados si hay búsqueda O categoría seleccionada */}
          {(query || selectedCategory) ? (
            <div className="businesses-grid businesses-grid--results" ref={cardsRef}>
              {loading && <div className="loading">Cargando locales...</div>}
              {error && !loading && <div className="error">{error}</div>}
              
              {/* Mensaje de SIN RESULTADOS cuando se filtra */}
              {!loading && !error && filtered.length === 0 && (
                <div className="no-results">
                  {query 
                    ? `No se encontraron locales para "${query}"`
                    : 'No se encontraron locales para esta categoría'
                  }
                </div>
              )}

              {!loading && !error && filtered.map((b) => {
                const ownerName = b.owner_name || (b.user?.people ? `${b.user.people.firstName || ''} ${b.user.people.firstLastName || ''}`.trim() : '');

                return (
                  <article
                    key={b.business_id || b.id}
                    className="business-card-static"
                  >
                    <div className="business-image-wrapper">
                      <img
                        src={b.logo_url || 'https://res.cloudinary.com/demo/image/upload/sample.jpg'}
                        alt={b.business_name || b.name}
                        className="business-img"
                      />
                      {b.verified && (
                        <div className="verification-badge-static">
                          <i className="fas fa-check-circle"></i>
                          <span>Verificado</span>
                        </div>
                      )}
                    </div>

                    <div className="business-content">
                      <h3 className="business-title">{b.business_name || b.name}</h3>

                      <div className="business-info-list">
                        {b.address && (
                          <p className="business-info-item">
                            <i className="fas fa-map-marker-alt"></i>
                            <span>{b.address}</span>
                          </p>
                        )}

                        {ownerName && (
                          <p className="business-info-item">
                            <i className="fas fa-user"></i>
                            <span>{ownerName}</span>
                          </p>
                        )}

                        {typeof b.average_rating !== 'undefined' && (
                          <p className="business-info-item">
                            <i className="fas fa-star"></i>
                            <span>{Number(b.average_rating).toFixed(1)}</span>
                          </p>
                        )}
                      </div>

                      <button
                        className="btn-details-static"
                        onClick={() => goToDetail(b.business_id || b.id)}
                      >
                        Ver Detalles
                      </button>
                    </div>
                  </article>
                );
              })}

              {!loading && !error && filtered.length > 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: 20 }}>
                  <button className="btn btn-outline" onClick={handleClearSearch}>
                    Limpiar filtro
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Vista por defecto (sin filtros) */}
              {loadingAllBusinesses && <div className="loading">Cargando negocios...</div>}
              {!loadingAllBusinesses && allBusinesses.length === 0 && (
                <div className="no-results">No hay negocios registrados aún</div>
              )}
              {!loadingAllBusinesses && allBusinesses.length > 0 && (
                <>
                  <div className="businesses-grid">
                    {allBusinesses.slice(0, 5).map((business) => (
                      <article
                        key={business.business_id}
                        className="business-card-static"
                        aria-label={`${business.business_name}. ${business.address || ''}. Calificación: ${typeof business.average_rating !== 'undefined' ? Number(business.average_rating).toFixed(1) : 'Sin calificación'}`}
                        onMouseEnter={onMouseEnter}
                        onFocus={onFocus}
                        tabIndex={0}
                      >
                        <div className="business-image-wrapper">
                          <img 
                            src={business.logo_url || 'https://res.cloudinary.com/demo/image/upload/sample.jpg'} 
                            alt={business.business_name}
                            className="business-img"
                          />
                          {business.verified && (
                            <div className="verification-badge-static">
                              <i className="fas fa-check-circle"></i>
                              <span>Verificado</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="business-content">
                          <h3 className="business-title">{business.business_name}</h3>
                          
                          <div className="business-info-list">
                            {business.address && (
                              <p className="business-info-item">
                                <i className="fas fa-map-marker-alt"></i>
                                <span>{business.address}</span>
                              </p>
                            )}
                            
                            {business.owner_name && (
                              <p className="business-info-item">
                                <i className="fas fa-user"></i>
                                <span>{business.owner_name}</span>
                              </p>
                            )}
                            
                            {typeof business.average_rating !== 'undefined' && (
                              <p className="business-info-item">
                                <i className="fas fa-star"></i>
                                <span>{Number(business.average_rating).toFixed(1)}</span>
                              </p>
                            )}
                          </div>
                          
                          <button
                            className="btn-details-static"
                            onClick={() => goToDetail(business.business_id)}
                            aria-label={`Ver detalles de ${business.business_name}`}
                            onMouseEnter={onMouseEnter}
                            onFocus={onFocus}
                          >
                            Ver Detalles
                          </button>
                        </div>
                      </article>
                    ))}
                    
                    {allBusinesses.length > 5 && (
                      <article 
                        className="business-card-ver-mas" 
                        onClick={() => navigate('/negocios')}
                        aria-label={`Ver más negocios. ${allBusinesses.length - 5} negocios más disponibles`}
                        onMouseEnter={onMouseEnter}
                        onFocus={onFocus}
                        tabIndex={0}
                        role="button"
                      >
                        <div className="ver-mas-card-content">
                          <div className="ver-mas-icon-circle">
                            <i className="fas fa-arrow-right"></i>
                          </div>
                          <h3 className="ver-mas-title">Ver Más Negocios</h3>
                          <p className="ver-mas-text">
                            {allBusinesses.length - 5} negocios más disponibles
                          </p>
                        </div>
                      </article>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>
      
      {/* 3. Explora por Categoría y Filtra tus Necesidades */}
      <main className="cards-section">
        <h2>Explora por Categoría y Filtra tus Necesidades</h2>
        <p className="sub-title">Filtra por distancia, tipo de servicio o directamente por elementos de accesibilidad específicos.</p>

        {/* Resultados de búsqueda o filtro de accesibilidad */}
        {selectedAccessibility && !query && (
          <div className="cards-grid cards-grid--results">
            {loading && <div className="loading">Cargando locales...</div>}
            {error && !loading && <div className="error">{error}</div>}
            {!loading && !error && filtered.length === 0 && (
              <div className="no-results">
                {"No se encontraron locales con esa accesibilidad"}
              </div>
            )}
            {!loading && !error && filtered.map((b) => (
              <article
                key={b.business_id || b.id}
                className="card biz-card"
                onClick={() => goToDetail(b.business_id || b.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="biz-thumb">
                  <img 
                    src={b.logo_url || 'https://res.cloudinary.com/demo/image/upload/sample.jpg'} 
                    alt={b.business_name || b.name}
                  />
                </div>
                <div className="biz-body">
                  <h3 className="biz-title">{b.business_name || b.name}</h3>
                  <p className="biz-address">{b.address || 'Dirección no disponible'}</p>
                  <div className="biz-meta">
                    {(() => {
                      const ownerName = b.owner_name || (b.user?.people ? `${b.user.people.firstName || ''} ${b.user.people.firstLastName || ''}`.trim() : '');
                      return ownerName ? (
                        <span className="biz-owner">Propietario: {ownerName}</span>
                      ) : null;
                    })()}
                    {typeof b.average_rating !== 'undefined' && (
                      <span className="biz-rating">⭐ {Number(b.average_rating).toFixed(1)}</span>
                    )}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <button
                      className="btn btn-primary"
                      onClick={(e) => { e.stopPropagation(); goToDetail(b.business_id || b.id); }}
                    >
                      Ver más
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Grid de accesibilidades */}
        <div className="cards-grid">
          {loadingAccessibilities && <div className="loading">Cargando accesibilidades...</div>}
          {!loadingAccessibilities && cards.length === 0 && (
            <div className="no-results">No se encontraron accesibilidades</div>
          )}
          {!loadingAccessibilities && cards.map((c) => (
            <button
              key={c.accessibility_id}
              className="accessibility-btn"
              onClick={() => handleAccessibilityClick(c.accessibility_id)}
              aria-label={`Filtrar por ${c.accessibility_name}. ${c.description || 'Haz clic para ver locales con esta accesibilidad'}`}
              onMouseEnter={onMouseEnter}
              onFocus={onFocus}
            >
              <div className="card">
                <div className="card-icon" aria-hidden="true">
                  <i className={`fas ${iconMap[c.accessibility_name] || 'fa-check-circle'}`} />
                </div>
                <h3 className="card-title">{c.accessibility_name}</h3>
                <p className="card-desc">{c.description || 'Haz clic para ver locales con esta accesibilidad'}</p>
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* 4. Comunidad y Respaldo */}
      <section className="info-banner" ref={communityRef}>
          <div 
            className="info-banner-image" 
            style={{backgroundImage: `url('https://media.istockphoto.com/id/1428075845/es/foto/amigos-con-discapacidades-d%C3%A1ndose-la-mano.jpg?s=612x612&w=0&k=20&c=9kmptc8ckRTptHn7K-dZcY8OaNZfHggo5KkPtlXDeNM=')`}}
          ></div>

          <div className="info-content">
            <h2>Comunidad y Respaldo</h2>
            <p>
              En IncluMap, no solo encuentras lugares, ¡encuentras una comunidad! Accede a "reseñas y calificaciones de usuarios" con discapacidad para tomar decisiones informadas sobre dónde ir. Con tu ayuda, validamos la accesibilidad de cada rincón.
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate("/reviews")}
              aria-label="Ver reseñas confiables de la comunidad"
              onMouseEnter={onMouseEnter}
              onFocus={onFocus}
            >
              VER RESEÑAS CONFIABLES
            </button>
          </div>
      </section>
      
      {/* 5. Mapa Global de Accesibilidad */}
      <section className="global-map-section">
        <div className="map-header">
          <h2>🗺️ Mapa Global de Accesibilidad</h2>
          <p>
            Explora visualmente todos los puntos accesibles registrados. Usa el buscador superior para filtrar los resultados en el mapa.
          </p>
        </div>
        
        <div className="map-container-wrapper">
          <MapContainer 
            center={[4.6097, -74.0817]} // Coordenadas por defecto (ej. Bogotá)
            zoom={6} 
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom="center"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            
            {mapPoints.map((b) => {
              // Validar que existan coordenadas
              if (!b.latitude || !b.longitude) return null;
              
              return (
                <Marker 
                  key={b.business_id} 
                  position={[parseFloat(b.latitude), parseFloat(b.longitude)]}
                >
                  <Popup className="map-popup">
                    <div style={{ textAlign: 'center', minWidth: '200px' }}>
                      {b.logo_url && (
                        <img 
                          src={b.logo_url} 
                          alt={b.business_name} 
                          style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} 
                        />
                      )}
                      <strong style={{ fontSize: '1.1em', display: 'block', marginBottom: '4px' }}>{b.business_name}</strong>
                      <span className="popup-address" style={{ fontSize: '0.9em', display: 'block', marginBottom: '8px' }}>{b.address}</span>
                      
                      {b.average_rating && (
                        <div style={{ color: '#f39c12', marginBottom: '8px', fontWeight: 'bold' }}>
                          ⭐ {Number(b.average_rating).toFixed(1)}
                        </div>
                      )}
                      
                      <button 
                        className="btn btn-primary"
                        style={{ padding: '5px 15px', fontSize: '0.9rem', width: '100%' }}
                        onClick={() => goToDetail(b.business_id)}
                      >
                        Ver Detalle
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </section>
    </div>
  );
}
