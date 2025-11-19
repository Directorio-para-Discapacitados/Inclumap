import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Negocios.css";
import { API_URL } from "../../config/api";

export default function Negocios() {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllBusinesses = async () => {
      try {
        setLoading(true);
        const resp = await fetch(`${API_URL}/business/public/search`, {
          method: "GET",
        });
        
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        }
        
        const data = await resp.json();
        setBusinesses(data || []);
      } catch (e: any) {
        console.error("Error cargando negocios:", e.message, e);
        setError("Error al cargar los negocios");
        setBusinesses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAllBusinesses();
  }, []);

  const goToDetail = (id: number | string) => {
    navigate(`/local/${id}`);
  };

  return (
    <div className="negocios-page">
      <div className="negocios-header">
        <div className="header-title-row">
          <button className="btn-back" onClick={() => navigate('/')}>
            <i className="fas fa-arrow-left"></i>
            <span>Volver</span>
          </button>
          <h1>Todos los Negocios Registrados</h1>
        </div>
        <p>Explora todos los establecimientos verificados que forman parte de nuestra red inclusiva</p>
      </div>

      <div className="negocios-container">
        {loading && <div className="loading">Cargando negocios...</div>}
        {error && !loading && <div className="error">{error}</div>}
        {!loading && businesses.length === 0 && (
          <div className="no-results">No hay negocios registrados aún</div>
        )}
        {!loading && businesses.length > 0 && (
          <div className="negocios-grid">
            {businesses.map((business) => (
              <article
                key={business.business_id}
                className="negocio-card"
              >
                <div className="negocio-image-container">
                  <img 
                    src={business.logo_url || 'https://res.cloudinary.com/demo/image/upload/sample.jpg'} 
                    alt={business.business_name}
                    className="negocio-image"
                  />
                  {business.verified && (
                    <div className="negocio-verification-badge">
                      <i className="fas fa-check-circle"></i>
                      <span>Verificado</span>
                    </div>
                  )}
                </div>
                
                <div className="negocio-content">
                  <h3 className="negocio-name">{business.business_name}</h3>
                  
                  <div className="negocio-details">
                    {business.address && (
                      <p className="negocio-detail-item">
                        <i className="fas fa-map-marker-alt"></i>
                        <span>{business.address}</span>
                      </p>
                    )}
                    
                    {business.owner_name && (
                      <p className="negocio-detail-item">
                        <i className="fas fa-user"></i>
                        <span>{business.owner_name}</span>
                      </p>
                    )}
                    
                    {typeof business.average_rating !== 'undefined' && (
                      <div className="negocio-rating-container">
                        <div className="negocio-stars">
                          {[...Array(5)].map((_, index) => (
                            <i 
                              key={index}
                              className={`fas fa-star ${index < Math.round(business.average_rating) ? 'star-filled' : 'star-empty'}`}
                            />
                          ))}
                        </div>
                        <span className="negocio-rating-text">{Number(business.average_rating).toFixed(1)}</span>
                      </div>
                    )}

                    {business.business_accessibility && business.business_accessibility.length > 0 && (
                      <div className="negocio-accessibility-section">
                        <p className="accessibility-title">
                          <i className="fas fa-universal-access"></i>
                          <span>Accesibilidades ({business.business_accessibility.length})</span>
                        </p>
                        <div className="negocio-accessibility-list">
                          {business.business_accessibility.slice(0, 3).map((acc: any) => (
                            <span 
                              key={acc.accessibility_id} 
                              className="accessibility-badge"
                              title={acc.description}
                            >
                              {acc.accessibility_name}
                            </span>
                          ))}
                          {business.business_accessibility.length > 3 && (
                            <span className="accessibility-badge more-badge">
                              +{business.business_accessibility.length - 3} más
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button
                    className="btn-ver-detalles-negocio"
                    onClick={() => goToDetail(business.business_id)}
                  >
                    <span>Ver Detalles</span>
                    <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
