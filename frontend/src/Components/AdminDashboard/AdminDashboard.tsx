import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const managementModules = [
    {
      title: 'Usuarios',
      icon: '👤',
      route: '/admin/gestion-usuarios',
      description: 'Administra usuarios del sistema',
      color: '#8B5CF6'
    },
    {
      title: 'Negocios',
      icon: '🏪',
      route: '/admin/gestion-negocios',
      description: 'Gestiona negocios registrados',
      color: '#EC4899'
    },
    {
      title: 'Reseñas',
      icon: '⭐',
      route: '/reviews',
      description: 'Análisis de sentimiento e incoherencias',
      color: '#F59E0B'
    },
    {
      title: 'Categorías',
      icon: '🏷️',
      route: '/admin/gestion-categorias',
      description: 'Administra categorías',
      color: '#10B981'
    }
  ];

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-header">
        <h1 className="dashboard-title">Panel de Administración</h1>
        <p className="dashboard-subtitle">Gestiona todos los módulos del sistema</p>
      </div>

      <div className="dashboard-grid">
        {managementModules.map((module, index) => (
          <div
            key={index}
            className="dashboard-card"
            onClick={() => navigate(module.route)}
            style={{ '--card-color': module.color } as React.CSSProperties}
          >
            <div className="card-header">
              <div className="card-icon-circle">
                <span className="card-icon-large">{module.icon}</span>
              </div>
            </div>
            <div className="card-body">
              <h3 className="card-title">{module.title}</h3>
              <p className="card-description">{module.description}</p>
            </div>
            <div className="card-footer">
              <span className="card-action">Ver detalles →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
