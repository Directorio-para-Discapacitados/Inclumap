import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./inicio.css";
import { API_URL } from "../../config/api";

interface Accessibility {
  accessibility_id: number | string;
  accessibility_name: string;
  description: string;
}

export default function Inicio() {
  const location = useLocation();
  const navigate = useNavigate();
  const cardsRef = useRef<HTMLDivElement | null>(null);
  
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
  const goToDetail = (id: number | string) => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate(`/local/${id}`);
    } else {
      navigate('/login');
    }
  };

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
    setQuery(q);

    if (!q) {
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
        setLoading(true);
        setError(null);
        // Usar endpoint público de búsqueda para máxima fluidez (también con usuarios autenticados)
        const resp = await fetch(`${API_URL}/business/public/search?q=${encodeURIComponent(q)}`, {
          method: "GET",
          signal,
        });
        if (!resp.ok) {
          throw new Error("No se pudo obtener locales públicos");
        }
        const data = await resp.json();
        if (signal.aborted) return;
        setBusinesses(data || []);

        const qLower = q.toLowerCase();
        const filteredList = (data || []).filter((b: any) => {
          const name = (b.business_name || b.name || "").toLowerCase();
          const address = (b.address || "").toLowerCase();
          return name.includes(qLower) || address.includes(qLower);
        });
        setFiltered(filteredList);
        setSelectedAccessibility(null);
      } catch (e: any) {
        if (e?.name === 'AbortError') return; // ignorar abortos
        setError(e?.message || "Error al cargar locales");
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [location.search]);

  // Escuchar evento global para limpiar resultados inmediatamente cuando se borra el buscador
  useEffect(() => {
    const handler = () => {
      setQuery("");
      setFiltered([]);
      setBusinesses([]);
      setError(null);
      setLoading(false);
    };
    window.addEventListener('inclumap:clear-search', handler as EventListener);
    return () => window.removeEventListener('inclumap:clear-search', handler as EventListener);
  }, []);

  // Auto-scroll to the results section while typing when there is an active query
  useEffect(() => {
    if (!query) return;
    // wait a tick to ensure the results grid is rendered
    const t = setTimeout(() => {
      const el = cardsRef.current;
      if (!el) return;
      const offset = 80; // approximate navbar height
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }, 50);
    return () => clearTimeout(t);
  }, [query, loading, filtered.length]);

  const handleClearSearch = () => {
    setQuery("");
    setSelectedAccessibility(null);
    setFiltered([]);
    if (location.search) window.history.replaceState({}, "", window.location.pathname);
  };

  return (
    <div className="inicio-root">

      {/* 1. Sección Hero - IncluMap: Tu mapa hacia la Inclusión y la Accesibilidad */}
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
                      >
                        Ver Detalles
                      </button>
                    </div>
                  </article>
                ))}
                
                {allBusinesses.length > 5 && (
                  <article className="business-card-ver-mas" onClick={() => navigate('/negocios')}>
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
        </div>
      </section>
      
      {/* 3. Explora por Categoría y Filtra tus Necesidades */}
      <main className="cards-section">

        {/* Título de categorías SIEMPRE visible */}
        <h2>Explora por Categoría y Filtra tus Necesidades</h2>
        <p className="sub-title">Filtra por distancia, tipo de servicio o directamente por elementos de accesibilidad específicos.</p>

        {/* Resultados de búsqueda o filtro de accesibilidad */}
        {(query || selectedAccessibility) && (
          <div className="cards-grid" ref={cardsRef}>
            {loading && <div className="loading">Cargando locales...</div>}
            {error && !loading && <div className="error">{error}</div>}
            {!loading && !error && filtered.length === 0 && (
              <div className="no-results">
                {query ? `No se encontraron locales para "${query}"` : "No se encontraron locales con esa accesibilidad"}
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
            {(query || selectedAccessibility) && filtered.length > 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: 20 }}>
                <button className="btn btn-outline" onClick={handleClearSearch}>
                  Limpiar filtro
                </button>
              </div>
            )}
          </div>
        )}

        {/* Grid de accesibilidades como botones (mostrar solo si NO hay búsqueda o filtro activo) */}
        {!query && !selectedAccessibility && (
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
              >
                <div className="card">
                  <div className="card-icon">
                    <i className={`fas ${iconMap[c.accessibility_name] || 'fa-check-circle'}`} />
                  </div>
                  <h3 className="card-title">{c.accessibility_name}</h3>
                  <p className="card-desc">{c.description || 'Haz clic para ver locales con esta accesibilidad'}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* 4. Comunidad y Respaldo */}
      <section 
        className="info-banner" 
      >
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
>
  VER RESEÑAS CONFIABLES
</button>

          </div>
      </section>
      
      {/* 5. Validación Impulsada por IA y Moderadores */}
      <section className="ai-validation-section">
        
        <div className="ai-validation-content">
          <h2>Validación Impulsada por IA y Moderadores</h2>
          <p>
            Garantizamos la "confiabilidad de la información". Al subir una foto, nuestra IA la analiza para detectar elementos de accesibilidad (rampas, pasamanos). Además, nuestros **administradores moderan** reseñas y fotos para asegurar que el contenido sea preciso y respetuoso.
          </p>
          <div className="ai-features-grid">
              <div>✅ Detección de Rampas por IA</div>
              <div>✅ Verificación de Señalización</div>
              <div>✅ Moderación Humana de Reseñas</div>
              <div>✅ Respuestas de Propietarios</div>
          </div>
          <button 
                className="btn btn-primary"
                onClick={() => { navigate("/login"); }}
              >
                SUBIR MI PRIMERA FOTO
          </button>
        </div>

        <div 
          className="ai-validation-image" 
          style={{backgroundImage: `url('https://cdn.prod.website-files.com/64c96252c4314a904a4fb7bd/6722933ac6ab116274337e2b_La%20Inteligencia%20Artificial%20ofrece%20alternativas%20para%20las%20personas%20que%20tienen%20alguna%20discapacidad.webp')`}}
        ></div>
      </section>
    </div>
  );
}