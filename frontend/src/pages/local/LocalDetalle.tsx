import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL, api } from "../../config/api";
import "./LocalDetalle.css";

/* SweetAlert */
import Swal from "sweetalert2";

/* Iconos */
import {
  Accessibility,
  DoorOpen,
  Car,
  ArrowUpFromLine,
  GripVertical,
  Move,
  Droplet,
  LayoutPanelTop,
  SquareDashed,
  Info,
  ScanEye,
  BadgeCheck,
  MapPin,
  Phone,
  Share2,
  CheckCircle,
  MessageCircle,
  Star,
  StarHalf,
} from "lucide-react";

/* Mapa */
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* Fix Leaflet */
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

/* Interfaces */
interface AccessibilityMaster {
  accessibility_id: number;
  accessibility_name: string;
  description?: string;
}

interface BusinessAccessibilityItem {
  id: number;
}

interface LocalData {
  business_id: number;
  business_name: string;
  address?: string;
  phone?: string;
  average_rating?: number | string;
  logo_url?: string;
  owner_name?: string;
  description?: string;
  coordinates?: string;
  latitude?: number | null;
  longitude?: number | null;
  business_accessibility?: BusinessAccessibilityItem[];
}

/* Fallback accesibilidad */
const fallbackMaster: AccessibilityMaster[] = [
  { accessibility_id: 1, accessibility_name: "Rampa Acceso" },
  { accessibility_id: 2, accessibility_name: "Baño adaptado" },
  { accessibility_id: 3, accessibility_name: "Estacionamiento" },
  { accessibility_id: 4, accessibility_name: "Puertas Anchas" },
  { accessibility_id: 5, accessibility_name: "Circulación Interior" },
  { accessibility_id: 6, accessibility_name: "Ascensor Accesible" },
  { accessibility_id: 7, accessibility_name: "Pisos Seguros" },
  { accessibility_id: 8, accessibility_name: "Barras de Apoyo" },
  { accessibility_id: 9, accessibility_name: "Lavamanos Accesible" },
  { accessibility_id: 10, accessibility_name: "Mostrador Accesible" },
  { accessibility_id: 11, accessibility_name: "Señalización (SIA)" },
  { accessibility_id: 12, accessibility_name: "Señalización Táctil/Braille" },
];

/* Icono según nombre */
const iconByName = (name?: string) => {
  if (!name) return <Accessibility />;
  const n = name.toLowerCase();

  if (n.includes("rampa")) return <Accessibility />;
  if (n.includes("baño")) return <BadgeCheck />;
  if (n.includes("puerta")) return <DoorOpen />;
  if (n.includes("estacionamiento")) return <Car />;
  if (n.includes("ascensor")) return <ArrowUpFromLine />;
  if (n.includes("barras")) return <GripVertical />;
  if (n.includes("circulación")) return <Move />;
  if (n.includes("lavamanos")) return <Droplet />;
  if (n.includes("mostrador")) return <LayoutPanelTop />;
  if (n.includes("piso")) return <SquareDashed />;
  if (n.includes("braille") || n.includes("táctil")) return <ScanEye />;
  if (n.includes("señalización")) return <Info />;

  return <Accessibility />;
};

/* Renderizador de estrellas */
const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <div className="stars-container">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f-${i}`} className="star-icon" />
      ))}
      {half && <StarHalf className="star-icon" />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e-${i}`} className="star-icon empty" />
      ))}
    </div>
  );
};

const LocalDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  /* Estados */
  const [data, setData] = useState<LocalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [masterList, setMasterList] = useState<AccessibilityMaster[] | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const token = localStorage.getItem("token");
  const userId = Number(localStorage.getItem("user_id"));

  /* Cargar info del local */
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        const resp = await fetch(`${API_URL}/business/public/${id}`);
        const json = await resp.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  /* Cargar accesibilidad */
  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetch(`${API_URL}/accessibility`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!resp.ok) return setMasterList(fallbackMaster);

        const json = await resp.json();

        setMasterList(
          json.map((it: any) => ({
            accessibility_id: it.accessibility_id ?? it.id,
            accessibility_name: it.accessibility_name ?? it.name,
            description: it.description ?? "",
          }))
        );
      } catch {
        setMasterList(fallbackMaster);
      }
    };
    load();
  }, []);

  /* Cargar reseñas */
  useEffect(() => {
    if (!id) return;
    const loadReviews = async () => {
      try {
        const res = await api.get(`/reviews/business/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setReviews(res.data || []);
      } catch {
        Swal.fire("Error", "No se pudieron cargar las reseñas.", "error");
      }
    };
    loadReviews();
  }, [id]);

  const myReview = reviews.find((r) => r.user?.user_id === userId);

  const resolveAccessibility = (item: BusinessAccessibilityItem) =>
    masterList?.find((m) => Number(m.accessibility_id) === Number(item.id)) ?? null;

  /* Compartir */
  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* Crear reseña */
  const handleCreateReview = async () => {
    if (!token)
      return Swal.fire("Inicia sesión", "Debes iniciar sesión para reseñar.", "info");

    if (myReview)
      return Swal.fire(
        "Ya tienes una reseña",
        "Solo puedes dejar una reseña por local.",
        "warning"
      );

    if (!rating)
      return Swal.fire("Falta calificación", "Selecciona una cantidad de estrellas.", "warning");

    try {
      await api.post(
        "/reviews",
        { rating, comment, business_id: Number(id) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("¡Listo!", "Tu reseña fue publicada 🎉", "success");

      setRating(0);
      setComment("");

      const res = await api.get(`/reviews/business/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setReviews(res.data);
    } catch (e: any) {
      Swal.fire(
        "Error",
        e?.response?.data?.message || "No se pudo enviar la reseña.",
        "error"
      );
    }
  };

  /* Eliminar reseña */
  const handleDeleteReview = async (reviewId: number) => {
    if (!token)
      return Swal.fire("Inicia sesión", "Debes iniciar sesión para eliminar reseñas.", "info");

    const confirm = await Swal.fire({
      title: "¿Eliminar reseña?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.delete(`/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire("Eliminada", "Tu reseña fue eliminada.", "success");

      const res = await api.get(`/reviews/business/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setReviews(res.data);
    } catch {
      Swal.fire("Error", "No se pudo eliminar la reseña.", "error");
    }
  };

  /* Guardar edición */
  const handleSaveEdit = async () => {
    if (!editing) return;

    try {
      await api.patch(
        `/reviews/${editing.review_id}`,
        { rating: editing.rating, comment: editing.comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Actualizada", "Tu reseña fue editada correctamente.", "success");

      setEditing(null);

      const res = await api.get(`/reviews/business/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setReviews(res.data);
    } catch {
      Swal.fire("Error", "No se pudo actualizar la reseña.", "error");
    }
  };

  return (
    <div className="local-details-container">
      <button className="volver-btn" onClick={() => navigate(-1)}>
        ← Volver
      </button>

      {loading && <div className="loading">Cargando...</div>}

      {data && (
        <>
          {/* HEADER */}
          <header className="local-details-header">
            <div className="local-details-main-icon">
              {data.logo_url ? (
                <img
                  src={data.logo_url}
                  alt="logo"
                  style={{ width: 140, height: 110, objectFit: "cover", borderRadius: 12 }}
                />
              ) : (
                <Accessibility size={72} />
              )}
            </div>

            <div>
              <h1 className="local-details-name">{data.business_name}</h1>

              {data.average_rating ? (
                <StarRating rating={Number(data.average_rating)} />
              ) : (
                <p className="muted">Sin calificación</p>
              )}

              {data.address && <p className="muted">{data.address}</p>}
            </div>

            <div className="local-details-buttons">
              <a
                className="local-details-btn"
                target="_blank"
                rel="noreferrer"
                href={`https://www.google.com/maps?q=${encodeURIComponent(
                  data.coordinates || `${data.latitude},${data.longitude}`
                )}`}
              >
                <MapPin size={16} /> Ver en Google Maps
              </a>

              <a
                className="local-details-btn"
                href={data.phone ? `tel:${data.phone}` : undefined}
                style={{ opacity: data.phone ? 1 : 0.5 }}
              >
                <Phone size={16} /> {data.phone || "Sin teléfono"}
              </a>

              <button className="local-details-btn" onClick={handleShare}>
                <Share2 size={16} /> Compartir
              </button>
            </div>

            {copied && (
              <div className="copied">
                <CheckCircle size={16} /> Link copiado
              </div>
            )}
          </header>

          {/* BODY */}
          <section className="main-content">
            {/* LEFT */}
            <div className="left-column">
              <div className="card descripcion-card">
                <h2>Descripción</h2>
                <p>{data.description || "Sin descripción disponible"}</p>
              </div>

              {/* Accesibilidad */}
              {Array.isArray(data.business_accessibility) &&
                data.business_accessibility.length > 0 && (
                  <div className="card accesibilidad-card">
                    <h2>Accesibilidad</h2>

                    <div className="accessibility-grid">
                      {data.business_accessibility
                        .map(resolveAccessibility)
                        .filter(Boolean)
                        .map((item) => (
                          <div key={item!.accessibility_id} className="accessibility-icon-wrapper">
                            {React.cloneElement(iconByName(item!.accessibility_name) as any, {
                              size: 34,
                            })}

                            <div className="accessibility-label">
                              {item!.accessibility_name}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </div>

            {/* RIGHT MAPA */}
            <aside className="right-column">
              <div className="card mapa-card">
                <h2>Ubicación</h2>

                {(() => {
                  let lat = data.latitude;
                  let lon = data.longitude;

                  if ((!lat || !lon) && data.coordinates) {
                    const parts = data.coordinates.split(",").map(Number);
                    if (parts.length === 2) {
                      lat = parts[0];
                      lon = parts[1];
                    }
                  }

                  if (!lat || !lon)
                    return <p className="muted">Coordenadas no disponibles</p>;

                  return (
                    <div style={{ height: 300 }}>
                      <MapContainer center={[lat, lon]} zoom={16} style={{ height: "100%" }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[lat, lon]}>
                          <Popup>
                            <strong>{data.business_name}</strong>
                            <br />
                            {data.address}
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  );
                })()}
              </div>
            </aside>
          </section>

          {/* RESEÑAS */}
          <section className="reviews-section">
            <h2>
              <MessageCircle size={18} /> Reseñas
            </h2>

            {/* Si NO tiene reseña */}
            {!myReview && (
              <div className="review-form">
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
                  className="review-textarea"
                />

                <button className="review-submit-btn" onClick={handleCreateReview}>
                  Publicar reseña
                </button>
              </div>
            )}

            {/* Ya dejó reseña */}
            {myReview && (
              <div className="my-review-box">
                <p className="my-review-text">Ya dejaste una reseña en este local.</p>
                <button className="review-submit-btn" onClick={() => setEditing({ ...myReview })}>
                  Editar mi reseña
                </button>
              </div>
            )}

            {/* Listado */}
            <div className="reviews-list">
              {reviews.length === 0 ? (
                <p>No hay reseñas aún.</p>
              ) : (
                reviews.map((r) => (
                  <div key={r.review_id} className="review-item">
                    <StarRating rating={r.rating} />

                    <p className="review-text">{r.comment}</p>

                    <div className="review-meta">
                      <small>{new Date(r.created_at).toLocaleDateString()}</small>

                      {userId === r.user.user_id && (
                        <div className="review-actions">
                          <button onClick={() => setEditing({ ...r })}>Editar</button>
                          <button onClick={() => handleDeleteReview(r.review_id)}>Eliminar</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal edición */}
            {editing && (
              <div className="modal-overlay">
                <div className="modal">
                  <h3>Editar reseña</h3>

                  <div className="stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        className={s <= editing.rating ? "star selected" : "star"}
                        onClick={() => setEditing({ ...editing, rating: s })}
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  <textarea
                    value={editing.comment}
                    onChange={(e) => setEditing({ ...editing, comment: e.target.value })}
                  />

                  <button className="review-submit-btn" onClick={handleSaveEdit}>
                    Guardar cambios
                  </button>

                  <button className="review-cancel-btn" onClick={() => setEditing(null)}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default LocalDetalle;
