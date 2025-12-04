import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { API_URL, api } from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import { recordBusinessView } from "../../services/ownerStatistics";
import { LoadingSpinner } from "../../Components/LoadingSpinner/LoadingSpinner";
import "./LocalDetalle.css";

import Swal from "sweetalert2";

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
  accessibility_id?: number;
  accessibility_name?: string;
  description?: string;
  accessibility?: AccessibilityMaster;
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
  business_categories?: { category_id: number; category_name: string }[];
  images?: { id: number; url: string }[];
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

/* ============================
   Nuevo: Componentes de estrellas
   - RatingStars: solo visual (valor decimal permitido)
   - RatingStarsSelector: editable con hover, keyboard y onChange
   Ambos usan iconos Lucide y color dorado (#f5b50a)
   ============================ */

/* Props */
interface RatingStarsProps {
  value: number; // 0..5 (puede ser decimal)
  size?: number; // tamaño en px
  className?: string;
}

/* Visualizador de estrellas (full / half / empty) */
const RatingStars: React.FC<RatingStarsProps> = ({ value, size = 18, className = "" }) => {
  const full = Math.floor(value);
  const half = value % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <div className={`rating-stars-container ${className}`} aria-hidden>
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f-${i}`} className="rating-star filled" size={size} />
      ))}
      {half && <StarHalf className="rating-star filled" size={size} />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e-${i}`} className="rating-star empty" size={size} />
      ))}
    </div>
  );
};

/* Selector de estrellas (editable) */
interface RatingStarsSelectorProps {
  value: number;
  onChange: (v: number) => void;
  size?: number;
  className?: string;
  ariaLabel?: string;
}

const RatingStarsSelector: React.FC<RatingStarsSelectorProps> = ({
  value,
  onChange,
  size = 22,
  className = "",
  ariaLabel = "Selecciona calificación",
}) => {
  const [hover, setHover] = useState<number | null>(null);

  const display = hover ?? value;

  const handleKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChange(idx);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.max(1, value - 1));
    }
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.min(5, value + 1));
    }
  };

  return (
    <div
      className={`rating-stars-selector ${className}`}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const idx = i + 1;
        const active = idx <= display;
        return (
          <button
            key={idx}
            type="button"
            className={`rating-star-btn ${active ? "active" : ""}`}
            onMouseEnter={() => setHover(idx)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(idx)}
            onBlur={() => setHover(null)}
            onClick={() => onChange(idx)}
            onKeyDown={(e) => handleKey(e, idx)}
            aria-checked={value === idx}
            role="radio"
            title={`${idx} de 5`}
            style={{ background: "transparent", border: "none", padding: 4, cursor: "pointer" }}
          >
            <Star
              className={`rating-star ${active ? "filled" : "empty"}`}
              size={size}
            />
          </button>
        );
      })}
    </div>
  );
};

/* ============================
   Fin: Componentes de estrellas
   ============================ */

/* LocalDetalle component (modificado para usar los nuevos componentes) */
const LocalDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  /* Estados */
  const [data, setData] = useState<LocalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [masterList, setMasterList] = useState<AccessibilityMaster[] | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewCategory, setReviewCategory] = useState("access");
  const [editing, setEditing] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  
  // Ref para evitar registros duplicados de visitas
  const viewRegisteredRef = useRef(false);

  const { user, isAuthenticated } = useAuth();
  const token = localStorage.getItem("token");
  const userId = user?.user_id;

  /* Función de navegación inteligente */
  const handleBack = () => {
    const from = location.state?.from;
    
    if (from === 'negocios-page') {
      // Si vino de la página de todos los negocios, volver allá
      navigate('/negocios');
    } else if (from === 'inicio-businesses') {
      // Si vino de la sección de negocios en inicio, volver allí
      navigate('/', { state: { scrollTo: 'businesses-section' } });
    } else if (from === 'inicio-hero') {
      // Si vino del hero de inicio, volver al inicio
      navigate('/');
    } else {
      // Default: usar el historial del navegador
      navigate(-1);
    }
  };

  /* Cargar info del local */
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        const resp = await fetch(`${API_URL}/business/public/${id}`);
        const json = await resp.json();
        setData(json);

        // Registrar vista del negocio SOLO UNA VEZ y SOLO si el usuario NO es propietario (rol 3)
        const isNotOwner = !user?.rolIds?.includes(3);
        if (json?.business_id && !viewRegisteredRef.current && isNotOwner) {
          viewRegisteredRef.current = true;
          recordBusinessView(json.business_id).catch(() => {
            // Error silencioso - no afecta la experiencia del usuario
          });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user?.rolIds]);

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
  }, [token]);

  /* Cargar reseñas */
  useEffect(() => {
    if (!id) return;
    const loadReviews = async () => {
      try {
        const res = await api.get(`/reviews/business/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const reviewsData = res.data || [];
        setReviews(reviewsData);
        
        // Cargar likes para cada reseña
        if (reviewsData.length > 0) {
          const likesPromises = reviewsData.map(async (review: any) => {
            try {
              const likesRes = await api.get(`/reviews/${review.review_id}/likes-count`);
              
              // Si el usuario está logueado, verificar si ha dado like
              let userHasLiked = false;
              if (token) {
                try {
                  const likedRes = await api.get(`/reviews/${review.review_id}/user-liked`, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  userHasLiked = likedRes.data.liked || false;
                } catch {
                  userHasLiked = false;
                }
              }
              
              return {
                review_id: review.review_id,
                likes_count: likesRes.data.count || 0,
                user_has_liked: userHasLiked
              };
            } catch {
              return {
                review_id: review.review_id,
                likes_count: 0,
                user_has_liked: false
              };
            }
          });
          
          const likesData = await Promise.all(likesPromises);
          
          // Actualizar las reseñas con los datos de likes
          const updatedReviews = reviewsData.map((review: any) => {
            const likeData = likesData.find(l => l.review_id === review.review_id);
            return {
              ...review,
              likes_count: likeData?.likes_count || 0,
              user_has_liked: likeData?.user_has_liked || false
            };
          });
          
          setReviews(updatedReviews);
        }
      } catch {
        Swal.fire({
          title: "Error",
          text: "No se pudieron cargar las reseñas.",
          icon: "error",
          customClass: {
            popup: "my-swal-dark",
            title: "my-swal-title",
            htmlContainer: "my-swal-text",
          },
        });
      }
    };
    loadReviews();
  }, [id, token]);

  useEffect(() => {
    if (!data || !userId) return;

    const key = `saved_places_${userId}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        setIsFavorite(false);
        return;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setIsFavorite(false);
        return;
      }

      const index = parsed.findIndex(
        (p: any) => Number(p.business_id) === Number(data.business_id)
      );

      if (index >= 0) {
        setIsFavorite(true);
        const current = parsed[index] || {};
        parsed[index] = {
          ...current,
          business_id: data.business_id,
          business_name: data.business_name,
          address: data.address,
          logo_url: data.logo_url,
          average_rating: data.average_rating,
        };
        localStorage.setItem(key, JSON.stringify(parsed));
      } else {
        setIsFavorite(false);
      }
    } catch {
      setIsFavorite(false);
    }
  }, [data, userId]);

  const myReview = reviews.find((r) => r.user?.user_id === userId);

  const resolveAccessibility = (item: BusinessAccessibilityItem) => {
    // Si el item ya tiene los datos de accesibilidad directamente
    if (item.accessibility_name) {
      return {
        accessibility_id: item.accessibility_id || item.id,
        accessibility_name: item.accessibility_name,
        description: item.description || "",
      };
    }

    // Si el item tiene la accesibilidad anidada
    if (item.accessibility) {
      return {
        accessibility_id: item.accessibility.accessibility_id,
        accessibility_name: item.accessibility.accessibility_name,
        description: item.accessibility.description,
      };
    }

    // Si tiene accessibility_id, buscar en masterList
    if (item.accessibility_id) {
      return (
        masterList?.find(
          (m) => Number(m.accessibility_id) === Number(item.accessibility_id)
        ) ?? null
      );
    }

    // Fallback: buscar por el id
    return (
      masterList?.find((m) => Number(m.accessibility_id) === Number(item.id)) ?? null
    );
  };

  /* Compartir */
  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateFavoriteAverage = (newAverage: number | null) => {
    if (!userId || !data) return;
    const key = `saved_places_${userId}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const index = parsed.findIndex(
        (p: any) => Number(p.business_id) === Number(data.business_id)
      );
      if (index === -1) return;
      const current = parsed[index] || {};
      parsed[index] = {
        ...current,
        average_rating: newAverage ?? undefined,
      };
      localStorage.setItem(key, JSON.stringify(parsed));
    } catch {}
  };

  const handleOpenImage = (url: string) => {
    setSelectedImage(url);
  };

  const handleCloseImage = () => {
    setSelectedImage(null);
  };

  const handlePrevImage = () => {
    if (!data?.images) return;
    setCarouselIndex((prevIndex) =>
      prevIndex === 0 ? data.images!.length - 1 : prevIndex - 1
    );
  };

  const handleNextImage = () => {
    if (!data?.images) return;
    setCarouselIndex((prevIndex) =>
      prevIndex === data.images!.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleThumbnailClick = (index: number) => {
    setCarouselIndex(index);
  };

  const applyNewAverageFromReviews = (reviewsArray: any[]) => {
    if (!Array.isArray(reviewsArray) || reviewsArray.length === 0) {
      setData((prev) => (prev ? { ...prev, average_rating: undefined } : prev));
      updateFavoriteAverage(null);
      return;
    }
    const sum = reviewsArray.reduce(
      (acc, r) => acc + Number(r.rating || 0),
      0
    );
    const avg = sum / reviewsArray.length;
    setData((prev) => (prev ? { ...prev, average_rating: avg } : prev));
    updateFavoriteAverage(avg);
  };

  const handleToggleFavorite = () => {
    if (!data) return;

    if (!isAuthenticated || !userId) {
      navigate("/login");
      return;
    }

    const key = `saved_places_${userId}`;
    try {
      const raw = localStorage.getItem(key);
      let list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];
      const index = list.findIndex(
        (p: any) => Number(p.business_id) === Number(data.business_id)
      );
      if (index >= 0) {
        list.splice(index, 1);
        setIsFavorite(false);
      } else {
        const item = {
          business_id: data.business_id,
          business_name: data.business_name,
          address: data.address,
          logo_url: data.logo_url,
          average_rating: data.average_rating,
        };
        list.push(item);
        setIsFavorite(true);
      }
      localStorage.setItem(key, JSON.stringify(list));
    } catch {}
  };

  /* Crear reseña */
  const handleCreateReview = async () => {
    if (!token)
      return Swal.fire({
        title: "Inicia sesión",
        text: "Debes iniciar sesión para reseñar.",
        icon: "info",
        customClass: {
          popup: "my-swal-dark",
          title: "my-swal-title",
          htmlContainer: "my-swal-text",
        },
      });

    if (myReview)
      return Swal.fire({
        title: "Ya tienes una reseña",
        text: "Solo puedes dejar una reseña por local.",
        icon: "warning",
        customClass: {
          popup: "my-swal-dark",
          title: "my-swal-title",
          htmlContainer: "my-swal-text",
        },
      });

    if (!rating)
      return Swal.fire({
        title: "Falta calificación",
        text: "Selecciona una cantidad de estrellas.",
        icon: "warning",
        customClass: {
          popup: "my-swal-dark",
          title: "my-swal-title",
          htmlContainer: "my-swal-text",
        },
      });

    try {
      await api.post(
        "/reviews",
        { rating, comment, category: reviewCategory, business_id: Number(id) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await Swal.fire({
        title: "¡Listo!",
        text: "¡ Tu reseña fue publicada !",
        icon: "success",
        confirmButtonText: 'OK',
        confirmButtonColor: '#4CAF50',
        allowOutsideClick: false,
        allowEscapeKey: true,
        customClass: {
          popup: "my-swal-dark",
          title: "my-swal-title",
          htmlContainer: "my-swal-text",
        },
      });

      setRating(0);
      setComment("");
      setReviewCategory("access");

      const res = await api.get(`/reviews/business/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setReviews(res.data);
      applyNewAverageFromReviews(res.data);
    } catch (e: any) {
      Swal.fire({
        title: "Error",
        text: e?.response?.data?.message || "No se pudo enviar la reseña.",
        icon: "error",
        customClass: {
          popup: "my-swal-dark",
          title: "my-swal-title",
          htmlContainer: "my-swal-text",
        },
      });
    }
  };

  /* Eliminar reseña */
  const handleDeleteReview = async (reviewId: number) => {
    if (!token)
      return Swal.fire(
        "Inicia sesión",
        "Debes iniciar sesión para eliminar reseñas.",
        "info"
      );

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
      applyNewAverageFromReviews(res.data);
    } catch {
      Swal.fire("Error", "No se pudo eliminar la reseña.", "error");
    }
  };

  /* Dar/Quitar Like a una reseña */
  const handleLikeReview = async (reviewId: number) => {
    if (!token) {
      return Swal.fire(
        "Inicia sesión",
        "Debes iniciar sesión para dar me gusta.",
        "info"
      );
    }

    try {
      await api.post(`/reviews/${reviewId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Actualizar la lista de reseñas para reflejar el cambio
      const reviewsRes = await api.get(`/reviews/business/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const reviewsData = reviewsRes.data || [];
      
      // Cargar likes actualizados para cada reseña
      if (reviewsData.length > 0) {
        const likesPromises = reviewsData.map(async (review: any) => {
          try {
            const likesRes = await api.get(`/reviews/${review.review_id}/likes-count`);
            
            // Verificar si el usuario ha dado like
            let userHasLiked = false;
            if (token) {
              try {
                const likedRes = await api.get(`/reviews/${review.review_id}/user-liked`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                userHasLiked = likedRes.data.liked || false;
              } catch {
                userHasLiked = false;
              }
            }
            
            return {
              review_id: review.review_id,
              likes_count: likesRes.data.count || 0,
              user_has_liked: userHasLiked
            };
          } catch {
            return {
              review_id: review.review_id,
              likes_count: 0,
              user_has_liked: false
            };
          }
        });
        
        const likesData = await Promise.all(likesPromises);
        
        // Actualizar las reseñas con los datos de likes
        const updatedReviews = reviewsData.map((review: any) => {
          const likeData = likesData.find(l => l.review_id === review.review_id);
          return {
            ...review,
            likes_count: likeData?.likes_count || 0,
            user_has_liked: likeData?.user_has_liked || false
          };
        });
        
        setReviews(updatedReviews);
      }
    } catch (error) {

      Swal.fire("Error", "No se pudo procesar tu reacción.", "error");
    }
  };

  /* Reportar respuesta del propietario */
  const handleReportOwnerReply = async (reviewId: number) => {
    if (!token) {
      return Swal.fire(
        "Inicia sesión",
        "Debes iniciar sesión para reportar.",
        "info"
      );
    }

    const confirm = await Swal.fire({
      title: "¿Reportar esta respuesta?",
      text: "La respuesta del propietario será revisada por un administrador.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, reportar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    // Pedir la razón del reporte
    const reasonResult = await Swal.fire({
      title: 'Razón del reporte',
      text: 'Por favor, explica por qué estás reportando esta respuesta',
      input: 'textarea',
      inputPlaceholder: 'Describe la razón del reporte (mínimo 10 caracteres)',
      showCancelButton: true,
      confirmButtonText: 'Reportar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'La razón es requerida';
        }
        if (value.length < 10) {
          return 'La razón debe tener al menos 10 caracteres';
        }
        if (value.length > 500) {
          return 'La razón no puede exceder 500 caracteres';
        }
        return null;
      }
    });

    if (!reasonResult.isConfirmed || !reasonResult.value) return;

    try {
      await api.post(
        `/reviews/reports`,
        {
          review_id: reviewId,
          reason: reasonResult.value
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({
        icon: "success",
        title: "Reporte enviado",
        text: "La respuesta está en revisión. Recibirás una notificación cuando sea evaluada.",
        timer: 3000,
      });

      // Recargar reseñas
      const res = await api.get(`/reviews/business/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews(res.data);
    } catch (error: any) {
      const message = error?.response?.data?.message || "No se pudo enviar el reporte.";
      Swal.fire("Error", message, "error");
    }
  };

  /* Reportar reseña de otro usuario */
  const handleReportReview = async (reviewId: number) => {
    if (!token) {
      return Swal.fire(
        "Inicia sesión",
        "Debes iniciar sesión para reportar.",
        "info"
      );
    }

    const confirm = await Swal.fire({
      title: "¿Reportar esta reseña?",
      text: "La reseña será revisada por un administrador.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, reportar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    // Pedir la razón del reporte
    const reasonResult = await Swal.fire({
      title: 'Razón del reporte',
      text: 'Por favor, explica por qué estás reportando esta reseña',
      input: 'textarea',
      inputPlaceholder: 'Describe la razón del reporte (mínimo 10 caracteres)',
      showCancelButton: true,
      confirmButtonText: 'Reportar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'La razón es requerida';
        }
        if (value.length < 10) {
          return 'La razón debe tener al menos 10 caracteres';
        }
        if (value.length > 500) {
          return 'La razón no puede exceder 500 caracteres';
        }
        return null;
      }
    });

    if (!reasonResult.isConfirmed || !reasonResult.value) return;

    try {
      await api.post(
        `/reviews/reports`,
        {
          review_id: reviewId,
          reason: reasonResult.value
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({
        icon: "success",
        title: "Reporte enviado",
        text: "La reseña está en revisión. Recibirás una notificación cuando sea evaluada.",
        timer: 3000,
      });

      // Recargar reseñas
      const res = await api.get(`/reviews/business/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews(res.data);
    } catch (error: any) {
      const message = error?.response?.data?.message || "No se pudo enviar el reporte.";
      Swal.fire("Error", message, "error");
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
      applyNewAverageFromReviews(res.data);
    } catch {
      Swal.fire("Error", "No se pudo actualizar la reseña.", "error");
    }
  };

  return (
    <div className="local-details-container">
      {loading && <LoadingSpinner message="Guardando reseña..." size="small" />}

      {data && (
        <>
          {/* BOTÓN VOLVER EN SUPERIOR IZQUIERDA */}
          <button className="volver-btn" onClick={handleBack}>
            Volver
          </button>

          {/* HEADER */}
          <header className="local-details-header">
            <div className="local-details-main-icon">
              {data.logo_url ? (
                <img src={data.logo_url} alt="logo" className="local-details-image" />
              ) : (
                <Accessibility size={72} />
              )}
            </div>

            <div>
              <h1 className="local-details-name">{data.business_name}</h1>

              {data.average_rating ? (
                <RatingStars value={Number(data.average_rating)} size={18} />
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

              <button
                className={`local-details-btn favorite-btn ${
                  isFavorite ? "is-favorite" : ""
                }`}
                type="button"
                onClick={handleToggleFavorite}
              >
                <Star size={16} />
                {isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
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

              {Array.isArray(data.images) && data.images.length > 0 && (
                <div className="card galeria-card">
                  <h2>Galería</h2>
                  
                  {/* Carrusel */}
                  <div className="carousel-container">
                    {/* Imagen principal */}
                    <div className="carousel-main">
                      <img
                        src={data.images[carouselIndex]?.url}
                        alt={`Foto ${carouselIndex + 1}`}
                        className="carousel-main-image"
                        onClick={() => handleOpenImage(data.images[carouselIndex]?.url)}
                      />
                      
                      {/* Botones de navegación */}
                      <button
                        className="carousel-nav-btn carousel-prev"
                        onClick={handlePrevImage}
                        title="Imagen anterior"
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>
                      
                      <button
                        className="carousel-nav-btn carousel-next"
                        onClick={handleNextImage}
                        title="Siguiente imagen"
                      >
                        <i className="fas fa-chevron-right"></i>
                      </button>
                      
                      {/* Indicador de progreso */}
                      <div className="carousel-counter">
                        {carouselIndex + 1} / {data.images.length}
                      </div>
                    </div>
                    
                    {/* Miniaturas */}
                    {data.images.length > 1 && (
                      <div className="carousel-thumbnails">
                        {data.images.map((img, index) => (
                          <button
                            key={img.id}
                            className={`carousel-thumbnail ${index === carouselIndex ? 'active' : ''}`}
                            onClick={() => handleThumbnailClick(index)}
                            title={`Ir a foto ${index + 1}`}
                          >
                            <img src={img.url} alt={`Miniatura ${index + 1}`} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Categorías */}
              {Array.isArray(data.business_categories) &&
                data.business_categories.length > 0 && (
                  <div className="card categorias-card">
                    <h2>Categorías</h2>
                    <div className="categorias-container">
                      {data.business_categories.map((cat) => (
                        <span key={cat.category_id} className="categoria-tag">
                          {cat.category_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

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
                          <div
                            key={item!.accessibility_id}
                            className="accessibility-icon-wrapper"
                            onClick={() => navigate(`/accesibilidad/${item!.accessibility_id}`)}
                            style={{ cursor: "pointer" }}
                          >
                            {React.cloneElement(iconByName(item!.accessibility_name) as any, {
                              size: 34,
                            })}

                            <div className="accessibility-label">{item!.accessibility_name}</div>
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

                  if (!lat || !lon) return <p className="muted">Coordenadas no disponibles</p>;

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
                <RatingStarsSelector value={rating} onChange={(v) => setRating(v)} />

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
              </div>
            )}

            {/* Listado */}
            <div className="reviews-list">
              {reviews.length === 0 ? (
                <p>No hay reseñas aún.</p>
              ) : (
                reviews.map((r) => {
                  const firstName = r.user?.people?.firstName || 'Usuario';
                  const lastName = r.user?.people?.firstLastName || '';
                  const avatar = r.user?.people?.avatar;
                  const initials = `${firstName.charAt(0)}${lastName.charAt(0) || firstName.charAt(1) || ''}`;
                  const likesCount = r.likes_count || 0;
                  
                  return (
                  <div key={r.review_id} className="review-item">
                    <div className="review-header">
                      <div className="review-user-info">
                        {avatar ? (
                          <img 
                            src={avatar} 
                            alt={`${firstName} ${lastName}`}
                            className="review-user-avatar"
                          />
                        ) : (
                          <div className="review-user-avatar-initials">
                            {initials.toUpperCase()}
                          </div>
                        )}
                        <div className="review-user-details">
                          <span className="review-user-name">{firstName} {lastName}</span>
                          <RatingStars value={r.rating} size={16} />
                        </div>
                      </div>
                    </div>

                    <p className="review-text">{r.comment}</p>

                    {r.owner_reply && (
                      <div className="owner-reply-public">
                        <div className="owner-reply-public-header">
                          <span className="owner-reply-public-label">Respuesta del propietario</span>
                          {token && !r.owner_reply_reported && (
                            <button
                              className="report-owner-reply-btn"
                              onClick={() => handleReportOwnerReply(r.review_id)}
                              title="Reportar respuesta del propietario"
                            >
                              🚩 Reportar
                            </button>
                          )}
                          {r.owner_reply_reported && (
                            <span className="owner-reply-reported-badge" title="Respuesta reportada en revisión">
                              ⏳ En revisión
                            </span>
                          )}
                        </div>
                        <p className="owner-reply-public-text">{r.owner_reply}</p>
                      </div>
                    )}

                    <div className="review-meta">
                      <small>{new Date(r.created_at).toLocaleDateString()}</small>

                      <div className="review-actions-container">
                        {userId === r.user.user_id ? (
                          <div className="review-actions">
                            <button
                              className="review-action-btn review-edit-btn"
                              onClick={() => setEditing({ ...r })}
                            >
                              Editar mi reseña
                            </button>
                            <button
                              className="review-action-btn review-delete-btn"
                              onClick={() => handleDeleteReview(r.review_id)}
                            >
                              Eliminar
                            </button>
                          </div>
                        ) : (
                          <div className="review-actions">
                            {/* Botón de Like */}
                            <button
                              className={`review-action-btn review-like-btn ${r.user_has_liked ? 'liked' : ''}`}
                              onClick={() => handleLikeReview(r.review_id)}
                              title={r.user_has_liked ? "Quitar like" : "Me gusta"}
                            >
                              {r.user_has_liked ? '💛' : '🤍'} Me gusta ({likesCount})
                            </button>
                            
                            {/* Botón de Reportar */}
                            {token && !r.review_reported_by_owner && (
                              <button
                                className="review-action-btn report-review-btn"
                                onClick={() => handleReportReview(r.review_id)}
                                title="Reportar reseña"
                              >
                                🚩 Reportar
                              </button>
                            )}
                          </div>
                        )}
                        
                        {r.review_reported_by_owner && userId !== r.user.user_id && (
                          <span className="owner-reply-reported-badge" title="Reseña reportada en revisión">
                            ⏳ En revisión
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>

            {/* Modal edición */}
            {editing && (
              <div className="modal-overlay">
                <div className="modal">
                  <h3>Editar reseña</h3>

                  <RatingStarsSelector
                    value={editing.rating}
                    onChange={(v) => setEditing({ ...editing, rating: v })}
                  />

                  <textarea
                    className="review-textarea"
                    value={editing.comment}
                    onChange={(e) => setEditing({ ...editing, comment: e.target.value })}
                  />

                  <div className="review-modal-actions">
                    <button className="review-submit-btn" onClick={handleSaveEdit}>
                      Guardar cambios
                    </button>

                    <button className="review-cancel-btn" onClick={() => setEditing(null)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </>
      )}
      {selectedImage && (
        <div className="local-image-modal-overlay" onClick={handleCloseImage}>
          <div
            className="local-image-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={selectedImage} alt={data?.business_name || "Imagen"} />
            <button
              type="button"
              className="local-image-modal-close"
              onClick={handleCloseImage}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocalDetalle;
