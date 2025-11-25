import React, { useEffect, useState } from "react";
import { Eye, Star, MessageCircle, Image } from "lucide-react";
import { BusinessStatistics } from "../../services/ownerStatistics";
import "./MetricsGrid.css";

interface MetricsGridProps {
  statistics: BusinessStatistics;
  businessImages?: { id: number; url: string }[];
  businessName?: string | null;
  onImageClick?: (url: string) => void;
}

export default function MetricsGrid({ statistics, businessImages = [], businessName, onImageClick }: MetricsGridProps) {
  const [animatedViews, setAnimatedViews] = useState(0);
  const [animatedRating, setAnimatedRating] = useState(0);
  const [animatedReviews, setAnimatedReviews] = useState(0);
  const [animatedPhotos, setAnimatedPhotos] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const interval = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setAnimatedViews(Math.floor(statistics.views.total * progress));
      setAnimatedRating(+(statistics.rating.current * progress).toFixed(1));
      setAnimatedReviews(Math.floor(statistics.reviews.total * progress));
      setAnimatedPhotos(Math.floor(statistics.photos.count * progress));

      if (currentStep >= steps) {
        setAnimatedViews(statistics.views.total);
        setAnimatedRating(statistics.rating.current);
        setAnimatedReviews(statistics.reviews.total);
        setAnimatedPhotos(statistics.photos.count);
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [statistics]);

  const formatTrend = (trend: number) => {
    if (trend > 0) return `+${trend}%`;
    if (trend < 0) return `${trend}%`;
    return "Sin cambios";
  };

  const getTrendClass = (trend: number) => {
    if (trend > 0) return "trend-up";
    if (trend < 0) return "trend-down";
    return "trend-neutral";
  };

  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <div className="metric-icon views">
          <Eye size={24} />
        </div>
        <div className="metric-content">
          <div className="metric-value">{animatedViews.toLocaleString()}</div>
          <div className="metric-label">Visitas Totales</div>
          <div className={`metric-trend ${getTrendClass(statistics.views.trend)}`}>
            {formatTrend(statistics.views.trend)} vs. semana anterior
          </div>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon rating">
          <Star size={24} />
        </div>
        <div className="metric-content">
          <div className="metric-value">
            {animatedRating.toFixed(1)} ⭐
          </div>
          <div className="metric-label">Calificación Promedio</div>
          <div className="metric-info">
            {statistics.rating.current > statistics.rating.previous ? (
              <span className="trend-up">↑ Mejorando</span>
            ) : statistics.rating.current < statistics.rating.previous ? (
              <span className="trend-down">↓ Bajando</span>
            ) : (
              <span className="trend-neutral">→ Estable</span>
            )}
          </div>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon reviews">
          <MessageCircle size={24} />
        </div>
        <div className="metric-content">
          <div className="metric-value">{animatedReviews}</div>
          <div className="metric-label">Reseñas Totales</div>
          <div className="metric-info">
            {statistics.reviews.newThisWeek > 0 && (
              <span className="new-badge">+{statistics.reviews.newThisWeek} nuevas</span>
            )}
          </div>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon photos">
          <Image size={24} />
        </div>
        <div className="metric-content">
          <div className="metric-value">{animatedPhotos}</div>
          <div className="metric-label">Fotos Subidas</div>
          <div className="metric-info">
            {statistics.photos.hasLogo ? (
              <span className="status-ok">✓ Con logo</span>
            ) : (
              <span className="status-warning">⚠ Sin logo</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
