import React, { useEffect, useState } from "react";
import { api } from "../../config/api";
import "./reviews.css";
import { useParams } from "react-router-dom";

type Review = {
  review_id: number;
  rating: number;
  comment: string;
  created_at: string;
  user: { user_id: number };
};

export default function ReviewsPage() {
  const { businessId } = useParams();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Review | null>(null);

  const token = localStorage.getItem("token");
  const userId = Number(localStorage.getItem("user_id"));

  // =====================
  // GET REVIEWS
  // =====================
  const fetchReviews = async () => {
    if (!businessId) return;

    try {
      setLoading(true);
      const res = await api.get(`/reviews/business/${businessId}`);
      setReviews(res.data || []);
    } catch (e) {
      console.error("Error cargando reseñas:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [businessId]);

  // =====================
  // CREATE REVIEW
  // =====================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return alert("Debes iniciar sesión");

    try {
      await api.post(
        "/reviews",
        { rating, comment, business_id: Number(businessId) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRating(0);
      setComment("");
      await fetchReviews();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Error al crear reseña");
    }
  };

  // =====================
  // DELETE REVIEW
  // =====================
  const handleDelete = async (id: number) => {
    if (!token) return alert("Debes iniciar sesión");

    if (!confirm("¿Eliminar reseña?")) return;

    try {
      await api.delete(`/reviews/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchReviews();
    } catch (e) {
      alert("Error al eliminar la reseña");
    }
  };

  // =====================
  // EDIT REVIEW
  // =====================
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.patch(
        `/reviews/${editing!.review_id}`,
        { rating: editing!.rating, comment: editing!.comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEditing(null);
      fetchReviews();
    } catch (e) {
      alert("Error al actualizar reseña");
    }
  };

  return (
    <div className="reviews-container">

      {/* SIN BUSINESS ID */}
      {!businessId ? (
        <div className="reviews-empty">
          <h2>Selecciona un local para ver sus reseñas</h2>
          <p>Desde el mapa o desde la lista de locales puedes ingresar al detalle.</p>

          <button
            className="btn-primary"
            onClick={() => (window.location.href = "/")}
          >
            Ver Locales
          </button>
        </div>
      ) : (
        <>
          <h1 className="reviews-title">Reseñas del Local</h1>

          {/* FORMULARIO */}
          <form className="review-form" onSubmit={handleSubmit}>
            <h3>Agregar reseña</h3>

            <div className="stars">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className={s <= rating ? "star selected" : "star"}
                  onClick={() => setRating(s)}
                >
                  ★
                </span>
              ))}
            </div>

            <textarea
              placeholder="Escribe un comentario..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <button className="btn-primary">Enviar reseña</button>
          </form>

          <hr />

          {/* LISTA */}
          <h2>Reseñas recientes</h2>

          {loading ? (
            <p>Cargando...</p>
          ) : reviews.length === 0 ? (
            <p>No hay reseñas aún.</p>
          ) : (
            <div className="reviews-list">
              {reviews.map((r) => (
                <div key={r.review_id} className="review-item">
                  <div className="review-header">
                    <div className="review-rating">
                      {"★".repeat(r.rating)}
                      {"☆".repeat(5 - r.rating)}
                    </div>
                    <span className="review-date">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="review-comment">{r.comment || "Sin comentario"}</p>

                  {/* Botones si pertenece al usuario */}
                  {r.user?.user_id === userId && (
                    <div className="review-actions">
                      <button
                        className="btn-edit"
                        onClick={() => setEditing({ ...r })}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(r.review_id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* MODAL DE EDICIÓN */}
          {editing && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Editar reseña</h3>

                <div className="stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={s <= editing.rating ? "star selected" : "star"}
                      onClick={() =>
                        setEditing((prev) => ({ ...prev!, rating: s }))
                      }
                    >
                      ★
                    </span>
                  ))}
                </div>

                <textarea
                  value={editing.comment}
                  onChange={(e) =>
                    setEditing((prev) => ({ ...prev!, comment: e.target.value }))
                  }
                />

                <div className="modal-actions">
                  <button className="btn-primary" onClick={handleEdit}>
                    Guardar cambios
                  </button>
                  <button className="btn-cancel" onClick={() => setEditing(null)}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
