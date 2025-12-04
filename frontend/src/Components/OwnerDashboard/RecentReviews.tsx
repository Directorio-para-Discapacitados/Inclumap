import React, { useEffect, useState, useMemo } from "react";
import { Star, StarHalf, Filter, ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { setOwnerReply } from "../../pages/reviews/reviewService";
import { api } from "../../config/api";
import "./RecentReviews.css";

type FilterType = 'all' | 'unanswered' | 'good' | 'bad';
type SortOrder = 'newest' | 'oldest' | 'highest' | 'lowest';

interface RecentReviewsProps {
  reviews: Array<{
    review_id: number;
    rating: number;
    comment: string;
    sentiment_label: string;
    created_at: Date;
    owner_reply?: string | null;
    review_reported_by_owner?: boolean;
    user: {
      firstName: string;
      firstLastName: string;
      avatar?: string | null;
    };
  }>;
  businessId: number;
  businessLogo?: string | null;
  limit?: number;
  showViewAllButton?: boolean;
  onReplyUpdated?: () => void;
}

export default function RecentReviews({ reviews, businessId, businessLogo, limit, showViewAllButton = true, onReplyUpdated }: RecentReviewsProps) {
  const navigate = useNavigate();
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [savingReplies, setSavingReplies] = useState<number[]>([]);
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [likesData, setLikesData] = useState<Record<number, { count: number; liked: boolean }>>({});
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [isInitialized, setIsInitialized] = useState(false);

  // Filtrar y ordenar reseñas
  const filteredAndSortedReviews = useMemo(() => {
    let filtered = [...(reviews || [])];

    // Aplicar filtro
    switch (filterType) {
      case 'unanswered':
        filtered = filtered.filter(r => !r.owner_reply || r.owner_reply.trim() === '');
        break;
      case 'good':
        filtered = filtered.filter(r => r.rating >= 4);
        break;
      case 'bad':
        filtered = filtered.filter(r => r.rating <= 2);
        break;
      default:
        break;
    }

    // Aplicar ordenamiento
    switch (sortOrder) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'highest':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        filtered.sort((a, b) => a.rating - b.rating);
        break;
    }

    return filtered;
  }, [reviews, filterType, sortOrder]);

  const displayedReviews = (limit && limit > 0 ? filteredAndSortedReviews.slice(0, limit) : filteredAndSortedReviews) || [];

  // Initialize drafts only once when reviews first load
  useEffect(() => {
    if (!reviews || reviews.length === 0) return;
    
    // Solo inicializar si no hay edición o guardado en progreso
    if (editingReplyId === null && savingReplies.length === 0) {
      const drafts: Record<number, string> = {};
      reviews.forEach((r) => {
        // Solo agregar si no existe ya en replyDrafts
        if (!(r.review_id in replyDrafts)) {
          drafts[r.review_id] = r.owner_reply || "";
        } else {
          // Mantener el draft actual
          drafts[r.review_id] = replyDrafts[r.review_id];
        }
      });
      
      // Solo actualizar si hay cambios reales
      const hasChanges = reviews.some(r => 
        !(r.review_id in replyDrafts) || 
        (replyDrafts[r.review_id] === "" && r.owner_reply && r.owner_reply.trim() !== "")
      );
      
      if (hasChanges) {
        setReplyDrafts(drafts);
      }
    }
    
    // Cargar datos de likes
    if (reviews && reviews.length > 0) {
      loadLikesData(reviews);
    }
  }, [reviews, editingReplyId, savingReplies]);

  const loadLikesData = async (reviewList: typeof reviews) => {
    const token = localStorage.getItem("token");
    
    const likesPromises = reviewList.map(async (r) => {
      try {
        // Obtener el contador de likes
        const countRes = await api.get(`/reviews/${r.review_id}/likes-count`);
        
        // Si el usuario está logueado, verificar si dio like
        let liked = false;
        if (token) {
          try {
            const likedRes = await api.get(`/reviews/${r.review_id}/user-liked`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            liked = likedRes.data.liked;
          } catch (err) {

          }
        }
        
        return {
          id: r.review_id,
          count: countRes.data.count,
          liked
        };
      } catch (err) {

        return {
          id: r.review_id,
          count: 0,
          liked: false
        };
      }
    });

    const likesArray = await Promise.all(likesPromises);
    const likesMap = likesArray.reduce((acc, item) => {
      acc[item.id] = { count: item.count, liked: item.liked };
      return acc;
    }, {} as Record<number, { count: number; liked: boolean }>);

    setLikesData(likesMap);
  };

  const toggleLike = async (reviewId: number) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Debes iniciar sesión para dar like a las reseñas", { autoClose: 3000 });
      return;
    }

    try {
      const res = await api.post(`/reviews/${reviewId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Actualizar el estado local
      setLikesData(prev => ({
        ...prev,
        [reviewId]: {
          count: res.data.count,
          liked: res.data.liked
        }
      }));
    } catch (err: any) {

      toast.error("Error al procesar el like", { autoClose: 3000 });
    }
  };

  const handleOwnerReplyChange = (reviewId: number, value: string) => {
    // Marcar que estamos editando esta reseña
    if (editingReplyId !== reviewId) {
      setEditingReplyId(reviewId);
    }
    
    setReplyDrafts((prev) => ({
      ...prev,
      [reviewId]: value,
    }));
  };

  const handleSaveOwnerReply = async (reviewId: number) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No hay sesión activa", { autoClose: 3000 });
      return;
    }

    const reply = replyDrafts[reviewId] ?? "";

    try {
      setSavingReplies((prev) => [...prev, reviewId]);
      await setOwnerReply(reviewId, reply, token);
      setReplyDrafts((prev) => ({
        ...prev,
        [reviewId]: reply,
      }));
      setEditingReplyId((prev) => (prev === reviewId ? null : prev));
      toast.success("Respuesta guardada", { autoClose: 2500 });
      
      // Notificar al componente padre para recargar datos
      if (onReplyUpdated) {
        onReplyUpdated();
      }
    } catch (error: any) {

      toast.error(error?.response?.data?.message || "Error al guardar la respuesta", {
        autoClose: 3000,
      });
    } finally {
      setSavingReplies((prev) => prev.filter((id) => id !== reviewId));
      // Limpiar editingReplyId después de finalizar guardado
      setEditingReplyId((prev) => (prev === reviewId ? null : prev));
    }
  };

  const handleClearOwnerReply = async (reviewId: number) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No hay sesión activa", { autoClose: 3000 });
      return;
    }

    try {
      setSavingReplies((prev) => [...prev, reviewId]);
      await setOwnerReply(reviewId, "", token);
      setReplyDrafts((prev) => ({
        ...prev,
        [reviewId]: "",
      }));
      setEditingReplyId((prev) => (prev === reviewId ? null : prev));
      toast.success("Respuesta eliminada", { autoClose: 2500 });
      
      // Notificar al componente padre para recargar datos
      if (onReplyUpdated) {
        onReplyUpdated();
      }
    } catch (error: any) {

      toast.error(error?.response?.data?.message || "Error al eliminar la respuesta", {
        autoClose: 3000,
      });
    } finally {
      setSavingReplies((prev) => prev.filter((id) => id !== reviewId));
      // Limpiar editingReplyId después de finalizar eliminación
      setEditingReplyId((prev) => (prev === reviewId ? null : prev));
    }
  };

  const handleReportReview = async (reviewId: number) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No hay sesión activa", { autoClose: 3000 });
      return;
    }

    // Primero pedir confirmación
    const result = await Swal.fire({
      title: '¿Reportar esta reseña?',
      text: 'La reseña será revisada por un administrador. Esta acción no se puede deshacer.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, reportar',
      cancelButtonText: 'Cancelar',
      background: 'var(--color-background)',
      color: 'var(--color-text)',
    });

    if (!result.isConfirmed) return;

    // Luego pedir la razón
    const reasonResult = await Swal.fire({
      title: 'Razón del reporte',
      text: 'Por favor, explica por qué estás reportando esta reseña',
      input: 'textarea',
      inputPlaceholder: 'Describe la razón del reporte (mínimo 10 caracteres)',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Reportar',
      cancelButtonText: 'Cancelar',
      background: 'var(--color-background)',
      color: 'var(--color-text)',
      inputValidator: (value) => {
        if (!value) {
          return 'La razón es requerida';
        }
        if (value.length < 10) {
          return 'La razón debe tener al menos 10 caracteres';
        }
        if (value.length > 500) {
          return 'La razón no puede exceder 500 caracteres';
        }
        return null;
      }
    });

    if (!reasonResult.isConfirmed || !reasonResult.value) return;

    try {
      await api.post('/reviews/reports', {
        review_id: reviewId,
        reason: reasonResult.value
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await Swal.fire({
        title: '¡Reporte enviado!',
        text: 'La reseña está en revisión. Un administrador la evaluará pronto.',
        icon: 'success',
        background: 'var(--color-background)',
        color: 'var(--color-text)',
        timer: 3000,
        showConfirmButton: false
      });
      
      // Notificar al componente padre para recargar datos
      if (onReplyUpdated) {
        onReplyUpdated();
      }
    } catch (error: any) {

      const message = error?.response?.data?.message || "Error al reportar la reseña";
      Swal.fire({
        title: 'Error',
        text: message,
        icon: 'error',
        background: 'var(--color-background)',
        color: 'var(--color-text)',
      });
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} size={14} className="star-filled" />);
    }
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" size={14} className="star-filled" />);
    }
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={14} className="star-empty" />);
    }
    return stars;
  };

  const getSentimentClass = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes("positiv")) return "sentiment-positive";
    if (lower.includes("negativ")) return "sentiment-negative";
    return "sentiment-neutral";
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  return (
    <div className="dashboard-card recent-reviews">
      <div className="card-header">
        <h3 className="card-title">💬 Reseñas Recientes</h3>
        {showViewAllButton && reviews.length > 0 && (
          <button
            className="view-all-btn"
            onClick={() => navigate("/owner/reviews")}
          >
            Ver todas →
          </button>
        )}
      </div>

      {/* Filtros y Ordenamiento - Solo en página de todas las reseñas */}
      {!showViewAllButton && reviews.length > 0 && (
        <div className="reviews-filters">
          <div className="filter-group">
            <Filter size={16} />
            <span className="filter-label">Filtrar:</span>
            <button
              className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              Todas ({reviews.length})
            </button>
            <button
              className={`filter-btn ${filterType === 'unanswered' ? 'active' : ''}`}
              onClick={() => setFilterType('unanswered')}
            >
              Sin responder ({reviews.filter(r => !r.owner_reply || r.owner_reply.trim() === '').length})
            </button>
            <button
              className={`filter-btn ${filterType === 'good' ? 'active' : ''}`}
              onClick={() => setFilterType('good')}
            >
              Buenas 4-5 ⭐ ({reviews.filter(r => r.rating >= 4).length})
            </button>
            <button
              className={`filter-btn ${filterType === 'bad' ? 'active' : ''}`}
              onClick={() => setFilterType('bad')}
            >
              Malas 1-2 ⭐ ({reviews.filter(r => r.rating <= 2).length})
            </button>
          </div>

          <div className="sort-group">
            <ArrowUpDown size={16} />
            <span className="filter-label">Ordenar:</span>
            <select
              className="sort-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            >
              <option value="newest">Más recientes</option>
              <option value="oldest">Más antiguas</option>
              <option value="highest">Mayor calificación</option>
              <option value="lowest">Menor calificación</option>
            </select>
          </div>
        </div>
      )}

      {displayedReviews.length === 0 ? (
        <div className="empty-state">
          {reviews.length === 0 ? (
            <>
              <p>No hay reseñas aún</p>
              <small>Las reseñas de tus clientes aparecerán aquí</small>
            </>
          ) : (
            <>
              <p>No hay reseñas con este filtro</p>
              <small>Intenta cambiar los criterios de búsqueda</small>
              <button
                className="filter-btn"
                onClick={() => {
                  setFilterType('all');
                  setSortOrder('newest');
                }}
                style={{ marginTop: '1rem' }}
              >
                Limpiar filtros
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="reviews-list">
          {displayedReviews.map((review) => (
            <div key={review.review_id} className="review-item">
              <div className="review-header">
                <div className="review-user">
                  {review.user.avatar ? (
                    <img 
                      src={review.user.avatar} 
                      alt={`${review.user.firstName} ${review.user.firstLastName}`}
                      className="user-avatar-img"
                      onError={(e) => {
                        // Si la imagen falla al cargar, mostrar iniciales
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLDivElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="user-avatar" style={{ display: review.user.avatar ? 'none' : 'flex' }}>
                    {review.user.firstName.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <span className="user-name">
                      {review.user.firstName} {review.user.firstLastName}
                    </span>
                    <span className="review-date">{formatDate(review.created_at)}</span>
                  </div>
                </div>
                <div className="review-rating">
                  {renderStars(review.rating)}
                </div>
              </div>
              <p className="review-comment">{review.comment}</p>
              <div className={`review-sentiment ${getSentimentClass(review.sentiment_label)}`}>
                {review.sentiment_label}
              </div>

              {/* Botón para reportar reseña */}
              {!review.review_reported_by_owner ? (
                <button
                  className="report-review-btn-owner"
                  onClick={() => handleReportReview(review.review_id)}
                  title="Reportar reseña inapropiada"
                >
                  🚩 Reportar reseña
                </button>
              ) : (
                <span className="review-reported-badge-owner" title="Reseña reportada en revisión">
                  ⏳ Reseña en revisión
                </span>
              )}

              {/* Sección de Likes */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(0,0,0,0.08)'
              }}>
                <button
                  onClick={() => toggleLike(review.review_id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                  title={likesData[review.review_id]?.liked ? "Quitar like" : "Dar like"}
                >
                  {likesData[review.review_id]?.liked ? "💛" : "🤍"}
                </button>
                <span style={{ 
                  fontSize: '0.9rem', 
                  color: '#64748b',
                  fontWeight: 500 
                }}>
                  {likesData[review.review_id]?.count || 0}
                </span>
              </div>

              {(() => {
                const currentReply =
                  replyDrafts[review.review_id] ?? review.owner_reply ?? "";
                const isEditing = editingReplyId === review.review_id;

                if (currentReply && !isEditing) {
                  return (
                    <div className="owner-reply-inline">
                      <div className="owner-reply-header">
                        {businessLogo ? (
                          <img 
                            src={businessLogo} 
                            alt="Logo del negocio"
                            className="business-logo-avatar"
                            onClick={() => navigate(`/business/${businessId}`)}
                            style={{ cursor: 'pointer' }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLDivElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="business-logo-fallback"
                          style={{ display: businessLogo ? 'none' : 'flex', cursor: 'pointer' }}
                          onClick={() => navigate(`/business/${businessId}`)}
                        >
                          🏪
                        </div>
                        <label className="owner-reply-inline-label">Respuesta del negocio</label>
                      </div>
                      <p className="owner-reply-inline-status">
                        Esta reseña ya tiene una respuesta.
                      </p>
                      <p className="owner-reply-inline-text">{currentReply}</p>
                      <div className="owner-reply-inline-actions">
                        <button
                          type="button"
                          className="owner-reply-inline-btn primary"
                          onClick={() => setEditingReplyId(review.review_id)}
                          disabled={savingReplies.includes(review.review_id)}
                        >
                          Editar respuesta
                        </button>
                        <button
                          type="button"
                          className="owner-reply-inline-btn secondary"
                          onClick={() => handleClearOwnerReply(review.review_id)}
                          disabled={savingReplies.includes(review.review_id)}
                        >
                          Eliminar respuesta
                        </button>
                      </div>
                    </div>
                  );
                }

                // Modo creación o edición
                return (
                  <div className="owner-reply-inline">
                    <label className="owner-reply-inline-label">Tu respuesta</label>
                    {currentReply && (
                      <p className="owner-reply-inline-status">
                        Edita tu respuesta y vuelve a guardarla.
                      </p>
                    )}
                    <textarea
                      className="owner-reply-inline-textarea"
                      rows={2}
                      value={replyDrafts[review.review_id] ?? currentReply}
                      onChange={(e) =>
                        handleOwnerReplyChange(review.review_id, e.target.value)
                      }
                      onKeyDown={(e) => {
                        // Prevenir que Enter envíe el formulario
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                        }
                      }}
                      placeholder="Escribe aquí tu respuesta para esta reseña"
                    />
                    <div className="owner-reply-inline-actions">
                      <button
                        type="button"
                        className="owner-reply-inline-btn primary"
                        onClick={() => handleSaveOwnerReply(review.review_id)}
                        disabled={savingReplies.includes(review.review_id)}
                      >
                        {savingReplies.includes(review.review_id)
                          ? "Guardando..."
                          : "Guardar respuesta"}
                      </button>
                      {currentReply && (
                        <button
                          type="button"
                          className="owner-reply-inline-btn secondary"
                          onClick={() => {
                            setEditingReplyId(null);
                            setReplyDrafts((prev) => ({
                              ...prev,
                              [review.review_id]: currentReply,
                            }));
                          }}
                          disabled={savingReplies.includes(review.review_id)}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
