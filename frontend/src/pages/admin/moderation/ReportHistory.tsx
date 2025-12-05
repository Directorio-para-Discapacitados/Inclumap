import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../config/api';
import { toast } from 'react-toastify';
import { LoadingSpinner } from '../../../Components/LoadingSpinner/LoadingSpinner';
import './ReportHistory.css';

interface User {
  user_id: number;
  name: string;
  lastname: string;
  avatar?: string;
}

interface HistoryRecord {
  history_id: number;
  review_id: number;
  report_type: string;
  decision: 'accepted' | 'rejected';
  action_taken: string;
  created_at: string;
  business_name: string;
  content_snapshot: string;
  report_reason: string;
  admin_notes?: string;
  admin: User;
  reported_user: User;
  reporter_user?: User;
}

interface Statistics {
  total: number;
  accepted: number;
  rejected: number;
  acceptanceRate: string;
}

const ReportHistory: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'accepted' | 'rejected'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchHistory();
    fetchStatistics();
  }, [filter, page]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = '/reviews/moderation/history';
      if (filter !== 'all') {
        url = `/reviews/moderation/history/${filter}`;
      }
      
      const res = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: 20 }
      });
      
      setHistory(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (error: any) {

      toast.error('Error al cargar el historial de reportes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/reviews/moderation/statistics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatistics(res.data);
    } catch (error: any) {

    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDecisionIcon = (decision: string) => {
    return decision === 'accepted' ? '✓' : '✕';
  };

  const getDecisionColor = (decision: string) => {
    return decision === 'accepted' ? 'accepted' : 'rejected';
  };

  if (loading && history.length === 0) {
    return (
      <div className="page-container">
        <LoadingSpinner message="Cargando historial..." />
      </div>
    );
  }

  return (
    <div className="report-history-container">
      {/* Header */}
      <div className="history-header-section">
        <div className="history-header-content">
          <button 
            className="history-back-button"
            onClick={() => navigate(-1)}
          >
            <span>←</span> Volver
          </button>
          <h1 className="history-page-title">Historial de Reportes</h1>
        </div>
      </div>

      {/* Stats Cards */}
      {statistics && (
        <div className="history-stats-grid">
          <div className="history-stat-card">
            <div className="stat-icon total">📊</div>
            <div className="stat-content">
              <p className="stat-label">Total de Reportes</p>
              <p className="stat-value">{statistics.total}</p>
            </div>
          </div>
          <div className="history-stat-card">
            <div className="stat-icon accepted">✓</div>
            <div className="stat-content">
              <p className="stat-label">Aceptados</p>
              <p className="stat-value">{statistics.accepted}</p>
            </div>
          </div>
          <div className="history-stat-card">
            <div className="stat-icon rejected">✕</div>
            <div className="stat-content">
              <p className="stat-label">Rechazados</p>
              <p className="stat-value">{statistics.rejected}</p>
            </div>
          </div>
          <div className="history-stat-card">
            <div className="stat-icon rate">%</div>
            <div className="stat-content">
              <p className="stat-label">Tasa de Aceptación</p>
              <p className="stat-value">{statistics.acceptanceRate}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="history-filter-bar">
        <button
          className={`history-filter-button ${filter === 'all' ? 'active' : ''}`}
          onClick={() => { setFilter('all'); setPage(1); }}
        >
          Todos
        </button>
        <button
          className={`history-filter-button ${filter === 'accepted' ? 'active' : ''}`}
          onClick={() => { setFilter('accepted'); setPage(1); }}
        >
          Aceptados
        </button>
        <button
          className={`history-filter-button ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => { setFilter('rejected'); setPage(1); }}
        >
          Rechazados
        </button>
      </div>

      {/* History List */}
      <div className="history-records-container">
        {history.length === 0 ? (
          <div className="history-empty-state">
            <p className="empty-state-icon">📋</p>
            <p className="empty-state-text">No hay registros en el historial</p>
          </div>
        ) : (
          <div className="history-records-list">
            {history.map((record) => (
              <div key={record.history_id} className={`history-record ${getDecisionColor(record.decision)}`}>
                <div className="record-decision-badge">
                  <span className="badge-icon">{getDecisionIcon(record.decision)}</span>
                  <span className="badge-text">{record.decision === 'accepted' ? 'Aceptado' : 'Rechazado'}</span>
                </div>
                
                <div className="record-main-content">
                  <div className="record-header-info">
                    <h3 className="record-business">{record.business_name}</h3>
                    <span className="record-date">{formatDate(record.created_at)}</span>
                  </div>
                  
                  <div className="record-details-grid">
                    {record.reported_user && (
                      <div className="detail-item">
                        <p className="detail-label">Usuario Reportado</p>
                        <p className="detail-value">{record.reported_user.name} {record.reported_user.lastname}</p>
                      </div>
                    )}
                    {record.reporter_user && (
                      <div className="detail-item">
                        <p className="detail-label">Reportado Por</p>
                        <p className="detail-value">{record.reporter_user.name} {record.reporter_user.lastname}</p>
                      </div>
                    )}
                    <div className="detail-item">
                      <p className="detail-label">Tipo de Reporte</p>
                      <p className="detail-value">{record.report_type}</p>
                    </div>
                    <div className="detail-item">
                      <p className="detail-label">Acción Tomada</p>
                      <p className="detail-value">{record.action_taken}</p>
                    </div>
                  </div>

                  {record.report_reason && (
                    <div className="record-reason">
                      <p className="reason-label">Razón del Reporte</p>
                      <p className="reason-text">{record.report_reason}</p>
                    </div>
                  )}

                  {record.admin_notes && (
                    <div className="record-notes">
                      <p className="notes-label">Notas del Admin</p>
                      <p className="notes-text">{record.admin_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="history-pagination">
          <button
            className="pagination-button"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            ← Anterior
          </button>
          <span className="pagination-info">Página {page} de {totalPages}</span>
          <button
            className="pagination-button"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportHistory;
