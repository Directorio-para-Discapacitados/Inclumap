import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./inicio.css";


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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = (params.get("q") || "").trim();
    setQuery(q);

    if (!q) {
      setCards(defaultCards);
      return;
    }

    const qLower = q.toLowerCase();
    const filtered = defaultCards.filter((c) =>
      c.title.toLowerCase().includes(qLower) || c.desc.toLowerCase().includes(qLower)
    );
    setCards(filtered.length ? filtered : []);

    setTimeout(() => {
      if (cardsRef.current) cardsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }, [location.search]);

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
        {query ? (
          <div className="search-results-info">
            Resultados para: "{query}" <button className="clear-btn" onClick={handleClearSearch}>Limpiar</button>
          </div>
        ) : null}

        <h2>Explora por Categoría y Filtra tus Necesidades</h2>
        <p className="sub-title">Filtra por distancia, tipo de servicio o directamente por elementos de accesibilidad específicos.</p>

        <div className="cards-grid" ref={cardsRef}>
          {cards.length === 0 ? (
            <div className="no-results">No se encontraron resultados para "{query}"</div>
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