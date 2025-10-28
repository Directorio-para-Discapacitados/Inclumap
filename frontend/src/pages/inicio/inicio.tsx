import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "./inicio.css";

export default function Inicio() {
  const location = useLocation();
  const cardsRef = useRef<HTMLDivElement | null>(null);
  const defaultCards = [
    { icon: "fa-wheelchair", title: "Lugares accesibles", desc: "Restaurantes, parques, transporte público" },
    { icon: "fa-hands-helping", title: "Apoyo y comunidad", desc: "Foros, apoyos locales" },
    { icon: "fa-handshake", title: "Apoyo y oportunidades", desc: "Foros, oportunidades laborales locales" },
    { icon: "fa-heart", title: "Salud y bienestar", desc: "Terapia, hospitales" },
    { icon: "fa-graduation-cap", title: "Educación y empleo", desc: "Formación y oportunidades" },
    { icon: "fa-briefcase", title: "Empleos inclusivos", desc: "Oportunidades laborales" },
    { icon: "fa-tools", title: "Ayudas tecnológicas", desc: "Dispositivos y software de apoyo" },
    { icon: "fa-gavel", title: "Legal y derechos", desc: "Defensa y ayuda legal" }
  ];

  const [cards, setCards] = useState(defaultCards);
  const [query, setQuery] = useState("");

  //Cuando cambie el query param ?q= en la URL, filtrar tarjetas
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

    // desplazar hacia las tarjetas para que el usuario vea los resultados
    setTimeout(() => {
      if (cardsRef.current) cardsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }, [location.search]);

  const handleClearSearch = () => {
    setCards(defaultCards);
    setQuery("");
    // limpiar query param en URL sin recargar
    if (location.search) window.history.replaceState({}, "", window.location.pathname);
  };

  return (
    <div className="inicio-root">

      {/* Hero principal: imagen de fondo, botones centrados */}
      <section className="hero">
        <div className="hero-overlay">
          {/* badge integrado al fondo: la imagen se aplica via CSS en .hero-overlay::before */}
          <div className="hero-content">
            <h1 className="hero-title">Encuentra lugares accesibles cerca de ti</h1>
            <p className="hero-sub">Busca negocios, servicios y recursos que promuevan la inclusión.</p>

            <div className="hero-actions">
              <button className="btn btn-primary">ENCONTRAR RECURSOS</button>
              <button className="btn btn-outline">COMPARTIR TU EXPERIENCIA</button>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de tarjetas (grid) */}
      <main className="cards-section">
        {query ? (
          <div className="search-results-info">
            Resultados para: "{query}" <button className="clear-btn" onClick={handleClearSearch}>Limpiar</button>
          </div>
        ) : null}

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
