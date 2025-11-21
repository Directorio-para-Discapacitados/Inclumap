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

  useEffect(() => {
    const fetchBusinessAndStatistics = async () => {
      if (!user?.user_id) return;

      try {
        setLoading(true);
        
        // Obtener el negocio del propietario
        const response = await api.get(`/user/${user.user_id}/business`);
        const business = response.data;

        if (!business?.business_id) {
          setError("No tienes un negocio asignado");
          setLoading(false);
          return;
        }

        setBusinessId(business.business_id);

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

      <MetricsGrid statistics={statistics} />

      <div className="dashboard-grid">
        <div className="dashboard-column-main">
          <RatingDistribution distribution={statistics.rating.distribution} />
          <VisitsChart views={statistics.views} />
          <SentimentAnalysis sentiment={statistics.reviews.sentiment} />
          <RecentReviews reviews={statistics.recentReviews} businessId={businessId} />
        </div>

        <div className="dashboard-column-sidebar">
          <AccessibilityScore accessibility={statistics.accessibility} />
          <QuickActions businessId={businessId} />
        </div>
      </div>
    </div>
  );
}
