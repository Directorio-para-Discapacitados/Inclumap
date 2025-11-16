import React, { useEffect, useState } from "react";
import { api } from "../../config/api";
import "./reviews.css";
import { useParams } from "react-router-dom";

/* =====================================
   Tipos de datos
===================================== */
type Review = {
  review_id: number;
  rating: number;
  comment: string;
  created_at: string;

  user?: { user_id: number };

  business?: {
    business_id?: number;
    business_name?: string;
  };
};

export default function ReviewsPage() {
  /* businessId viene solo cuando la URL es /reviews/:businessId */
  const { businessId } = useParams<{ businessId?: string }>();

  /* Estado base */
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filtered, setFiltered] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  /* Estado del filtro */
  const [filter, setFilter] =
    useState<"recent" | "old" | "best" | "worst">("recent");

  /* ======================================================
     1. Cargar reseñas de un solo local (si hay businessId)
  ====================================================== */
  const fetchLocalReviews = async (id: string) => {
    try {
      setLoading(true);

      const res = await api.get(`/reviews/business/${id}`);

      // Mapeamos resultados, agregando información del local
      const mapped = (res.data || []).map((rev: any) => ({
        ...rev,
        business: {
          business_id: Number(id),
          business_name: rev.business_name || "",
        },
      }));

      setReviews(mapped);
      setFiltered(mapped);
    } catch (err) {
      console.error("Error cargando reseñas del local:", err);
      setReviews([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
     2. Cargar TODAS las reseñas del sistema (modo global)
     SIN tocar el backend.
     - Se obtiene lista de negocios
     - Por cada negocio se hace GET /reviews/business/:id
  ====================================================== */
  const fetchAllReviews = async () => {
    try {
      setLoading(true);

      // Obtener negocios
      const businessRes = await api.get("/business");
      const businesses = businessRes.data || [];

      if (!Array.isArray(businesses) || businesses.length === 0) {
        setReviews([]);
        setFiltered([]);
        return;
      }

      // Ejecutar múltiples requests en paralelo
      const promises = businesses.map(async (b: any) => {
        try {
          const r = await api.get(`/reviews/business/${b.business_id}`);

          const mapped = (r.data || []).map((rev: any) => ({
            ...rev,
            business: {
              business_id: b.business_id,
              business_name: b.business_name,
            },
          }));

          return mapped;
        } catch (err) {
          return [];
        }
      });

      // Unir todas las reseñas en un solo arreglo
      const results = await Promise.all(promises);
      const all = results.flat();

      setReviews(all);
      setFiltered(all);
    } catch (err) {
      console.error("Error cargando reseñas globales:", err);
      setReviews([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
     3. Inicialización
     Si hay businessId → cargar reseñas de ese local
     Si NO hay → cargar reseñas globales
  ====================================================== */
  useEffect(() => {
    if (businessId) fetchLocalReviews(businessId);
    else fetchAllReviews();
  }, [businessId]);

  /* ======================================================
     4. Aplicar filtros (ordenar reseñas)
  ====================================================== */
  useEffect(() => {
    const arr = [...reviews];

    switch (filter) {
      case "recent":
        arr.sort(
          (a, b) =>
            +new Date(b.created_at) - +new Date(a.created_at)
        );
        break;

      case "old":
        arr.sort(
          (a, b) =>
            +new Date(a.created_at) - +new Date(b.created_at)
        );
        break;

      case "best":
        arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;

      case "worst":
        arr.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        break;
    }

    setFiltered(arr);
  }, [filter, reviews]);

  /* ======================================================
     Render principal
  ====================================================== */
  return (
    <div className="reviews-container">
      <h1 className="reviews-title">
        {businessId ? "Reseñas del Local" : "Todas las Reseñas"}
      </h1>

      {/* SOLO mostrar controles cuando NO estamos viendo un local */}
      {!businessId && (
        <div className="reviews-controls">
          <label>
            Ordenar:
            <select
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value as any)
              }
            >
              <option value="recent">Más recientes</option>
              <option value="old">Más antiguas</option>
              <option value="best">Mejor valoradas</option>
              <option value="worst">Peor valoradas</option>
            </select>
          </label>

          <div className="reviews-summary">
            {reviews.length} reseñas
          </div>
        </div>
      )}

      {/* LISTA DE RESEÑAS */}
      {loading ? (
        <p>Cargando reseñas...</p>
      ) : filtered.length === 0 ? (
        <p>No hay reseñas disponibles.</p>
      ) : (
        <div className="reviews-list">
          {filtered.map((r) => (
            <div key={r.review_id} className="review-item">
              
              {/* Nombre del local (solo modo global) */}
              {!businessId && (
                <div className="review-business-name">
                  <strong>
                    {r.business?.business_name ||
                      `Local ${r.business?.business_id}`}
                  </strong>
                </div>
              )}

              <div className="review-header">
                {/* Rating */}
                <div className="review-rating">
                  {"★".repeat(r.rating || 0)}
                  {"☆".repeat(5 - (r.rating || 0))}
                </div>

                {/* Fecha */}
                <span className="review-date">
                  {r.created_at
                    ? new Date(r.created_at).toLocaleDateString()
                    : ""}
                </span>
              </div>

              {/* Comentario */}
              <p className="review-comment">
                {r.comment || "Sin comentario"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
