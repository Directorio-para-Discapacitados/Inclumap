import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import Swal from 'sweetalert2';
import ConfirmModal from "../../Components/ConfirmModal/ConfirmModal";
import "./reviews.css";

function StarRating({ value }: { value: number }) {
  return (
    <div className="starRating" role="img" aria-label={`Calificación: ${value} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={n <= value ? "star filled" : "star"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [category, setCategory] = useState("all");
  const [rating, setRating] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterIncoherent, setFilterIncoherent] = useState(false);

  // Modal de reanálisis (solo admin)
  const [reanalyzeModalOpen, setReanalyzeModalOpen] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  // Modal de confirmación para corrección
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<{ id: number; stars: number; comment: string } | null>(null);

  // ⭐ LIKES CON API
  const [likesData, setLikesData] = useState<Record<string, { count: number; liked: boolean }>>({});

  // Verificar si el usuario es admin (rolIds incluye 1 = Administrador)
  const isAdmin = user?.rolIds?.includes(1);

  // Detectar parámetro de URL para activar filtro de incoherentes
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'incoherent' && isAdmin) {
      setFilterIncoherent(true);
      toast.info("🔍 Mostrando reseñas incoherentes que requieren revisión", { autoClose: 3000 });
    }
  }, [searchParams, isAdmin]);

  // Cargar datos de likes para todas las reseñas
  const fetchLikesData = async (reviewList: any[]) => {
    const token = localStorage.getItem('token');
    const likesPromises = reviewList.map(async (r) => {
      try {
        // Obtener el contador
        const countRes = await api.get(`/reviews/${r.review_id}/likes-count`);
        
        // Si el usuario está logueado, verificar si dio like
        let liked = false;
        if (token) {
          try {
            const likedRes = await api.get(`/reviews/${r.review_id}/user-liked`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            liked = likedRes.data.liked;
          } catch (err) {
            // Si no está autenticado, simplemente no está likeado
            console.warn('Error verificando like del usuario:', err);
          }
        }
        
        return {
          id: r.review_id,
          count: countRes.data.count,
          liked
        };
      } catch (err) {
        console.error('Error cargando likes para reseña', r.review_id, err);
        return {
          id: r.review_id,
          count: 0,
          liked: false
        };
      }
    });

    const likesArray = await Promise.all(likesPromises);
    const likesMap = likesArray.reduce((acc, item) => {
      acc[item.id] = { count: item.count, liked: item.liked };
      return acc;
    }, {} as Record<string, { count: number; liked: boolean }>);
    
    setLikesData(likesMap);
  };

  const toggleLike = async (reviewId: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Debes iniciar sesión para dar like a las reseñas");
      return;
    }

    try {
      const res = await api.post(`/reviews/${reviewId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Actualizar el estado local
      setLikesData(prev => ({
        ...prev,
        [reviewId]: {
          count: res.data.count,
          liked: res.data.liked
        }
      }));
    } catch (err: any) {
      console.error('Error al dar like:', err);
      toast.error("Error al procesar el like");
    }
  };

  // Función para corregir una reseña incoherente
  const handleCorrectReview = async (reviewId: number, newRating: number) => {
    try {
      await api.patch(`/reviews/${reviewId}`, {
        rating: newRating
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      toast.success("✅ Reseña corregida exitosamente", { autoClose: 3000 });
      fetchReviews(); // Recargar reseñas
    } catch (error: any) {
      toast.error(`❌ Error al corregir la reseña: ${error.response?.data?.message || error.message}`, { autoClose: 3000 });
    }
  };

  // Función para abrir el modal de confirmación
  const openConfirmModal = (reviewId: number, stars: number, comment: string) => {
    setSelectedReview({ id: reviewId, stars, comment });
    setConfirmModalOpen(true);
  };

  // Función para confirmar la corrección
  const confirmCorrection = () => {
    if (selectedReview) {
      handleCorrectReview(selectedReview.id, selectedReview.stars);
      setSelectedReview(null);
    }
  };

  // Sugerencia de calificación basada en el sentimiento
  const getSuggestedRating = (review: any): number | null => {
    if (!review.sentiment_label || !review.coherence_check) return null;
    if (!review.coherence_check.startsWith('Incoherente')) return null;

    const sentiment = review.sentiment_label;
    const currentRating = review.rating;

    // Si tiene comentario positivo pero calificación baja
    if (sentiment === 'Positivo' && currentRating <= 2) {
      return 4; // Sugerir 4 estrellas
    }
    // Si tiene comentario negativo pero calificación alta
    if (sentiment === 'Negativo' && currentRating >= 4) {
      return 2; // Sugerir 2 estrellas
    }

    return null;
  };

  // Función para reanalizar todas las reseñas
  const handleReanalyzeAll = async () => {
    try {
      setReanalyzing(true);
      const token = localStorage.getItem('token');
      const res = await api.post('/reviews/reanalyze-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`✅ ${res.data.message}: ${res.data.analyzed} reseñas analizadas, ${res.data.incoherent_found} incoherentes detectadas`, { autoClose: 5000 });
      fetchReviews(); // Recargar reseñas
    } catch (error: any) {
      toast.error(`❌ Error al reanalizar: ${error.response?.data?.message || error.message}`, { autoClose: 3000 });
    } finally {
      setReanalyzing(false);
      setReanalyzeModalOpen(false);
    }
  };

  // Función para reportar usuario
  const handleReportUser = async (userId: number, userName: string) => {
    if (!window.confirm(`¿Reportar a ${userName}? Esto incrementará sus strikes y le enviará una notificación de advertencia.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await api.post(`/reviews/moderation/user/${userId}/report`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`✅ ${res.data.message}. Strikes: ${res.data.strikes}`, { autoClose: 4000 });
      fetchReviews(); // Recargar para actualizar strikes
    } catch (error: any) {
      toast.error(`❌ Error: ${error.response?.data?.message || error.message}`, { autoClose: 3000 });
    }
  };

  // Función para eliminar reseña (solo admin)
  const handleDeleteReview = async (reviewId: number, businessName: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar reseña?',
      html: `<p>Esta acción eliminará permanentemente la reseña del negocio <strong>${businessName}</strong>.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: 'var(--color-background)',
      color: 'var(--color-text)',
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await api.delete(`/reviews/${reviewId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        await Swal.fire({
          title: '¡Eliminada!',
          text: 'La reseña ha sido eliminada exitosamente.',
          icon: 'success',
          background: 'var(--color-background)',
          color: 'var(--color-text)',
          timer: 2000,
          showConfirmButton: false
        });

        fetchReviews(); // Recargar lista
      } catch (error: any) {
        Swal.fire({
          title: 'Error',
          text: error.response?.data?.message || 'No se pudo eliminar la reseña',
          icon: 'error',
          background: 'var(--color-background)',
          color: 'var(--color-text)',
        });
      }
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await api.get("/reviews");
      console.log('📊 Reseñas obtenidas:', res.data);
      console.log('📊 Primera reseña (ejemplo):', res.data[0]);
      console.log('📊 Reseñas con categoría:', res.data.filter((r: any) => r.category).length);
      console.log('📊 Categorías encontradas:', [...new Set(res.data.map((r: any) => r.category).filter(Boolean))]);
      setReviews(res.data);
      setFiltered(res.data);
      // Cargar likes después de obtener las reseñas
      await fetchLikesData(res.data);
    } catch (err) {
      console.error("Error cargando reseñas:", err);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    let temp = [...reviews];

    console.log('🔍 Filtro activo - Categoría:', category);
    console.log('🔍 Total reseñas antes de filtrar:', temp.length);
    
    if (category !== "all") {
      temp = temp.filter((r) => r.category === category);
      console.log('🔍 Reseñas después de filtrar por categoría:', temp.length);
      console.log('🔍 Ejemplos filtrados:', temp.slice(0, 3).map(r => ({ category: r.category, comment: r.comment?.substring(0, 30) })));
    }
    
    if (rating !== "") temp = temp.filter((r) => r.rating === Number(rating));
    
    // Filtro de reseñas incoherentes (solo para admin)
    if (filterIncoherent && isAdmin) {
      temp = temp.filter((r) => r.coherence_check && r.coherence_check.startsWith('Incoherente'));
    }

    if (sortBy === "newest") {
      temp.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortBy === "oldest") {
      temp.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (sortBy === "rating-high") {
      temp.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "rating-low") {
      temp.sort((a, b) => a.rating - b.rating);
    }

    setFiltered(temp);
  }, [category, rating, sortBy, reviews, filterIncoherent, isAdmin]);

  return (
    <div className="revContainer">

      {/* Botón de reanálisis para admin - Ubicación superior */}
      {isAdmin && (
        <div className="revAdminPanel">
          <button
            className="revReanalyzeBtn"
            onClick={() => setReanalyzeModalOpen(true)}
          >
            🔄 Reanalizar Todas las Reseñas
          </button>
          <p className="revAdminHint">
            Usa este botón para analizar reseñas antiguas que no tienen análisis de sentimientos
          </p>
        </div>
      )}

      <div className="revHeader">
        <button
          className="revBackBtn"
          onClick={() => navigate("/?section=community")}
        >
          ← Volver
        </button>
        <h2 className="revTitle">Reseñas de la comunidad</h2>
        <div className="revStats">
          <span className="revScore">¡Descubre nuevos negocios!</span>
        </div>

        <div className="revFilters">

          <div className="revFilterItem">
            <label>Filtrar por Rating:</label>
            <select value={rating} onChange={(e) => setRating(e.target.value)}>
              <option value="">Todos</option>
              <option value="5">⭐⭐⭐⭐⭐ (5)</option>
              <option value="4">⭐⭐⭐⭐ (4)</option>
              <option value="3">⭐⭐⭐ (3)</option>
              <option value="2">⭐⭐ (2)</option>
              <option value="1">⭐ (1)</option>
            </select>
          </div>

          <div className="revFilterItem">
            <label>Ordenar por:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Más recientes Primero</option>
              <option value="oldest">Más antiguas Primero</option>
              <option value="rating-high">Mejor calificación Primero</option>
              <option value="rating-low">Peor calificación Primero</option>
            </select>
          </div>

          {/* Filtro de incoherentes solo para admin */}
          {isAdmin && (
            <div className="revFilterItem">
              <label className="revCheckboxLabel">
                <input
                  type="checkbox"
                  checked={filterIncoherent}
                  onChange={(e) => setFilterIncoherent(e.target.checked)}
                />
                <span>Mostrar solo incoherentes</span>
              </label>
            </div>
          )}

        </div>
      </div>

      <div className="revList">
        {filtered.map((r) => (
          <div key={r.review_id} className="revCard">

            <div className="revCardTop">
              <img
                src={r.user?.avatar ? `${r.user.avatar.startsWith('http') ? r.user.avatar : `https://res.cloudinary.com/dfuwufkwg/image/upload/${r.user.avatar}`}` : "https://ui-avatars.com/api/?name=" + encodeURIComponent(r.user?.name || "Usuario") + "&background=667eea&color=fff&size=128"}
                className="revAvatar"
                alt="avatar"
                onError={(e) => {
                  e.currentTarget.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(r.user?.name || "Usuario") + "&background=667eea&color=fff&size=128";
                }}
              />

              <div className="revUserInfo">
                <p className="revUserName">{r.user?.name ?? "Usuario"}</p>
                <StarRating value={r.rating} />
              </div>

              <span className="revDate">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </div>

            <p
              className="revBusinessName"
              onClick={() => navigate(`/local/${r.business?.business_id}`)}
            >
              {r.business?.business_name}
            </p>

            <p className="revComment">{r.comment}</p>

            {/* Respuesta del negocio */}
            {r.owner_reply && (
              <div className="revBusinessResponse">
                <div className="revResponseHeader">
                  <div 
                    className="revResponseBusinessInfo"
                    onClick={() => navigate(`/local/${r.business?.business_id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img 
                      src={r.business?.logo_url || '/inclumap.png'} 
                      alt={r.business?.business_name}
                      className="revResponseBusinessLogo"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/inclumap.png';
                      }}
                    />
                    <div className="revResponseBusinessDetails">
                      <div className="revResponseBusinessNameWrapper">
                        <span className="revResponseBusinessName">{r.business?.business_name}</span>
                        {r.business?.verified && (
                          <span className="revResponseVerifiedBadge" title="Negocio verificado">✓</span>
                        )}
                      </div>
                      <span className="revResponseLabel">Respuesta del negocio</span>
                    </div>
                  </div>
                  <span className="revResponseDate">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="revResponseText">{r.owner_reply}</p>
              </div>
            )}

            {/* Panel de análisis de sentimientos para admins */}
            {isAdmin && r.sentiment_label && (
              <div className={`revSentimentPanel ${r.coherence_check?.startsWith('Incoherente') ? 'incoherent' : 'coherent'}`}>
                <h4>📊 Análisis de Sentimiento:</h4>
                <div className="revSentimentInfo">
                  <span><strong>Usuario:</strong> {r.user?.name || 'Usuario'} (ID: {r.user?.user_id})</span>
                  <span><strong>Strikes:</strong> {r.user?.offensive_strikes || 0} ⚠️</span>
                  <span><strong>Estado:</strong> {r.user?.is_banned ? '🚫 Bloqueado' : '✅ Activo'}</span>
                  <span><strong>Sentimiento:</strong> {r.sentiment_label}</span>
                  <span><strong>Coherencia:</strong> {r.coherence_check}</span>
                  <span><strong>Acción Sugerida:</strong> {r.suggested_action}</span>
                </div>

                {/* Botón de reportar usuario */}
                {!r.user?.is_banned && (
                  <div style={{ marginTop: '12px' }}>
                    <button 
                      className="revReportUserBtn"
                      onClick={() => handleReportUser(r.user?.user_id, r.user?.name || 'Usuario')}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                    >
                      🚨 Reportar Usuario (+1 Strike)
                    </button>
                  </div>
                )}
                
                {/* Botón de corrección solo si es incoherente */}
                {r.coherence_check?.startsWith('Incoherente') && (
                  <div className="revCorrectionPanel">
                    <p className="revCorrectionHint">
                      💡 Esta reseña parece incoherente. 
                      {getSuggestedRating(r) && (
                        <> Calificación sugerida: {getSuggestedRating(r)} ⭐</>
                      )}
                    </p>
                    <div className="revCorrectionButtons">
                      {[1, 2, 3, 4, 5].map((stars) => (
                        <button
                          key={stars}
                          className={`revCorrectionBtn ${getSuggestedRating(r) === stars ? 'suggested' : ''}`}
                          onClick={() => openConfirmModal(r.review_id, stars, r.comment)}
                          title={`Corregir a ${stars} estrellas`}
                        >
                          {stars} ⭐
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {r.images?.length > 0 && (
              <div className="revImages">
                {r.images.map((img: string, i: number) => (
                  <img key={i} src={img} className="revImgItem" alt="foto reseña" />
                ))}
              </div>
            )}

            {/* ❤️ LIKE CON API */}
            <div className="revLikeContainer">
              <button
                className={`revLikeBtn ${likesData[r.review_id]?.liked ? "liked" : ""}`}
                onClick={() => toggleLike(r.review_id)}
              >
                {likesData[r.review_id]?.liked ? "💛" : "🤍"}
              </button>

              <span className="revLikeCount">
                {likesData[r.review_id]?.count || 0}
              </span>

              {/* Botón de eliminar (solo admin) */}
              {isAdmin && (
                <button
                  className="revDeleteBtn"
                  onClick={() => handleDeleteReview(r.review_id, r.business?.business_name || 'este negocio')}
                  title="Eliminar reseña"
                  style={{
                    marginLeft: '12px',
                    padding: '8px 16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '14px',
                    transition: 'all 0.2s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                >
                  🗑️ Eliminar
                </button>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* Modal para reanalizar todas las reseñas (solo admin) */}
      {isAdmin && reanalyzeModalOpen && (
        <div className="revReanalyzeModalOverlay">
          <div className="revReanalyzeModal" role="dialog" aria-modal="true">
            <h3 className="revReanalyzeTitle">🔄 Reanalizar todas las reseñas</h3>
            <p className="revReanalyzeText">
              ¿Deseas reanalizar todas las reseñas existentes? Esto puede tardar unos momentos,
              pero nos ayudará a tener un análisis de sentimientos más preciso.
            </p>
            <div className="revReanalyzeActions">
              <button
                className="revReanalyzeCancel"
                onClick={() => !reanalyzing && setReanalyzeModalOpen(false)}
                disabled={reanalyzing}
              >
                Cancelar
              </button>
              <button
                className="revReanalyzeConfirm"
                onClick={handleReanalyzeAll}
                disabled={reanalyzing}
              >
                {reanalyzing ? 'Reanalizando…' : 'Sí, reanalizar ahora'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para corrección */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setSelectedReview(null);
        }}
        onConfirm={confirmCorrection}
        title="¿Confirmar corrección?"
        message={`La calificación de esta reseña será actualizada a ${selectedReview?.stars} estrella${selectedReview?.stars !== 1 ? 's' : ''}.`}
        details={selectedReview?.comment.substring(0, 100) + (selectedReview?.comment.length > 100 ? '...' : '')}
        confirmText="Confirmar Corrección"
        cancelText="Cancelar"
        type="warning"
      />
    </div>
  );
}
