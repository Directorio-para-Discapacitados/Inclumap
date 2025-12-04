import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../config/api';
import { toast } from 'react-toastify';
import { LoadingSpinner } from '../../../Components/LoadingSpinner/LoadingSpinner';
import Swal from 'sweetalert2';
import './ReportedReviews.css';

interface User {
  user_id: number;
  name: string;
  lastname?: string;
  avatar?: string;
  offensive_strikes: number;
  is_banned: boolean;
}

interface ReviewReport {
  report_id: number;
  review_id: number;
  reporter_id: number;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  review?: {
    review_id: number;
    comment: string;
    rating: number;
    created_at: string;
    user?: User;
    business?: {
      business_id: number;
      business_name: string;
    };
  };
  reporter?: User;
}

const ReportedReviews: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReviewReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'owners'>('all');
  const [strikeModal, setStrikeModal] = useState<{
    visible: boolean;
    reportId: number | null;
    reviewAuthorName: string;
    currentStrikes: number;
  }>({
    visible: false,
    reportId: null,
    reviewAuthorName: '',
    currentStrikes: 0,
  });

  useEffect(() => {
    fetchReportedReviews();
  }, [page, activeTab]);

  const fetchReportedReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await api.get(`/reviews/reports/pending?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // El backend retorna: { data, total, page, limit, totalPages }
      if (res.data && res.data.data) {
        setReports(res.data.data || []);
        setTotal(res.data.total || 0);
      } else {
        setReports([]);
        setTotal(0);
      }
    } catch (error: any) {

      toast.error('Error al cargar reseñas reportadas');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const resolveReport = async (reportId: number, decision: 'accepted' | 'rejected', strikeAction: 'add_strike' | 'no_strike' = 'no_strike') => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await api.post(
        `/reviews/reports/${reportId}/resolve`,
        { 
          decision,
          strike_action: strikeAction,
          admin_notes: `Reporte ${decision} por administrador`
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Si se aceptó y vino info de strikes, mostrar notificación
      if (response.data?.strike_info) {
        const strikeInfo = response.data.strike_info;
        if (strikeInfo.banned_after_this_strike) {
          toast.error(`⚠️ Usuario bloqueado después de ${strikeInfo.max_strikes} strikes`);
        } else {
          toast.success(`✅ Strike agregado: ${strikeInfo.current_strikes}/${strikeInfo.max_strikes}`);
        }
      } else {
        toast.success(`Reporte ${decision === 'accepted' ? 'aceptado' : 'rechazado'}`);
      }

      // Cerrar modal si estaba abierto
      setStrikeModal({ visible: false, reportId: null, reviewAuthorName: '', currentStrikes: 0 });
      
      // Recargar reportes
      fetchReportedReviews();
    } catch (error: any) {
      toast.error('Error al resolver reporte');

    }
  };

  const deleteReview = async (reportId: number, reviewId: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar reseña?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    });

    if (result.isConfirmed) {
      const token = localStorage.getItem('token');
      try {
        await api.post(
          `/reviews/reports/${reportId}/delete-review`,
          { review_id: reviewId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        toast.success('Reseña eliminada exitosamente');
        fetchReportedReviews();
      } catch (error: any) {
        toast.error('Error al eliminar reseña');
      }
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Filtrar reportes por tipo
  const userReports = reports.filter(r => r.reporter?.user_id !== r.review?.user?.user_id);
  const ownerReports = reports.filter(r => r.reporter?.user_id === r.review?.user?.user_id);
  
  let displayedReports = reports;
  if (activeTab === 'users') displayedReports = userReports;
  if (activeTab === 'owners') displayedReports = ownerReports;

  return (
    <div className="reported-reviews-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Volver
          </button>
          <h1>📋 Reseñas Reportadas</h1>
        </div>
      </div>

      {/* Tabs with History Button */}
      <div className="tabs-container">
        <div className="report-tabs">
          <button 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            📋 Todos <span className="tab-count">({total})</span>
          </button>
          <button 
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👤 Usuarios <span className="tab-count">({userReports.length})</span>
          </button>
          <button 
            className={`tab ${activeTab === 'owners' ? 'active' : ''}`}
            onClick={() => setActiveTab('owners')}
          >
            🏢 Propietarios <span className="tab-count">({ownerReports.length})</span>
          </button>
        </div>
        <button 
          className="history-btn-reported" 
          onClick={() => navigate('/admin/moderation/history')}
        >
          📊 Ver Historial
        </button>
      </div>

      {/* Content */}
      <div className="page-content">
        {displayedReports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h2>No hay reportes pendientes</h2>
            <p>Todos los reportes han sido revisados</p>
          </div>
        ) : (
          <div className="reports-grid">
            {displayedReports.map((report) => {
              // Función para obtener iniciales del nombre
              const getInitials = (firstName?: string, lastName?: string) => {
                const first = firstName?.charAt(0) || '';
                const last = lastName?.charAt(0) || '';
                return (first + last).toUpperCase() || '?';
              };

              const reporterName = report.user?.people 
                ? `${report.user.people.firstName || ''} ${report.user.people.firstLastName || ''}`.trim()
                : 'Usuario Anónimo';
              const reporterInitials = getInitials(report.user?.people?.firstName, report.user?.people?.firstLastName);
              const reporterAvatar = report.user?.people?.avatar_url;

              const reviewAuthorName = report.review?.user?.people
                ? `${report.review.user.people.firstName || ''} ${report.review.user.people.firstLastName || ''}`.trim()
                : 'Usuario Anónimo';
              const reviewAuthorInitials = getInitials(report.review?.user?.people?.firstName, report.review?.user?.people?.firstLastName);
              const reviewAuthorAvatar = report.review?.user?.people?.avatar_url;

              return (
              <div key={report.report_id} className="report-card">
                {/* Reporter Section */}
                <div className="report-section">
                  <h3 className="section-title">👤 Reportado Por</h3>
                  <div className="section-content">
                    {reporterAvatar ? (
                      <img 
                        src={reporterAvatar} 
                        alt={reporterName}
                        className="avatar"
                      />
                    ) : (
                      <div className="avatar avatar-initials">
                        {reporterInitials}
                      </div>
                    )}
                    <div className="user-info">
                      <div className="user-name">
                        {reporterName}
                      </div>
                      <div className="user-status">
                        {report.user?.is_banned ? '🚫 Bloqueado' : '✓ Activo'}
                      </div>
                    </div>
                  </div>
                  <div className="reason-box">
                    <strong>Razón:</strong>
                    <p>{report.reason}</p>
                  </div>
                </div>

                <hr className="divider" />

                {/* Review Section */}
                {report.review && (
                  <div className="report-section">
                    <h3 className="section-title">📝 Reseña Reportada</h3>
                    <div className="section-content">
                      {reviewAuthorAvatar ? (
                        <img 
                          src={reviewAuthorAvatar} 
                          alt={reviewAuthorName}
                          className="avatar"
                        />
                      ) : (
                        <div className="avatar avatar-initials">
                          {reviewAuthorInitials}
                        </div>
                      )}
                      <div className="user-info">
                        <div className="user-name">
                          {reviewAuthorName}
                        </div>
                        <div className="business-name">
                          🏢 {report.review.business?.business_name}
                        </div>
                      </div>
                    </div>
                    <div className="rating-section">
                      {'⭐'.repeat(report.review.rating)}
                    </div>
                    <div className="review-text">
                      {report.review.comment}
                    </div>
                    <div className="review-date">
                      {new Date(report.review.created_at).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {report.status === 'pending' && (
                  <div className="report-actions">
                    <button
                      className="action-btn accept"
                      onClick={() => {
                        setStrikeModal({
                          visible: true,
                          reportId: report.report_id,
                          reviewAuthorName: reviewAuthorName,
                          currentStrikes: report.review?.user?.offensive_strikes || 0,
                        });
                      }}
                    >
                      ✅ Aceptar
                    </button>
                    <button
                      className="action-btn reject"
                      onClick={() => resolveReport(report.report_id, 'rejected')}
                    >
                      ❌ Rechazar
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => deleteReview(report.report_id, report.review_id)}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 10 && (
        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="pagination-btn"
          >
            ← Anterior
          </button>
          <span className="page-info">Página {page} de {Math.ceil(total / 10)}</span>
          <button
            disabled={page >= Math.ceil(total / 10)}
            onClick={() => setPage(page + 1)}
            className="pagination-btn"
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* Strike Modal */}
      {strikeModal.visible && (
        <div className="strike-modal-overlay">
          <div className="strike-modal">
            <div className="modal-header">
              <h2>⚠️ Decisión de Strike</h2>
              <button 
                className="close-btn"
                onClick={() => setStrikeModal({ visible: false, reportId: null, reviewAuthorName: '', currentStrikes: 0 })}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-text">
                Al aceptar este reporte, ¿deseas agregar un strike al usuario <strong>{strikeModal.reviewAuthorName}</strong>?
              </p>
              
              <div className="strike-info-box">
                <div className="strike-stat">
                  <span className="label">Strikes actuales:</span>
                  <span className="value">{strikeModal.currentStrikes}/3</span>
                </div>
                <div className="strike-stat">
                  <span className="label">Después de este reporte:</span>
                  <span className="value">{strikeModal.currentStrikes + 1}/3</span>
                </div>
                {strikeModal.currentStrikes + 1 >= 3 && (
                  <div className="warning-box">
                    ⚠️ El usuario será <strong>bloqueado permanentemente</strong> después de este strike
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="modal-btn cancel"
                onClick={() => {
                  setStrikeModal({ visible: false, reportId: null, reviewAuthorName: '', currentStrikes: 0 });
                  resolveReport(strikeModal.reportId!, 'accepted', 'no_strike');
                }}
              >
                ❌ Sin Strike (Solo eliminar reseña)
              </button>
              <button
                className="modal-btn confirm"
                onClick={() => {
                  resolveReport(strikeModal.reportId!, 'accepted', 'add_strike');
                }}
              >
                ⚠️ Agregar Strike y Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportedReviews;
