import React from "react";
import { Smile, Meh, Frown } from "lucide-react";
import "./SentimentAnalysis.css";

interface SentimentAnalysisProps {
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export default function SentimentAnalysis({ sentiment }: SentimentAnalysisProps) {
  const total = sentiment.positive + sentiment.neutral + sentiment.negative;

  const getPercentage = (count: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const positivePercent = getPercentage(sentiment.positive);
  const neutralPercent = getPercentage(sentiment.neutral);
  const negativePercent = getPercentage(sentiment.negative);

  // Calcular el circumference del círculo (2 * PI * r = 2 * 3.14159 * 80 ≈ 502.65)
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  
  // Calcular los valores para strokeDasharray y strokeDashoffset
  const positiveLength = (sentiment.positive / total) * circumference;
  const neutralLength = (sentiment.neutral / total) * circumference;
  const negativeLength = (sentiment.negative / total) * circumference;

  return (
    <div className="dashboard-card sentiment-analysis">
      <h3 className="card-title">🎭 Análisis de Sentimiento</h3>
      <div className="sentiment-content">
        <div className="sentiment-chart">
          <svg viewBox="0 0 200 200" className="donut-chart">
            {/* Segmento Positivo */}
            {sentiment.positive > 0 && (
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="var(--color-positive)"
                strokeWidth="40"
                strokeDasharray={`${positiveLength} ${circumference}`}
                strokeDashoffset="0"
                transform="rotate(-90 100 100)"
              />
            )}
            {/* Segmento Neutral */}
            {sentiment.neutral > 0 && (
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="var(--color-neutral)"
                strokeWidth="40"
                strokeDasharray={`${neutralLength} ${circumference}`}
                strokeDashoffset={`-${positiveLength}`}
                transform="rotate(-90 100 100)"
              />
            )}
            {/* Segmento Negativo */}
            {sentiment.negative > 0 && (
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="var(--color-negative)"
                strokeWidth="40"
                strokeDasharray={`${negativeLength} ${circumference}`}
                strokeDashoffset={`-${positiveLength + neutralLength}`}
                transform="rotate(-90 100 100)"
              />
            )}
          </svg>
        </div>

        <div className="sentiment-legend">
          <div className="legend-item positive">
            <Smile size={20} />
            <div className="legend-content">
              <span className="legend-label">Positivas</span>
              <span className="legend-value">{sentiment.positive} ({positivePercent}%)</span>
            </div>
          </div>
          <div className="legend-item neutral">
            <Meh size={20} />
            <div className="legend-content">
              <span className="legend-label">Neutrales</span>
              <span className="legend-value">{sentiment.neutral} ({neutralPercent}%)</span>
            </div>
          </div>
          <div className="legend-item negative">
            <Frown size={20} />
            <div className="legend-content">
              <span className="legend-label">Negativas</span>
              <span className="legend-value">{sentiment.negative} ({negativePercent}%)</span>
            </div>
          </div>
        </div>
      </div>
      {total === 0 && (
        <div className="empty-state">
          <p>No hay datos de sentimiento aún</p>
        </div>
      )}
    </div>
  );
}
