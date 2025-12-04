import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../config/api';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import './PendingReportsPage.css';

interface ReviewReport {
  report_id: number;
  review_id: number;
  reporter_id: number;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  review?: {
    review_id: number;
    title: string;
    rating: number;
    description: string;
    user?: {
      name: string;
      user_id: number;
    };
  };
  reporter?: {
    name: string;
    user_id: number;
  };
}

export const PendingReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReviewReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Verificar si es admin
  const isAdmin = user?.rolIds?.includes(1);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/reviews');
      return;
    }
    fetchPendingReports();
  }, [page, isAdmin, navigate]);

  const fetchPendingReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get(`/reviews/reports/pending?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setReports(response.data.data);
        setTotal(response.data.pagination.total);
      }
    } catch (error: any) {
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Error al cargar reportes',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId: number, decision: 'accepted' | 'rejected') => {
    const token = localStorage.getItem('token');
    const strikeAction = decision === 'accepted' ? 'with_strike' : 'without_strike';
    
    try {
      await api.post(
        `/reviews/reports/${reportId}/resolve`,
        { 
          decision,
          strike_action: strikeAction,
          admin_notes: `Reporte ${decision} por administrador`
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({
        title: '¡Éxito!',
        text: `Reporte ${decision === 'accepted' ? 'aceptado' : 'rechazado'}`,
        icon: 'success',
        timer: 2000,
      });

      fetchPendingReports();
    } catch (error: any) {
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Error al resolver reporte',
        icon: 'error',
      });
    }
  };

  const handleDeleteReview = async (reportId: number, reviewId: number) => {
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

        Swal.fire({
          title: '¡Eliminado!',
          text: 'Reseña eliminada exitosamente',
          icon: 'success',
          timer: 2000,
        });

        fetchPendingReports();
      } catch (error: any) {
        Swal.fire({
          title: 'Error',
          text: error.response?.data?.message || 'Error al eliminar reseña',
          icon: 'error',
        });
      }
    }
  };

  return (
    <div className="pendingReportsContainer">
      <div className="pendingReportsHeader">
        <button 
          className="pendingReportsBackBtn"
          onClick={() => navigate('/reviews')}
        >
          ← Volver
        </button>
        <h1>📋 Reportes Pendientes de Revisión</h1>
        <p className="pendingReportsCount">Total: {total} reportes</p>
      </div>

      {loading ? (
        <div className="pendingReportsLoading">Cargando reportes...</div>
      ) : reports.length === 0 ? (
        <div className="pendingReportsEmpty">
          <p>✅ No hay reportes pendientes</p>
        </div>
      ) : (
        <div className="pendingReportsList">
          {reports.map((report) => (
            <div key={report.report_id} className="pendingReportCard">
              <div className="reportCardHeader">
                <h3>Reporte #{report.report_id}</h3>
                <span className={`reportStatus ${report.status}`}>
                  {report.status === 'pending' ? 'Pendiente' : 
                   report.status === 'accepted' ? 'Aceptado' : 'Rechazado'}
                </span>
              </div>

              <div className="reportCardContent">
                <div className="reportSection">
                  <h4>Razón del Reporte:</h4>
                  <p>{report.reason}</p>
                </div>

                {report.review && (
                  <div className="reportSection">
                    <h4>Reseña Reportada:</h4>
                    <div className="reviewPreview">
                      <p><strong>Autor:</strong> {report.review.user?.name || 'Desconocido'}</p>
                      <p><strong>Calificación:</strong> {'⭐'.repeat(report.review.rating)}</p>
                      <p><strong>Contenido:</strong> {report.review.description.substring(0, 200)}...</p>
                    </div>
                  </div>
                )}

                <div className="reportSection">
                  <p><strong>Reportado por:</strong> {report.reporter?.name || 'Usuario'}</p>
                  <p><strong>Fecha:</strong> {new Date(report.created_at).toLocaleDateString('es-ES')}</p>
                </div>
              </div>

              {report.status === 'pending' && (
                <div className="reportCardActions">
                  <button
                    className="reportAcceptBtn"
                    onClick={() => handleResolveReport(report.report_id, 'accepted')}
                  >
                    ✅ Aceptar Reporte
                  </button>
                  <button
                    className="reportRejectBtn"
                    onClick={() => handleResolveReport(report.report_id, 'rejected')}
                  >
                    ❌ Rechazar
                  </button>
                  <button
                    className="reportDeleteBtn"
                    onClick={() => handleDeleteReview(report.report_id, report.review_id)}
                  >
                    🗑️ Eliminar Reseña
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      {total > 10 && (
        <div className="pendingReportsPagination">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="paginationBtn"
          >
            ← Anterior
          </button>
          <span className="paginationInfo">
            Página {page} de {Math.ceil(total / 10)}
          </span>
          <button
            disabled={page >= Math.ceil(total / 10)}
            onClick={() => setPage(page + 1)}
            className="paginationBtn"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
};

export default PendingReportsPage;
