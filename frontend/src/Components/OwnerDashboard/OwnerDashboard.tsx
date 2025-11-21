import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getBusinessStatistics, BusinessStatistics } from "../../services/ownerStatistics";
import { api } from "../../config/api";
import { RefreshCw } from "lucide-react";
import MetricsGrid from "./MetricsGrid";
import RatingDistribution from "./RatingDistribution";
import VisitsChart from "./VisitsChart";
import SentimentAnalysis from "./SentimentAnalysis";
import RecentReviews from "./RecentReviews";
import AccessibilityScore from "./AccessibilityScore";
import QuickActions from "./QuickActions";
import "./OwnerDashboard.css";

export default function OwnerDashboard() {
  const { user } = useAuth() || {};
  const [statistics, setStatistics] = useState<BusinessStatistics | null>(null);
  const [businessId, setBusinessId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [businessImages, setBusinessImages] = useState<{ id: number; url: string }[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinessAndStatistics = async () => {
      if (!user?.user_id) return;

      try {
        setLoading(true);
        
        // Obtener el negocio del propietario (asociación usuario-negocio)
        const response = await api.get(`/user/${user.user_id}/business`);
        const business = response.data;

        if (!business?.business_id) {
          setError("No tienes un negocio asignado");
          setLoading(false);
          return;
        }

        setBusinessId(business.business_id);

        // Intentar obtener imágenes directamente del negocio; si no vienen, consultar detalle del negocio
        let images: { id: number; url: string }[] = Array.isArray(business.images)
          ? business.images
          : [];

        let name: string | null = business.business_name || user.displayName || null;

        if ((!images || images.length === 0) && business.business_id) {
          try {
            const businessDetailResp = await api.get(`/business/${business.business_id}`);
            const businessDetail = businessDetailResp.data;

            if (Array.isArray(businessDetail.images)) {
              images = businessDetail.images;
            }

            if (businessDetail.business_name) {
              name = businessDetail.business_name;
            }
          } catch (detailError) {
            console.error("Error al cargar detalles del negocio para imágenes:", detailError);
          }
        }

        setBusinessName(name);
        setBusinessImages(images || []);

        // Obtener estadísticas
        const stats = await getBusinessStatistics(business.business_id);
        setStatistics(stats);
        setError(null);
      } catch (err: any) {
        console.error("Error al cargar estadísticas:", err);
        setError(err.response?.data?.message || "Error al cargar las estadísticas");
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessAndStatistics();
  }, [user?.user_id]);

  const handleOpenImage = (url: string) => {
    setSelectedImage(url);
  };

  const handleCloseImage = () => {
    setSelectedImage(null);
  };

  const handleRefresh = async () => {
    if (!businessId || refreshing) return;
    
    try {
      setRefreshing(true);
      const stats = await getBusinessStatistics(businessId);
      setStatistics(stats);
    } catch (err: any) {
      console.error('Error al refrescar:', err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="owner-dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando tu dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="owner-dashboard-error">
        <div className="error-icon">⚠️</div>
        <h3>No se pudieron cargar las estadísticas</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!statistics || !businessId) {
    return null;
  }

  return (
    <div className="owner-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>
            👋 Bienvenido, <span className="business-name">{user?.displayName}</span>
          </h1>
          <div className="header-actions">
            <button 
              className={`refresh-button ${refreshing ? 'spinning' : ''}`}
              onClick={handleRefresh}
              disabled={refreshing}
              title="Actualizar estadísticas"
            >
              <RefreshCw size={20} />
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
            <div className="verification-badge">
              {user?.verified ? (
                <span className="badge verified">✅ Verificado</span>
              ) : (
                <span className="badge pending">⚠️ Pendiente de verificación</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <MetricsGrid 
        statistics={statistics} 
        businessImages={businessImages}
        businessName={businessName}
        onImageClick={handleOpenImage}
      />

      <div className="dashboard-grid">
        <div className="dashboard-column-main">
          <RatingDistribution distribution={statistics.rating.distribution} />
          <VisitsChart views={statistics.views} />
          <SentimentAnalysis sentiment={statistics.reviews.sentiment} />
          <RecentReviews reviews={statistics.recentReviews} businessId={businessId} />

          {businessImages.length > 0 && (
            <div className="dashboard-card owner-photos-card">
              <h3 className="card-title">Galería de tu local</h3>
              <div className="owner-photos-grid">
                {businessImages.map((img) => (
                  <div key={img.id} className="owner-photo-item">
                    <img
                      src={img.url}
                      alt={businessName || "Foto del local"}
                      onClick={() => handleOpenImage(img.url)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="dashboard-column-sidebar">
          <AccessibilityScore accessibility={statistics.accessibility} />
          <QuickActions businessId={businessId} />
        </div>
      </div>

      {selectedImage && (
        <div className="image-modal-overlay" onClick={handleCloseImage}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt={businessName || "Foto del local"} />
            <button
              type="button"
              className="image-modal-close"
              onClick={handleCloseImage}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
