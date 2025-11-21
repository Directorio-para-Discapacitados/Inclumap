import React from "react";
import { Star, StarHalf } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RecentReviewsProps {
  reviews: Array<{
    review_id: number;
    rating: number;
    comment: string;
    sentiment_label: string;
    created_at: Date;
    user: {
      firstName: string;
      firstLastName: string;
    };
  }>;
  businessId: number;
}

export default function RecentReviews({ reviews, businessId }: RecentReviewsProps) {
  const navigate = useNavigate();

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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
