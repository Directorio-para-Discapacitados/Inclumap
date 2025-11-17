import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../config/api";
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

  const [category, setCategory] = useState("all");
  const [rating, setRating] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // ⭐ LOCAL LIKES
  const [likes, setLikes] = useState<Record<string, boolean>>({});

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
  }, [category, rating, sortBy, reviews]);

  return (
    <div className="revContainer">

      <div className="revHeader">
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
