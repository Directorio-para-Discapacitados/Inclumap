import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TodasAccesibilidades.css";
import { API_URL } from "../../config/api";
import { useSpeakable } from "../../hooks/useSpeakable";

interface Accessibility {
  accessibility_id: number | string;
  accessibility_name: string;
  description: string;
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

export default function TodasAccesibilidades() {
  const navigate = useNavigate();
  const { onMouseEnter, onFocus } = useSpeakable();
  
  const [accesibilidades, setAccesibilidades] = useState<Accessibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccesibilidades = async () => {
      try {
        setLoading(true);
        const resp = await fetch(`${API_URL}/accessibility`, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });
        
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        }
        
        const data: Accessibility[] = await resp.json();
        setAccesibilidades(data || []);
      } catch (e: any) {

        setError("No se pudieron cargar las accesibilidades");
        setAccesibilidades([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAccesibilidades();
  }, []);

  const handleAccessibilityClick = (accessibilityId: number | string) => {
    navigate(`/accesibilidad/${accessibilityId}`, {
      state: { from: 'todas-accesibilidades' }
    });
  };

  const handleVolver = () => {
    navigate("/");
    // Hacer scroll a la sección de accesibilidades después de navegar
    setTimeout(() => {
      const section = document.getElementById('seccion-accesibilidades');
      if (section) {
        const offset = 100; // Offset para el navbar
        const top = section.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="todas-accesibilidades-root">
      <div className="todas-accesibilidades-container">
        {/* Header con botón de atrás y título */}
        <div className="todas-accesibilidades-header">
          <button 
            className="todas-accesibilidades-btn-back"
            onClick={handleVolver}
            aria-label="Volver a inicio"
            onMouseEnter={onMouseEnter}
            onFocus={onFocus}
          >
            <i className="fas fa-arrow-left"></i> Atrás
          </button>
          
          <h1 className="todas-accesibilidades-title">
            Todas las Accesibilidades
          </h1>
        </div>

        {/* Contenido */}
        {loading && (
          <div className="todas-accesibilidades-loading">
            Cargando accesibilidades...
          </div>
        )}

        {error && !loading && (
          <div className="todas-accesibilidades-error">
            {error}
          </div>
        )}

        {!loading && !error && accesibilidades.length === 0 && (
          <div className="todas-accesibilidades-empty">
            No se encontraron accesibilidades
          </div>
        )}

        {!loading && !error && accesibilidades.length > 0 && (
          <div className="todas-accesibilidades-grid">
            {accesibilidades.map((acc) => (
              <button
                key={acc.accessibility_id}
                className="todas-accesibilidades-card-btn"
                onClick={() => handleAccessibilityClick(acc.accessibility_id)}
                aria-label={`Filtrar por ${acc.accessibility_name}. ${acc.description || 'Haz clic para ver locales con esta accesibilidad'}`}
                onMouseEnter={onMouseEnter}
                onFocus={onFocus}
              >
                <div className="todas-accesibilidades-card">
                  <div className="todas-accesibilidades-card-icon" aria-hidden="true">
                    <i className={`fas ${iconMap[acc.accessibility_name] || 'fa-check-circle'}`} />
                  </div>
                  <h3 className="todas-accesibilidades-card-title">
                    {acc.accessibility_name}
                  </h3>
                  <p className="todas-accesibilidades-card-desc">
                    {acc.description || 'Haz clic para ver locales con esta accesibilidad'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
