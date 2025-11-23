import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../config/api";
import { recordBusinessView } from "../../services/ownerStatistics";
import { useAuth } from "../../context/AuthContext";
import {
  MapPin,
  Star,
  Building2,
  Eye,
  ArrowLeft,
  Search,
} from "lucide-react";
import "./BrowseBusinesses.css";

interface Business {
  business_id: number;
  business_name: string;
  address?: string;
  average_rating?: number | string;
  logo_url?: string;
  description?: string;
  business_categories?: { category_name: string }[];
}

export default function BrowseBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadBusinesses();
  }, [user?.business_id]); // Ejecutar cuando cambie el business_id

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredBusinesses(businesses);
    } else {
      const filtered = businesses.filter(
        (business) =>
          business.business_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          business.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          business.business_categories?.some((cat) =>
            cat.category_name.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
      setFilteredBusinesses(filtered);
    }
  }, [searchTerm, businesses]);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      const response = await api.get("/business/public/all");
      
      console.log('=== DEBUG FILTRO DE NEGOCIOS ===');
      console.log('Usuario actual completo:', JSON.stringify(user, null, 2));
      console.log('business_id del usuario:', user?.business_id, '(tipo:', typeof user?.business_id, ')');
      console.log('Total negocios recibidos del backend:', response.data.length);
      
      // Filtrar el negocio del propietario actual si existe
      let allBusinesses = response.data;
      
      // Mostrar todos los negocios recibidos
      console.log('📋 TODOS los negocios recibidos:');
      allBusinesses.forEach((b: Business, idx: number) => {
        console.log(`  ${idx + 1}. ID: ${b.business_id} (tipo: ${typeof b.business_id}) - ${b.business_name}`);
      });
      
      if (user?.business_id) {
        const userBusinessId = Number(user.business_id);
        console.log('\n🔍 Iniciando filtro...');
        console.log('   Buscando excluir negocio con ID:', userBusinessId);
        
        const originalCount = allBusinesses.length;
        allBusinesses = allBusinesses.filter((b: Business) => {
          const businessId = Number(b.business_id);
          const shouldKeep = businessId !== userBusinessId;
          
          if (!shouldKeep) {
            console.log('   ❌ EXCLUIDO:', b.business_name, `(ID: ${b.business_id})`);
          }
          
          return shouldKeep;
        });
        
        console.log(`\n✅ Filtro completado:`);
        console.log(`   - Negocios originales: ${originalCount}`);
        console.log(`   - Negocios después del filtro: ${allBusinesses.length}`);
        console.log(`   - Negocios removidos: ${originalCount - allBusinesses.length}`);
      } else {
        console.log('\n⚠️ NO hay business_id en el usuario');
        console.log('   Razón: Usuario no es propietario o aún no se ha cargado');
        console.log('   Mostrando TODOS los negocios');
      }
      console.log('=================================\n');
      
      setBusinesses(allBusinesses);
      setFilteredBusinesses(allBusinesses);
    } catch (error) {
      console.error("❌ Error cargando negocios:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessClick = async (businessId: number) => {
    // Registrar la visita antes de navegar
    await recordBusinessView(businessId);
    navigate(`/local/${businessId}`);
  };

  const renderStars = (rating?: number | string) => {
    const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
    
    if (!numRating || isNaN(numRating)) {
      return <span className="no-rating">Sin calificación</span>;
    }

    const stars = [];
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={16} fill="currentColor" />);
    }
    if (hasHalfStar) {
      stars.push(<Star key="half" size={16} fill="currentColor" opacity={0.5} />);
    }
    const emptyStars = 5 - Math.ceil(numRating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={16} />);
    }

    return (
      <div className="stars-container">
        <div className="stars">{stars}</div>
        <span className="rating-number">{numRating.toFixed(1)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="browse-businesses-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando negocios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-businesses-container">
      <div className="browse-header">
        <button className="browse-back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          Volver
        </button>
        <h1>
          <Building2 size={28} />
          Explorar Negocios
        </h1>
        <p className="browse-subtitle">
          Descubre otros negocios en la plataforma
        </p>
      </div>

      <div className="search-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, dirección o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="results-count">
          {filteredBusinesses.length}{" "}
          {filteredBusinesses.length === 1 ? "negocio encontrado" : "negocios encontrados"}
        </div>
      </div>

      <div className="businesses-grid">
        {filteredBusinesses.length === 0 ? (
          <div className="no-results">
            <Building2 size={64} opacity={0.3} />
            <p>No se encontraron negocios</p>
          </div>
        ) : (
          filteredBusinesses.map((business) => (
            <div
              key={business.business_id}
              className="business-card"
              onClick={() => handleBusinessClick(business.business_id)}
            >
              <div className="browse-card-header">
                {business.logo_url ? (
                  <img
                    src={business.logo_url}
                    alt={business.business_name}
                    className="browse-card-logo"
                  />
                ) : (
                  <div className="browse-logo-placeholder">
                    <Building2 size={32} />
                  </div>
                )}
              </div>

              <div className="browse-card-body">
                <h3 className="browse-business-name">{business.business_name}</h3>

                {business.address && (
                  <div className="browse-business-info">
                    <MapPin size={16} />
                    <span>{business.address}</span>
                  </div>
                )}

                <div className="browse-rating">
                  {renderStars(business.average_rating)}
                </div>

                {business.business_categories &&
                  business.business_categories.length > 0 && (
                    <div className="browse-categories">
                      {business.business_categories.slice(0, 3).map((cat, idx) => (
                        <span key={idx} className="browse-category-tag">
                          {cat.category_name}
                        </span>
                      ))}
                    </div>
                  )}

                {business.description && (
                  <p className="browse-description">
                    {business.description.length > 100
                      ? `${business.description.substring(0, 100)}...`
                      : business.description}
                  </p>
                )}

                <button className="view-button">
                  <Eye size={16} />
                  Ver Detalles
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
