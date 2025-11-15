import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import "./LocalDetalle.css";

/* Icons */
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

/* Map */
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* Fix leaflet icon (global) */
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
  { accessibility_id: 1, accessibility_name: "Rampa Acceso", description: "Rampa de acceso para sillas de ruedas." },
  { accessibility_id: 2, accessibility_name: "Baño adaptado", description: "Baño adaptado para personas con movilidad reducida." },
  { accessibility_id: 3, accessibility_name: "Estacionamiento", description: "Estacionamiento reservado para personas con discapacidad." },
  { accessibility_id: 4, accessibility_name: "Puertas Anchas", description: "Puertas con al menos 80 cm de ancho." },
  { accessibility_id: 5, accessibility_name: "Circulación Interior", description: "Pasillos anchos y libres de obstáculos." },
  { accessibility_id: 6, accessibility_name: "Ascensor Accesible", description: "Ascensor accesible para sillas de ruedas." },
  { accessibility_id: 7, accessibility_name: "Pisos Seguros", description: "Pisos antideslizantes y firmes." },
  { accessibility_id: 8, accessibility_name: "Barras de Apoyo", description: "Barras de apoyo en baños o zonas necesarias." },
  { accessibility_id: 9, accessibility_name: "Lavamanos Accesible", description: "Lavamanos a altura accesible." },
  { accessibility_id: 10, accessibility_name: "Mostrador Accesible", description: "Mostrador adaptado a baja altura." },
  { accessibility_id: 11, accessibility_name: "Señalización (SIA)", description: "Zonas accesibles señalizadas correctamente." },
  { accessibility_id: 12, accessibility_name: "Señalización Táctil/Braille", description: "Elementos en relieve y braille." },
];

/* Icon map */
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

/* Small star renderer component */
const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="stars-container" aria-hidden>
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f-${i}`} className="star-icon" />
      ))}
      {half && <StarHalf className="star-icon" />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e-${i}`} className="star-icon" style={{ opacity: 0.25 }} />
      ))}
    </div>
  );
};

const LocalDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<LocalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [masterList, setMasterList] = useState<AccessibilityMaster[] | null>(null);
  const [copied, setCopied] = useState(false);

  const [reviews, setReviews] = useState<{ text: string; rating: number }[]>([]);
  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState<number>(5);

  /* GET local info */
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const resp = await fetch(`${API_URL}/business/public/${id}`);
        if (!resp.ok) throw new Error("No se pudo obtener el local");
        const json = await resp.json();
        setData(json);
      } catch (e: any) {
        setError(e.message || "Error al obtener datos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  /* GET accessibility catalog */
  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetch(`${API_URL}/accessibility`);
        if (!resp.ok) {
          setMasterList(fallbackMaster);
          return;
        }
        const json = await resp.json();
        const normalized = json.map((it: any) => ({
          accessibility_id: it.accessibility_id ?? it.id,
          accessibility_name: it.accessibility_name ?? it.name,
          description: it.description ?? "",
        }));
        setMasterList(normalized);
      } catch {
        setMasterList(fallbackMaster);
      }
    };
    load();
  }, []);

  const resolveAccessibility = (item: BusinessAccessibilityItem) =>
    masterList?.find((m) => Number(m.accessibility_id) === Number(item.id)) ?? null;

  /* SHARE */
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("No se pudo copiar enlace");
    }
  };

  /* ADD REVIEW */
  const addReview = () => {
    if (newReview.trim().length === 0) return;
    setReviews((s) => [...s, { text: newReview.trim(), rating: newRating }]);
    setNewReview("");
    setNewRating(5);
  };

  return (
    <div className="local-details-container" role="main">
      <button className="volver-btn" onClick={() => navigate(-1)} aria-label="Volver">
        ← Volver
      </button>

      {loading && <div className="loading">Cargando...</div>}
      {error && <div className="error">{error}</div>}

      {data && (
        <>
          {/* header area */}
          <header className="local-details-header" aria-labelledby="local-name">
            <div className="local-details-main-icon" aria-hidden>
              {/* if you want an actual image instead of icon, replace with <img> */}
              {data.logo_url ? (
                <img
                  src={data.logo_url}
                  alt={`${data.business_name} logo`}
                  style={{ width: 140, height: 110, objectFit: "cover", borderRadius: 12 }}
                />
              ) : (
                <Accessibility size={72} />
              )}
            </div>

            <div>
              <h1 id="local-name" className="local-details-name">{data.business_name}</h1>
              <div style={{ marginTop: 8 }}>
                {typeof data.average_rating !== "undefined" ? (
                  <StarRating rating={Number(data.average_rating) || 0} />
                ) : (
                  <div style={{ color: "#6b7280" }}>Sin calificación</div>
                )}
              </div>
              {data.address && <div className="muted" style={{ marginTop: 6 }}>{data.address}</div>}
            </div>

            {/* action buttons */}
            <div className="local-details-buttons" style={{ marginTop: 16 }}>
              <a
                className="local-details-btn"
                href={`https://www.google.com/maps?q=${encodeURIComponent(data.coordinates || `${data.latitude},${data.longitude}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                <MapPin size={16} /> Ver en Google Maps
              </a>

              <a
                className="local-details-btn"
                href={data.phone ? `tel:${data.phone}` : undefined}
                aria-disabled={!data.phone}
                style={{ opacity: data.phone ? 1 : 0.6 }}
              >
                <Phone size={16} /> {data.phone || "Sin teléfono"}
              </a>

              <button className="local-details-btn" onClick={handleShare}>
                <Share2 size={16} /> Compartir
              </button>
            </div>

            {copied && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                <CheckCircle size={16} color="#14b8a6" /> Link copiado
              </div>
            )}
          </header>

          {/* main content */}
          <section className="main-content" style={{ marginTop: 24 }}>
            {/* left column: description + accesibility */}
            <div className="left-column">
              <div className="card descripcion-card">
                <h2>Descripción</h2>
                <p style={{ color: "#6b7280" }}>{data.description || "Sin descripción disponible"}</p>
              </div>

              {Array.isArray(data.business_accessibility) && data.business_accessibility.length > 0 && (
                <div className="card accesibilidad-card" style={{ marginTop: 18 }}>
                  <h2>Accesibilidad</h2>

                  <div className="accessibility-grid" aria-live="polite">
                    {data.business_accessibility
                      .map(resolveAccessibility)
                      .filter(Boolean)
                      .map((item) => (
                        <div
                          key={item!.accessibility_id}
                          className="accessibility-icon-wrapper"
                          data-label={item!.description || item!.accessibility_name}
                          tabIndex={0}
                          role="button"
                          aria-label={item!.accessibility_name}
                          title={item!.accessibility_name}
                        >
                          {/* Icono grande */}
                          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                            {React.cloneElement(iconByName(item!.accessibility_name) as any, { size: 34 })}
                          </div>

                          {/* Nombre */}
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#062244" }}>
                            {item!.accessibility_name}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* right column: mapa */}
            <aside className="right-column">
              <div className="card mapa-card">
                <h2>Ubicación</h2>

                {(() => {
                  let lat = data.latitude;
                  let lon = data.longitude;

                  if ((!lat || !lon) && data.coordinates) {
                    const parts = data.coordinates.split(",").map((x) => Number(x.trim()));
                    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                      lat = parts[0];
                      lon = parts[1];
                    }
                  }

                  if (!lat || !lon) {
                    return <p className="muted">Coordenadas no disponibles</p>;
                  }

                  return (
                    <div className="map-wrapper" style={{ height: 300, borderRadius: 12, overflow: "hidden" }}>
                      <MapContainer center={[lat, lon]} zoom={16} style={{ height: "100%", width: "100%" }}>
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

          {/* reviews section (at bottom) */}
          <section className="reviews-section" aria-labelledby="reviews-title" style={{ marginTop: 28 }}>
            <h2 id="reviews-title" className="reviews-title"><MessageCircle size={18} /> Reseñas</h2>

            <div className="reviews-list" style={{ marginBottom: 12 }}>
              {reviews.length === 0 ? (
                <p className="no-reviews">Aún no hay reseñas</p>
              ) : (
                reviews.map((r, i) => (
                  <div className="review-item" key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <StarRating rating={r.rating} />
                    </div>
                    <div className="review-text" style={{ marginTop: 8 }}>{r.text}</div>
                  </div>
                ))
              )}
            </div>

            <div className="reviews-input" style={{ display: "grid", gap: 10 }}>
              <label style={{ fontWeight: 600 }}>Calificación</label>
              <select value={newRating} onChange={(e) => setNewRating(Number(e.target.value))} style={{ width: 120, padding: 8, borderRadius: 8 }}>
                <option value={5}>5 ⭐</option>
                <option value={4}>4 ⭐</option>
                <option value={3}>3 ⭐</option>
                <option value={2}>2 ⭐</option>
                <option value={1}>1 ⭐</option>
              </select>

              <textarea
                className="review-textarea"
                placeholder="Escribe tu reseña..."
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
              />

              <div style={{ display: "flex", gap: 8 }}>
                <button className="review-submit-btn" onClick={addReview}>Publicar</button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default LocalDetalle;
