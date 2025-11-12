import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./inicio.css";
import { API_URL } from "../../config/api";


export default function Inicio() {
  const location = useLocation();
  const navigate = useNavigate();
  const cardsRef = useRef<HTMLDivElement | null>(null);
  
  const defaultCards = [
    { icon: "fa-wheelchair", title: "Rampas de Acceso", desc: "Ver lugares con acceso sin escalones." },
    { icon: "fa-universal-access", title: "Baños Accesibles", desc: "Encuentra establecimientos con baños adaptados." },
    { icon: "fa-sign-language", title: "Información en Braille", desc: "Locales con señalización o menús en Braille." },
    { icon: "fa-hands-helping", title: "Apoyo y Comunidad", desc: "Foros, grupos de apoyo locales y recursos." },
    { icon: "fa-briefcase", title: "Empleos Inclusivos", desc: "Oportunidades laborales y formación especializada." },
    { icon: "fa-tools", title: "Ayudas Tecnológicas", desc: "Dispositivos y software de apoyo." },
    { icon: "fa-heart", title: "Salud y Bienestar", desc: "Clínicas y centros de terapia accesibles." },
    { icon: "fa-gavel", title: "Legal y Derechos", desc: "Defensa y ayuda legal para la comunidad." }
  ];

  const [cards, setCards] = useState(defaultCards);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const goToDetail = (id: number | string) => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate(`/local/${id}`);
    } else {
      navigate('/login');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = (params.get("q") || "").trim();
    setQuery(q);

    if (!q) {
      setCards(defaultCards);
      setFiltered([]);
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
    setCards(defaultCards);
    setQuery("");
    if (location.search) window.history.replaceState({}, "", window.location.pathname);
  };

  return (
    <div className="inicio-root">

      <section className="hero">
        <div className="hero-overlay">
          <div className="hero-content">

            <h1 className="hero-title">IncluMap: Tu mapa hacia la Inclusión y la Accesibilidad</h1>
            <p className="hero-sub">
                Encuentra, valora y comparte lugares accesibles para todos. Nuestro directorio ofrece filtros
                por rampas, baños adaptados, braille y más, con "reseñas valadas por la comunidad".
                ¡Descubre un mundo sin barreras!
            </p>

            {/* --- EL LOGO <img /> HA SIDO ELIMINADO DE AQUÍ --- */}

            <div className="hero-actions">
              <button 
                className="btn btn-primary"
                onClick={() => { 
                    navigate("/?q=Lugares"); 
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
            <button className="btn btn-primary">VER RESEÑAS CONFIABLES</button>
          </div>
      </section>
      
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
      
      <main className="cards-section">

        {/* Título de categorías SIEMPRE visible */}
        <h2>Explora por Categoría y Filtra tus Necesidades</h2>
        <p className="sub-title">Filtra por distancia, tipo de servicio o directamente por elementos de accesibilidad específicos.</p>

        {/* Resultados de búsqueda (si hay query) */}
        {query && (
          <div className="cards-grid" ref={cardsRef}>
            {loading && <div className="loading">Cargando locales...</div>}
            {error && !loading && <div className="error">{error}</div>}
            {!loading && !error && filtered.length === 0 && (
              <div className="no-results">No se encontraron locales para "{query}"</div>
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

        {/* Grid de categorías SIEMPRE visible */}
        <div className="cards-grid">
          {cards.length === 0 ? (
            <div className="no-results">No se encontraron resultados</div>
          ) : (
            cards.map((c) => (
              <article key={c.title} className="card">
                <div className="card-icon"><i className={`fas ${c.icon}`} /></div>
                <h3 className="card-title">{c.title}</h3>
                <p className="card-desc">{c.desc}</p>
              </article>
            ))
          )}
        </div>
      </main>
    </div>
  );
}