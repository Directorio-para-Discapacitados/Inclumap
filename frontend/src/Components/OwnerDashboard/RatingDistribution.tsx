import React from "react";
import { Star, StarHalf } from "lucide-react";

interface RatingDistributionProps {
  distribution: {
    five: number;
    four: number;
    three: number;
    two: number;
    one: number;
  };
}

export default function RatingDistribution({ distribution }: RatingDistributionProps) {
  const total = distribution.five + distribution.four + distribution.three + distribution.two + distribution.one;

  const getPercentage = (count: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const bars = [
    { stars: 5, count: distribution.five, color: "#22c55e" },
    { stars: 4, count: distribution.four, color: "#84cc16" },
    { stars: 3, count: distribution.three, color: "#eab308" },
    { stars: 2, count: distribution.two, color: "#f97316" },
    { stars: 1, count: distribution.one, color: "#ef4444" },
  ];

  return (
    <div className="dashboard-card rating-distribution">
      <h3 className="card-title">📊 Distribución de Calificaciones</h3>
      <div className="distribution-content">
        {bars.map((bar) => {
          const percentage = getPercentage(bar.count);
          return (
            <div key={bar.stars} className="distribution-row">
              <div className="stars-label">
                {bar.stars}
                <Star size={14} className="star-icon" />
              </div>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: bar.color,
                  }}
                />
              </div>
              <div className="count-label">
                {bar.count} ({percentage}%)
              </div>
            </div>
          );
        })}
      </div>
      {total === 0 && (
        <div className="empty-state">
          <p>Aún no tienes reseñas</p>
        </div>
      )}
    </div>
  );
}
