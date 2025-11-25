import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../config/api";
import RecentReviews from "../../Components/OwnerDashboard/RecentReviews";
import { getBusinessStatistics, BusinessStatistics } from "../../services/ownerStatistics";
import { Heart, ArrowLeft, MessageCircle, TrendingUp, ThumbsUp } from "lucide-react";
import "./OwnerBusinessReviewsPage.css";

export default function OwnerBusinessReviewsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [businessId, setBusinessId] = useState<number | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [businessLogo, setBusinessLogo] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<BusinessStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalLikes, setTotalLikes] = useState<number>(0);

  const loadStatistics = async () => {
    if (!user?.user_id) {
      setError("No hay sesión activa");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Obtener el negocio asociado al propietario
      const businessResp = await api.get(`/user/${user.user_id}/business`);
      const business = businessResp.data;

      if (!business?.business_id) {
        setError("No tienes un negocio asignado");
        setLoading(false);
        return;
      }

      setBusinessId(business.business_id);
      setBusinessName(business.business_name || null);
      setBusinessLogo(business.logo_url || null);

      // Reutilizar las estadísticas para obtener el listado de reseñas del negocio
      const stats = await getBusinessStatistics(business.business_id);
      setStatistics(stats);

      // Obtener el total de likes de todas las reseñas
      if (stats.recentReviews && stats.recentReviews.length > 0) {
        const likesPromises = stats.recentReviews.map(async (review) => {
          try {
            const res = await api.get(`/reviews/${review.review_id}/likes-count`);
            return res.data.count || 0;
          } catch {
            return 0;
          }
        });
        const likesArray = await Promise.all(likesPromises);
        const total = likesArray.reduce((sum, count) => sum + count, 0);
        setTotalLikes(total);
      }

      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al cargar las reseñas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [user?.user_id]);

  if (loading) {
    return (
      <div className="owner-reviews-page">
        <div className="owner-reviews-loading">
          <div className="loading-spinner"></div>
          <p>Cargando reseñas...</p>
        </div>
      </div>
    );
  }

  if (error || !businessId || !statistics) {
    return (
      <div className="owner-reviews-page">
        <div className="owner-reviews-error">
          <button
            type="button"
            className="back-button"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={18} />
            <span>Volver al panel</span>
          </button>
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <p>{error || "No se pudieron cargar las reseñas"}</p>
          </div>
        </div>
      </div>
    );
  }

  const totalReviews = statistics.recentReviews?.length || 0;
  
  // Calcular sentimiento basado en las reseñas reales
  const sentimentCounts = statistics.recentReviews?.reduce((acc, review) => {
    const sentiment = review.sentiment_label?.toLowerCase() || "";
    if (sentiment.includes("positiv")) acc.positive++;
    else if (sentiment.includes("negativ")) acc.negative++;
    else acc.neutral++;
    return acc;
  }, { positive: 0, negative: 0, neutral: 0 }) || { positive: 0, negative: 0, neutral: 0 };

  const dominantSentiment = 
    sentimentCounts.positive >= sentimentCounts.negative && sentimentCounts.positive >= sentimentCounts.neutral
      ? "Positivo"
      : sentimentCounts.negative > sentimentCounts.neutral
      ? "Negativo"
      : "Neutral";

  // Calcular porcentaje de respuestas del propietario
  const reviewsWithReply = statistics.recentReviews?.filter(r => r.owner_reply && r.owner_reply.trim().length > 0).length || 0;
  const responseRate = totalReviews > 0 ? Math.round((reviewsWithReply / totalReviews) * 100) : 0;

  return (
    <div className="owner-reviews-page">
      <div className="owner-reviews-container">
        {/* Header with Back Button */}
        <div className="reviews-header">
          <button
            type="button"
            className="back-button-top"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={20} />
            <span>Volver</span>
          </button>

          <div className="header-text">
            <h1 className="page-title">📝 Todas las Reseñas</h1>
            <p className="page-subtitle">{businessName}</p>
          </div>
        </div>

        {/* Statistics Summary */}
        <div className="stats-summary">
          <div className="stat-item">
            <div className="stat-icon-small">
              <MessageCircle size={20} />
            </div>
            <div>
              <p className="stat-number">{totalReviews}</p>
              <p className="stat-text">Reseñas</p>
            </div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-icon-small">
              <Heart size={20} />
            </div>
            <div>
              <p className="stat-number">{totalLikes}</p>
              <p className="stat-text">Likes</p>
            </div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-icon-small">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="stat-number">{dominantSentiment}</p>
              <p className="stat-text">Sentimiento</p>
            </div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-icon-small">
              <ThumbsUp size={20} />
            </div>
            <div>
              <p className="stat-number">{responseRate}%</p>
              <p className="stat-text">Respondidas</p>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="reviews-section">
          <RecentReviews
            reviews={statistics.recentReviews}
            businessId={businessId}
            businessLogo={businessLogo}
            showViewAllButton={false}
            onReplyUpdated={loadStatistics}
          />
        </div>
      </div>
    </div>
  );
}
