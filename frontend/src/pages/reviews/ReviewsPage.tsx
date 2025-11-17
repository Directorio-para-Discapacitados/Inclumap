import { useEffect, useState } from "react";
import { api } from "../../config/api"; // ← axios instance correcta

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);

  const [ratingFilter, setRatingFilter] = useState("");
  const [sortBy, setSortBy] = useState("");

  // Cargar reseñas desde el backend
  const fetchReviews = async () => {
    try {
      const res = await api.get("/reviews"); // ← RUTA CORRECTA
      setReviews(res.data);
      setFiltered(res.data);
      console.log("Reseñas cargadas:", res.data);
    } catch (err) {
      console.error("Error cargando reseñas:", err);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  /** ---- Filtros ---- **/
  useEffect(() => {
    let data = [...reviews];

    // ⭐ Filtrar por rating exacto
    if (ratingFilter !== "") {
      data = data.filter((r) => r.rating === Number(ratingFilter));
    }

    // 🔽 Ordenamientos
    if (sortBy === "rating_desc") {
      data.sort((a, b) => b.rating - a.rating);
    }
    if (sortBy === "rating_asc") {
      data.sort((a, b) => a.rating - b.rating);
    }
    if (sortBy === "date_desc") {
      data.sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
    }
    if (sortBy === "date_asc") {
      data.sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      );
    }

    setFiltered(data);
  }, [ratingFilter, sortBy, reviews]);

  return (
    <div className="min-h-screen bg-white p-4 md:p-10 text-neutral-900">
      {/* Header */}
      <h1 className="text-3xl font-bold mb-6 text-neutral-800">
        ⭐ Reseñas de la Comunidad
      </h1>

      <p className="text-neutral-600 mb-8 max-w-lg leading-relaxed">
        Explorá las experiencias compartidas por la comunidad.  
        Esta vista está pensada para ser accesible, inclusiva y clara.  
        Podés ordenar y filtrar las reseñas según tus necesidades.
      </p>

      {/* Filtros */}
      <div className="mb-8 flex flex-col md:flex-row gap-4 md:items-end">
        {/* Filtro de rating */}
        <div className="flex flex-col w-full max-w-xs">
          <label className="text-sm font-medium mb-1">Filtrar por calificación</label>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los ratings</option>
            <option value="1">⭐ 1</option>
            <option value="2">⭐ 2</option>
            <option value="3">⭐ 3</option>
            <option value="4">⭐ 4</option>
            <option value="5">⭐ 5</option>
          </select>
        </div>

        {/* Ordenamiento */}
        <div className="flex flex-col w-full max-w-xs">
          <label className="text-sm font-medium mb-1">Ordenar por</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sin orden</option>
            <option value="rating_desc">Rating: mayor a menor</option>
            <option value="rating_asc">Rating: menor a mayor</option>
            <option value="date_desc">Fecha: más reciente</option>
            <option value="date_asc">Fecha: más antigua</option>
          </select>
        </div>
      </div>

      {/* Lista de reseñas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((r) => (
          <div
            key={r.review_id}
            className="border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-lg">
                {r.business?.name ?? "Negocio desconocido"}
              </p>
              <span className="bg-blue-600 text-white text-sm px-2 py-1 rounded-lg">
                ⭐ {r.rating}
              </span>
            </div>

            <p className="text-neutral-700 mb-3 text-sm">
              {r.comment || "Sin comentario."}
            </p>

            <div className="text-xs text-neutral-500 flex justify-between">
              <span>Por: {r.user?.name ?? "Usuario"}</span>
              <span>
                {r.created_at
                  ? new Date(r.created_at).toLocaleDateString()
                  : "Fecha no disponible"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Sin resultados */}
      {filtered.length === 0 && (
        <p className="text-neutral-500 text-center mt-10">
          No se encontraron reseñas con los filtros seleccionados.
        </p>
      )}
    </div>
  );
}
