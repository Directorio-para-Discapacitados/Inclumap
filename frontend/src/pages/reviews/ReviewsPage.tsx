import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
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

  // ⭐ LOCAL LIKES
  const [likes, setLikes] = useState<Record<string, boolean>>({});

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

  // cargar likes guardados
  useEffect(() => {
    const saved = localStorage.getItem("review_likes");
    if (saved) setLikes(JSON.parse(saved));
  }, []);

  const toggleLike = (reviewId: string) => {
    setLikes((prev) => {
      const updated = { ...prev, [reviewId]: !prev[reviewId] };
      localStorage.setItem("review_likes", JSON.stringify(updated));
      return updated;
    });
  };

  const localLikesCount = (r: any) => {
    const base = r.likes_count ?? 0;
    return likes[r.review_id] ? base + 1 : base;
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
    if (!window.confirm('¿Deseas reanalizar todas las reseñas existentes? Esto puede tardar unos momentos.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/reviews/reanalyze-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`✅ ${res.data.message}: ${res.data.analyzed} reseñas analizadas, ${res.data.incoherent_found} incoherentes detectadas`, { autoClose: 5000 });
      fetchReviews(); // Recargar reseñas
    } catch (error: any) {
      toast.error(`❌ Error al reanalizar: ${error.response?.data?.message || error.message}`, { autoClose: 3000 });
    }
  };

  const categories = [
    { key: "all", label: "Todas" },
    { key: "access", label: "Accesibilidad" },
    { key: "service", label: "Servicio" },
    { key: "comfort", label: "Comodidad" },
    { key: "food", label: "Comida" },
  ];

  const fetchReviews = async () => {
    try {
      const res = await api.get("/reviews");
      setReviews(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error("Error cargando reseñas:", err);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    let temp = [...reviews];

    if (category !== "all") temp = temp.filter((r) => r.category === category);
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
          <button className="revReanalyzeBtn" onClick={handleReanalyzeAll}>
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

        <div className="revCategories">
          {categories.map((c) => (
            <button
              key={c.key}
              className={`revCategoryBtn ${category === c.key ? "active" : ""}`}
              onClick={() => setCategory(c.key)}
            >
              {c.label}
            </button>
          ))}
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
                src={r.user?.avatar || "/default-user.png"}
                className="revAvatar"
                alt="avatar"
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

            {/* Panel de análisis de sentimientos para admins */}
            {isAdmin && r.sentiment_label && (
              <div className={`revSentimentPanel ${r.coherence_check?.startsWith('Incoherente') ? 'incoherent' : 'coherent'}`}>
                <h4>📊 Análisis de Sentimiento:</h4>
                <div className="revSentimentInfo">
                  <span><strong>Sentimiento:</strong> {r.sentiment_label}</span>
                  <span><strong>Coherencia:</strong> {r.coherence_check}</span>
                  <span><strong>Acción Sugerida:</strong> {r.suggested_action}</span>
                </div>
                
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
                          onClick={() => {
                            if (window.confirm(`¿Corregir calificación a ${stars} estrellas?`)) {
                              handleCorrectReview(r.review_id, stars);
                            }
                          }}
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

            {/* ❤️ LIKE LOCAL */}
            <div className="revLikeContainer">
              <button
                className={`revLikeBtn ${likes[r.review_id] ? "liked" : ""}`}
                onClick={() => toggleLike(r.review_id)}
              >
                {likes[r.review_id] ? "💛" : "🤍"}
              </button>

              <span className="revLikeCount">
                {localLikesCount(r)}
              </span>
            </div>

          </div>
        ))}
      </div>

      <div className="revWriteContainer">
        <button className="revWriteBtn">✚ Escribe tu reseña</button>
      </div>

    </div>
  );
}
