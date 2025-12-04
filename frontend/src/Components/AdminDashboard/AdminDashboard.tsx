import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AdminDashboard.css';
import { api } from '../../config/api';

interface DashboardStats {
  totalUsers: number;
  totalBusinesses: number;
  totalReviews: number;
  offensiveReviews: number;
  unverifiedBusinesses: number;
  incoherentReviews: number;
  reportedReviews: number;
}

type ViewMode = 'overview' | 'users' | 'businesses' | 'moderation';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBusinesses: 0,
    totalReviews: 0,
    offensiveReviews: 0,
    unverifiedBusinesses: 0,
    incoherentReviews: 0,
    reportedReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Recargar estadísticas cada vez que el usuario vuelve a este componente
  useEffect(() => {
    fetchDashboardStats();
  }, [location.pathname]);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Obtener estadísticas en paralelo
      const [usersRes, businessesRes, reviewsRes, reportedRes] = await Promise.all([
        api.get('/user', { headers }),
        api.get('/business', { headers }),
        api.get('/reviews', { headers }),
        api.get('/reviews/reports/pending?page=1&limit=1', { headers }).catch(() => ({ data: { total: 0 } })),
      ]);

      const users = usersRes.data || [];
      const businesses = businessesRes.data || [];
      const reviews = reviewsRes.data || [];
      const reportedCount = reportedRes.data?.total || 0;

      const offensiveCount = reviews.filter((r: any) => r.is_offensive && !r.is_reviewed_by_admin).length;
      const unverifiedCount = businesses.filter((b: any) => !b.logo_url).length; // Sin verificar = sin logo
      const incoherentCount = reviews.filter((r: any) => 
        r.coherence_check?.startsWith('Incoherente') && !r.is_reviewed_by_admin
      ).length;








      setStats({
        totalUsers: users.length,
        totalBusinesses: businesses.length,
        totalReviews: reviews.length,
        offensiveReviews: offensiveCount,
        unverifiedBusinesses: unverifiedCount,
        incoherentReviews: incoherentCount,
        reportedReviews: reportedCount,
      });
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const alerts = React.useMemo(() => [
    {
      title: 'Contenido Ofensivo',
      count: stats.offensiveReviews,
      icon: '🚨',
      color: '#EF4444',
      route: '/admin/moderation/offensive',
      description: 'Reseñas con lenguaje ofensivo'
    },
    {
      title: 'Reseñas Incoherentes',
      count: stats.incoherentReviews,
      icon: '⚠️',
      color: '#F59E0B',
      route: '/admin/moderation/offensive',
      description: 'Requieren revisión manual'
    },
    {
      title: 'Reseñas Reportadas',
      count: stats.reportedReviews,
      icon: '📢',
      color: '#EC4899',
      route: '/admin/moderation/reported',
      description: 'Reportadas por usuarios'
    },
    {
      title: 'Negocios Sin Verificar',
      count: stats.unverifiedBusinesses,
      icon: '🔍',
      color: '#3B82F6',
      route: '/admin/gestion-negocios?filter=unverified',
      description: 'Pendientes de verificación'
    }
  ], [stats]);

  // Calcular si hay alertas
  const hasAlerts = React.useMemo(() => 
    alerts.some(alert => alert.count > 0),
    [alerts]
  );

  const quickActions = [
    {
      title: 'Verificar Negocios',
      icon: '✓',
      color: '#10B981',
      count: stats.unverifiedBusinesses,
      action: () => navigate('/admin/gestion-negocios?filter=unverified')
    },
    {
      title: 'Moderación de Contenido',
      icon: '🛡️',
      color: '#EF4444',
      count: stats.offensiveReviews + stats.incoherentReviews,
      action: () => navigate('/admin/moderation/offensive')
    },
    {
      title: 'Reseñas Reportadas',
      icon: '📢',
      color: '#3B82F6',
      count: stats.reportedReviews,
      action: () => navigate('/admin/moderation/reported')
    },
    {
      title: 'Gestionar Usuarios',
      icon: '👥',
      color: '#8B5CF6',
      count: stats.totalUsers,
      action: () => navigate('/admin/gestion-usuarios')
    }
  ];

  const tabs: { id: ViewMode; label: string; icon: string }[] = [
    { id: 'overview', label: 'Vista General', icon: '📊' },
    { id: 'users', label: 'Usuarios', icon: '👥' },
    { id: 'businesses', label: 'Negocios', icon: '🏪' },
    { id: 'moderation', label: 'Moderación', icon: '🚨' }
  ];



  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-header">
        <div className="header-top">
          <div className="header-title-section">
            <h1 className="dashboard-title">Panel de Administración</h1>
            <p className="dashboard-subtitle">Centro de control unificado</p>
          </div>
        </div>

        <div className="dashboard-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${viewMode === tab.id ? 'active' : ''}`}
              onClick={() => setViewMode(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'overview' && (
        <>
          {/* Acciones Rápidas */}
          <div className="quick-actions-section">
            <h2 className="section-title">⚡ Acciones Rápidas</h2>
            <div className="quick-actions-grid">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className="quick-action-btn"
                  onClick={action.action}
                  style={{ '--action-color': action.color } as React.CSSProperties}
                >
                  <div className="action-icon">{action.icon}</div>
                  <div className="action-content">
                    <div className="action-count">{action.count}</div>
                    <div className="action-title">{action.title}</div>
                  </div>
                  <div className="action-arrow">→</div>
                </button>
              ))}
            </div>
          </div>

          {/* Alertas y notificaciones */}
          {!loading && hasAlerts && (
            <div className="dashboard-alerts">
              <h2 className="alerts-title">🔔 Alertas Prioritarias</h2>
              <div className="alerts-grid">
                {alerts.map((alert, index) => (
                  alert.count > 0 && (
                    <div
                      key={index}
                      className="alert-card"
                      onClick={() => navigate(alert.route)}
                      style={{ '--alert-color': alert.color } as React.CSSProperties}
                    >
                      <div className="alert-icon">{alert.icon}</div>
                      <div className="alert-content">
                        <div className="alert-count">{alert.count}</div>
                        <div className="alert-title">{alert.title}</div>
                        <div className="alert-description">{alert.description}</div>
                      </div>
                      <div className="alert-action">Ver →</div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {viewMode === 'users' && (
        <div className="tab-content">
          <div className="tab-content-header">
            <h2>👥 Gestión de Usuarios</h2>
          </div>
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-label">Total Usuarios</div>
            </div>
          </div>
          <button className="action-button" onClick={() => navigate('/admin/gestion-usuarios')}>
            Ver Lista Completa →
          </button>
        </div>
      )}

      {viewMode === 'businesses' && (
        <div className="tab-content">
          <div className="tab-content-header">
            <h2>🏪 Gestión de Negocios</h2>
          </div>
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-value">{stats.totalBusinesses}</div>
              <div className="stat-label">Total Negocios</div>
            </div>
            <div className="stat-card alert-stat">
              <div className="stat-value">{stats.unverifiedBusinesses}</div>
              <div className="stat-label">Sin Verificar</div>
            </div>
          </div>
          <button className="action-button" onClick={() => navigate('/admin/gestion-negocios')}>
            Ver Lista Completa →
          </button>
        </div>
      )}

      {viewMode === 'moderation' && (
        <div className="tab-content">
          <div className="tab-content-header">
            <h2>🚨 Centro de Moderación</h2>
          </div>
          <div className="stats-cards">
            <div className="stat-card alert-stat">
              <div className="stat-value">{stats.offensiveReviews}</div>
              <div className="stat-label">Contenido Ofensivo</div>
            </div>
            <div className="stat-card warning-stat">
              <div className="stat-value">{stats.incoherentReviews}</div>
              <div className="stat-label">Reseñas Incoherentes</div>
            </div>
          </div>
          <div className="moderation-actions">
            <button className="action-button danger" onClick={() => navigate('/admin/moderation/offensive')}>
              🚨 Ver Reseñas Reportadas
            </button>
            <button className="action-button warning" onClick={() => navigate('/reviews?filter=incoherent')}>
              ⚠️ Revisar Incoherencias
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
