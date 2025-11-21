import React, { useEffect, useState } from "react";
import { Star, StarHalf } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { setOwnerReply } from "../../pages/reviews/reviewService";

interface RecentReviewsProps {
  reviews: Array<{
    review_id: number;
    rating: number;
    comment: string;
    sentiment_label: string;
    created_at: Date;
    owner_reply?: string | null;
    user: {
      firstName: string;
      firstLastName: string;
    };
  }>;
  businessId: number;
}

export default function RecentReviews({ reviews, businessId }: RecentReviewsProps) {
  const navigate = useNavigate();
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [savingReplies, setSavingReplies] = useState<number[]>([]);
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);

  useEffect(() => {
    const drafts: Record<number, string> = {};
    (reviews || []).forEach((r) => {
      drafts[r.review_id] = r.owner_reply || "";
    });
    setReplyDrafts(drafts);
    setEditingReplyId(null);
  }, [reviews]);

  const handleOwnerReplyChange = (reviewId: number, value: string) => {
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
    } catch (error: any) {
      console.error("Error al guardar respuesta del propietario:", error);
      toast.error(error?.response?.data?.message || "Error al guardar la respuesta", {
        autoClose: 3000,
      });
    } finally {
      setSavingReplies((prev) => prev.filter((id) => id !== reviewId));
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
      toast.success("Respuesta eliminada", { autoClose: 2500 });
    } catch (error: any) {
      console.error("Error al eliminar la respuesta del propietario:", error);
      toast.error(error?.response?.data?.message || "Error al eliminar la respuesta", {
        autoClose: 3000,
      });
    } finally {
      setSavingReplies((prev) => prev.filter((id) => id !== reviewId));
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
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  return (
    <div className="dashboard-card recent-reviews">
      <div className="card-header">
        <h3 className="card-title">💬 Reseñas Recientes</h3>
        <button
          className="view-all-btn"
          onClick={() => navigate(`/local/${businessId}`)}
        >
          Ver todas →
        </button>
      </div>

      {reviews.length === 0 ? (
        <div className="empty-state">
          <p>No hay reseñas aún</p>
          <small>Las reseñas de tus clientes aparecerán aquí</small>
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <div key={review.review_id} className="review-item">
              <div className="review-header">
                <div className="review-user">
                  <div className="user-avatar">
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

              {(() => {
                const currentReply =
                  replyDrafts[review.review_id] ?? review.owner_reply ?? "";
                const isEditing = editingReplyId === review.review_id;

                if (currentReply && !isEditing) {
                  return (
                    <div className="owner-reply-inline">
                      <label className="owner-reply-inline-label">Tu respuesta</label>
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
