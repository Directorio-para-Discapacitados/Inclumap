import React from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Image, MessageCircle, BarChart } from "lucide-react";

interface QuickActionsProps {
  businessId: number;
}

export default function QuickActions({ businessId }: QuickActionsProps) {
  const navigate = useNavigate();

  const actions = [
    {
      icon: <Edit size={20} />,
      label: "Editar Negocio",
      description: "Actualiza tu información",
      onClick: () => navigate("/perfil"),
      color: "action-blue",
    },
    {
      icon: <Image size={20} />,
      label: "Gestionar Fotos",
      description: "Agrega o elimina imágenes",
      onClick: () => navigate("/perfil"),
      color: "action-purple",
    },
    {
      icon: <MessageCircle size={20} />,
      label: "Ver Reseñas",
      description: "Revisa los comentarios",
      onClick: () => navigate(`/local/${businessId}`),
      color: "action-green",
    },
    {
      icon: <BarChart size={20} />,
      label: "Ver Detalle",
      description: "Página completa del negocio",
      onClick: () => navigate(`/local/${businessId}`),
      color: "action-orange",
    },
  ];

  return (
    <div className="dashboard-card quick-actions">
      <h3 className="card-title">🚀 Acciones Rápidas</h3>
      <div className="actions-list">
        {actions.map((action, index) => (
          <button
            key={index}
            className={`action-button ${action.color}`}
            onClick={action.onClick}
          >
            <div className="action-icon">{action.icon}</div>
            <div className="action-content">
              <div className="action-label">{action.label}</div>
              <div className="action-description">{action.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
