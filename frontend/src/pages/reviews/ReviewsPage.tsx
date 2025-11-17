import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../config/api";
import "./reviews.css";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const navigate = useNavigate();

  const [category, setCategory] = useState("all");
  const [rating, setRating] = useState("");
  const [sortBy, setSortBy] = useState("newest");

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

  // FILTROS Y ORDENAMIENTO
  useEffect(() => {
    let temp = [...reviews];

    if (category !== "all") {
      temp = temp.filter((r) => r.category === category);
    }

    if (rating !== "") {
      temp = temp.filter((r) => r.rating === Number(rating));
    }

    if (sortBy === "newest") {
      temp.sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
    } else if (sortBy === "oldest") {
      temp.sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      );
    } else if (sortBy === "rating-high") {
      temp.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "rating-low") {
      temp.sort((a, b) => a.rating - b.rating);
    }

    setFiltered(temp);
  }, [category, rating, sortBy, reviews]);

  return (
    <div className="revContainer">

      {/* HEADER */}
      <div className="revHeader">
        <h2 className="revTitle">Reseñas de la comunidad</h2>

        <div className="revStats">
          <span className="revScore">⭐⭐⭐⭐⭐</span>
        </div>

        {/* CATEGORY FILTERS */}
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

        {/* FILTER SELECTS */}
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
              <option value="newest">Más recientes</option>
              <option value="oldest">Más antiguas</option>
              <option value="rating-high">Mejor calificación</option>
              <option value="rating-low">Peor calificación</option>
            </select>
          </div>

        </div>
      </div>

      {/* LISTA DE RESEÑAS */}
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
                <span className="revRating">⭐ {r.rating}</span>
              </div>

              <span className="revDate">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </div>

            {/* NEW — BUSINESS NAME */}
                  <p
  className="revBusinessName"
  onClick={() => navigate(`/local/${r.business?.business_id}`)}
  style={{ cursor: "pointer" }}
>
  {r.business?.business_name}
</p>


            <p className="revComment">{r.comment}</p>

            {r.images?.length > 0 && (
              <div className="revImages">
                {r.images.map((img: string, i: number) => (
                  <img key={i} src={img} className="revImgItem" alt="foto reseña" />
                ))}
              </div>
            )}

          </div>
        ))}
      </div>

      {/* BOTÓN PARA ESCRIBIR */}
      <div className="revWriteContainer">
        <button className="revWriteBtn">
          ✚ Escribe tu reseña
        </button>
      </div>
    </div>
  );
}
