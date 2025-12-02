import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../config/api';
import { toast } from 'react-toastify';
import { LoadingSpinner } from '../../../Components/LoadingSpinner/LoadingSpinner';
import Swal from 'sweetalert2';
import './OffensiveContent.css';

interface OffensiveReview {
  review_id: number;
  comment: string;
  rating: number;
  created_at: string;
  reason?: 'offensive' | 'incoherent'; // Nuevo campo para distinguir tipo
  coherence_check?: string;
  user: {
    user_id: number;
    name: string;
    lastname: string;
    avatar?: string;
    offensive_strikes: number;
    is_banned: boolean;
  };
  business: {
    business_id: number;
    business_name: string;
  };
}

const OffensiveContent: React.FC = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<OffensiveReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffensiveReviews();
  }, []);

  const fetchOffensiveReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/reviews/moderation/offensive', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('📋 Reseñas para moderación:', res.data);
      setReviews(res.data || []);
    } catch (error: any) {
      console.error('Error cargando reseñas:', error);
      toast.error('Error al cargar reseñas para moderación');
    } finally {
      setLoading(false);
    }
  };

  const markAsReviewed = async (reviewId: number) => {
    try {
      const token = localStorage.getItem('token');
      await api.patch(`/reviews/moderation/${reviewId}/reviewed`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Reseña marcada como revisada');
      fetchOffensiveReviews(); // Recargar lista
    } catch (error: any) {
      toast.error('Error al marcar reseña como revisada');
    }
  };

  const deleteReview = async (reviewId: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar reseña?',
      text: 'Esta acción no se puede deshacer. La reseña será eliminada permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await Swal.fire({
        title: '¡Eliminada!',
        text: 'La reseña ha sido eliminada exitosamente.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      
      fetchOffensiveReviews(); // Recargar lista
    } catch (error: any) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo eliminar la reseña. Por favor, intenta nuevamente.',
        icon: 'error',
        confirmButtonColor: '#667eea'
      });
    }
  };

  const viewUserStrikes = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/reviews/moderation/user/${userId}/strikes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = res.data;
      toast.info(
        `Usuario ID: ${data.user_id}\nStrikes: ${data.strikes}/2\nEstado: ${data.status}`,
        { autoClose: 5000 }
      );
    } catch (error: any) {
      toast.error('Error al obtener información del usuario');
    }
  };

  const reportUser = async (userId: number, userName: string) => {
    if (!window.confirm(`¿Reportar a ${userName}? Esto incrementará sus strikes y le enviará una notificación de advertencia.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await api.post(`/reviews/moderation/user/${userId}/report`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`✅ ${res.data.message}. Strikes actuales: ${res.data.strikes}`, { autoClose: 4000 });
      fetchOffensiveReviews(); // Recargar para actualizar strikes
    } catch (error: any) {
      toast.error(`❌ Error: ${error.response?.data?.message || error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="offensive-content-page">
        <LoadingSpinner message="Cargando reseñas para moderación..." />
      </div>
    );
  }

  return (
    <div className="offensive-content-page">
      <div className="offensive-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Volver
        </button>
        <h1 className="page-title">🛡️ Moderación de Contenido</h1>
        <p className="page-subtitle">
          Reseñas ofensivas e incoherentes que requieren revisión
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h2>No hay reseñas pendientes de moderación</h2>
          <p>Todas las reseñas ofensivas e incoherentes han sido revisadas</p>
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <div key={review.review_id} className="offensive-review-card">
              <div className="review-header">
                <div className="review-info">
                  <div className="user-info">
                    <div className="user-profile">
                      {review.user.avatar ? (
                        <img 
                          src={review.user.avatar} 
                          alt={`${review.user.name} ${review.user.lastname}`}
                          className="user-avatar"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const initials = document.createElement('div');
                            initials.className = 'user-avatar-initials';
                            initials.textContent = `${review.user.name?.charAt(0) || ''}${review.user.lastname?.charAt(0) || ''}`.toUpperCase();
                            target.parentElement?.appendChild(initials);
                          }}
                        />
                      ) : (
                        <div className="user-avatar-initials">
                          {`${review.user.name?.charAt(0) || ''}${review.user.lastname?.charAt(0) || ''}`.toUpperCase()}
                        </div>
                      )}
                      <div className="user-details">
                        <span className="user-name">
                          {review.user.name} {review.user.lastname}
                        </span>
                        <span className="user-id-badge">ID: {review.user.user_id}</span>
                      </div>
                    </div>
                    {/* Badge de tipo de problema */}
                    <span className={`reason-badge ${review.reason === 'offensive' ? 'offensive' : 'incoherent'}`}>
                      {review.reason === 'offensive' ? '🚨 OFENSIVA' : '⚠️ INCOHERENTE'}
                    </span>
                    {/* Badge de strikes - visible para todos */}
                    <span className={`strikes-badge ${review.user.offensive_strikes >= 2 ? 'critical' : review.user.offensive_strikes >= 1 ? 'warning' : 'normal'}`}>
                      ⚠️ {review.user.offensive_strikes}/3 strikes
                    </span>
                    {review.user.is_banned && (
                      <span className="banned-badge">🚫 BLOQUEADO</span>
                    )}
                  </div>
                  <div className="business-info">
                    <span className="business-label">Negocio:</span>
                    <span 
                      className="business-name"
                      onClick={() => navigate(`/local/${review.business.business_id}`)}
                    >
                      {review.business.business_name}
                    </span>
                  </div>
                </div>
                <div className="review-meta">
                  <div className="rating">
                    {'⭐'.repeat(review.rating)}
                  </div>
                  <div className="date">
                    {new Date(review.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="review-content">
                <div className="content-label">
                  {review.reason === 'offensive' ? '💬 Comentario ofensivo:' : '💬 Comentario incoherente:'}
                </div>
                <div className="comment-text">{review.comment}</div>
                {review.reason === 'incoherent' && review.coherence_check && (
                  <div className="coherence-info">
                    <strong>Análisis:</strong> {review.coherence_check}
                  </div>
                )}
              </div>

              <div className="review-actions">
                {/* Botón de reportar - solo si no está bloqueado */}
                {!review.user.is_banned && (
                  <button
                    className="action-btn report-btn"
                    onClick={() => reportUser(review.user.user_id, `${review.user.name} ${review.user.lastname}`)}
                  >
                    🚨 Reportar Usuario (+1 Strike)
                  </button>
                )}
                {review.reason === 'offensive' && (
                  <button
                    className="action-btn info-btn"
                    onClick={() => viewUserStrikes(review.user.user_id)}
                  >
                    📊 Ver Historial
                  </button>
                )}
                <button
                  className="action-btn primary-btn"
                  onClick={() => markAsReviewed(review.review_id)}
                >
                  ✓ Marcar como Revisada
                </button>
                <button
                  className="action-btn danger-btn"
                  onClick={() => deleteReview(review.review_id)}
                >
                  🗑️ Eliminar Reseña
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OffensiveContent;
