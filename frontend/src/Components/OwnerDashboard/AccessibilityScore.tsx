import React from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import "./AccessibilityScore.css";

interface AccessibilityScoreProps {
  accessibility: {
    score: number;
    total: number;
    completed: number;
    missing: string[];
    completedItems: string[];
  };
}

export default function AccessibilityScore({ accessibility }: AccessibilityScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "score-excellent";
    if (score >= 60) return "score-good";
    if (score >= 40) return "score-average";
    return "score-poor";
  };

  const getScoreLabel = (score: number) => {
    if (score === 100) return "¡Perfecto!";
    if (score >= 80) return "Excelente";
    if (score >= 60) return "Bueno";
    if (score >= 40) return "Regular";
    return "Necesita mejorar";
  };

  return (
    <div className="dashboard-card accessibility-score">
      <h3 className="card-title">♿ Score de Accesibilidad</h3>

      <div className="score-display">
        <div className={`score-circle ${getScoreColor(accessibility.score)}`}>
          <svg viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              stroke="var(--score-bg)"
              strokeWidth="20"
            />
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              stroke="currentColor"
              strokeWidth="20"
              strokeDasharray="534"
              strokeDashoffset={534 - (534 * accessibility.score) / 100}
              transform="rotate(-90 100 100)"
              strokeLinecap="round"
            />
          </svg>
          <div className="score-content">
            <div className="score-number">{accessibility.score}%</div>
            <div className="score-label">{getScoreLabel(accessibility.score)}</div>
          </div>
        </div>
      </div>

      <div className="score-info">
        <p className="score-summary">
          {accessibility.completed} de {accessibility.total} características completadas
        </p>
      </div>

      {accessibility.completedItems && accessibility.completedItems.length > 0 && (
        <div className="completed-items">
          <h4 className="completed-title">
            <CheckCircle size={16} />
            Accesibilidades que tienes:
          </h4>
          <ul className="completed-list">
            {accessibility.completedItems.map((item, index) => (
              <li key={index}>✅ {item}</li>
            ))}
          </ul>
        </div>
      )}

      {accessibility.missing.length > 0 && (
        <div className="missing-items">
          <h4 className="missing-title">
            <AlertCircle size={16} />
            Te faltan:
          </h4>
          <ul className="missing-list">
            {accessibility.missing.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {accessibility.score === 100 && (
        <div className="perfect-score">
          <CheckCircle size={20} />
          <p>¡Tu negocio es 100% accesible!</p>
        </div>
      )}

      {accessibility.score < 100 && (
        <div className="score-tip">
          💡 Completa las características faltantes para destacar en las búsquedas
        </div>
      )}
    </div>
  );
}
