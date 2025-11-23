import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "./Accesibilidad.css";
import { API_URL } from "../../config/api";

interface Business {
  business_id: number;
  business_name: string;
  address: string;
  logo_url?: string;
  owner_name?: string;
  average_rating?: number;
  user?: {
    people?: {
      firstName?: string;
      firstLastName?: string;
    };
  };
  business_accessibility?: any[];
}

interface Accessibility {
  accessibility_id: number;
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

export default function Accesibilidad() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [accessibility, setAccessibility] = useState<Accessibility | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Detectar de dónde viene el usuario
  const fromAllAccessibilities = location.state?.from === 'todas-accesibilidades';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener información de la accesibilidad
        const accessResp = await fetch(`${API_URL}/accessibility`);
        
        if (!accessResp.ok) {
          throw new Error(`Error al obtener accesibilidades: ${accessResp.status}`);
        }
        
        const allAccessibilities: Accessibility[] = await accessResp.json();
        
        const currentAccessibility = allAccessibilities.find(
          (a) => a.accessibility_id === Number(id)
        );
        
        if (!currentAccessibility) {
          setError("Accesibilidad no encontrada");
          setLoading(false);
          return;
        }
        
        setAccessibility(currentAccessibility);

        // Usar el nuevo endpoint que consulta directamente business_accessibility
        const businessResp = await fetch(`${API_URL}/business/public/by-accessibility/${id}`);
        
        if (!businessResp.ok) {
          const errorText = await businessResp.text();
          console.error("Error response:", errorText);
          throw new Error(`Error al obtener negocios: ${businessResp.status}`);
        }
        
        const filteredBusinesses: Business[] = await businessResp.json();
        setBusinesses(filteredBusinesses);
      } catch (e: any) {
        console.error("Error completo:", e);
        setError(e?.message || "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const goToDetail = (businessId: number) => {
    navigate(`/local/${businessId}`);
  };

  const handleBack = () => {
    if (fromAllAccessibilities) {
      navigate('/accesibilidades');
    } else {
      navigate('/');
      // Hacer scroll a la sección de accesibilidades
      setTimeout(() => {
        const section = document.getElementById('seccion-accesibilidades');
        if (section) {
          const offset = 100;
          const top = section.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 100);
    }
  };

  if (loading) {
    return (
      <div className="accesibilidad-page">
        <div className="loading-container">
          <div className="loading">Cargando...</div>
        </div>
      </div>
    );
  }

  if (error || !accessibility) {
    return (
      <div className="accesibilidad-page">
        <div className="error-container">
          <div className="error">{error || "No se encontró la accesibilidad"}</div>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="accesibilidad-page">
      {/* Header con información de la accesibilidad */}
      <section className="accesibilidad-header">
        <div className="accesibilidad-header-content">
          <button className="back-button" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i> Atrás
          </button>
          
          <div className="accesibilidad-info">
            <div className="accesibilidad-icon-large">
              <i className={`fas ${iconMap[accessibility.accessibility_name] || 'fa-check-circle'}`}></i>
            </div>
            <h1 className="accesibilidad-title">{accessibility.accessibility_name}</h1>
            <p className="accesibilidad-description">{accessibility.description}</p>
          </div>
        </div>
      </section>

      {/* Resultados */}
      <section className="accesibilidad-results">
        <div className="results-container">
          <div className="results-header">
            <h2>
              {businesses.length > 0 
                ? `${businesses.length} ${businesses.length === 1 ? 'local encontrado' : 'locales encontrados'}`
                : 'No se encontraron locales'}
            </h2>
          </div>

          {businesses.length === 0 ? (
            <div className="no-results">
              <i className="fas fa-search fa-3x"></i>
              <p>No hay locales registrados con esta accesibilidad</p>
              <button className="btn btn-outline" onClick={() => navigate('/')}>
                Explorar otras categorías
              </button>
            </div>
          ) : (
            <div className="business-grid">
              {businesses.map((b) => (
                <article
                  key={b.business_id}
                  className="business-card"
                  onClick={() => goToDetail(b.business_id)}
                >
                  <div className="business-image">
                    <img 
                      src={b.logo_url || 'https://res.cloudinary.com/demo/image/upload/sample.jpg'} 
                      alt={b.business_name}
                    />
                  </div>
                  <div className="business-content">
                    <h3 className="business-name">{b.business_name}</h3>
                    <p className="business-address">
                      <i className="fas fa-map-marker-alt"></i>
                      {b.address || 'Dirección no disponible'}
                    </p>
                    
                    <div className="business-meta">
                      {(() => {
                        const ownerName = b.owner_name || 
                          (b.user?.people ? 
                            `${b.user.people.firstName || ''} ${b.user.people.firstLastName || ''}`.trim() 
                            : '');
                        return ownerName ? (
                          <span className="business-owner">
                            <i className="fas fa-user"></i>
                            {ownerName}
                          </span>
                        ) : null;
                      })()}
                      
                      {typeof b.average_rating !== 'undefined' && (
                        <span className="business-rating">
                          ⭐ {Number(b.average_rating).toFixed(1)}
                        </span>
                      )}
                    </div>
                    
                    <button
                      className="btn btn-primary btn-small"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        goToDetail(b.business_id); 
                      }}
                    >
                      Ver detalles
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
