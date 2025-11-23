import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../config/api";
import RecentReviews from "../../Components/OwnerDashboard/RecentReviews";
import { getBusinessStatistics, BusinessStatistics } from "../../services/ownerStatistics";
import "./reviews.css";

export default function OwnerBusinessReviewsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [businessId, setBusinessId] = useState<number | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<BusinessStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.user_id) {
        setError("No hay sesión activa");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Obtener el negocio asociado al propietario
        const businessResp = await api.get(`/user/${user.user_id}/business`);
        const business = businessResp.data;

        if (!business?.business_id) {
          setError("No tienes un negocio asignado");
          setLoading(false);
          return;
        }

        setBusinessId(business.business_id);
        setBusinessName(business.business_name || null);

        // Reutilizar las estadísticas para obtener el listado de reseñas del negocio
        const stats = await getBusinessStatistics(business.business_id);
        setStatistics(stats);
        setError(null);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Error al cargar las reseñas");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.user_id]);

  if (loading) {
    return (
      <div style={{ maxWidth: 960, margin: "2rem auto", textAlign: "center" }}>
        <p>Cargando reseñas...</p>
      </div>
    );
  }

  if (error || !businessId || !statistics) {
    return (
      <div style={{ maxWidth: 960, margin: "2rem auto", textAlign: "center" }}>
        <button
          type="button"
          className="ownerBackBtn"
          onClick={() => navigate(-1)}
          style={{
            marginBottom: "1rem",
            padding: "0.5rem 1.1rem",
            borderRadius: "999px",
            border: "1px solid rgba(148,163,184,0.7)",
            background: "#ffffff",
            color: "#374151",
            fontSize: "0.9rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            cursor: "pointer",
            boxShadow: "0 6px 18px rgba(15,23,42,0.12)",
          }}
        >
          ← Volver al panel
        </button>
        <p>{error || "No se pudieron cargar las reseñas"}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: "2rem auto" }}>
      <button
        type="button"
        className="ownerBackBtn"
        onClick={() => navigate(-1)}
        style={{
          marginBottom: "1rem",
          padding: "0.5rem 1.1rem",
          borderRadius: "999px",
          border: "1px solid rgba(148,163,184,0.7)",
          background: "#ffffff",
          color: "#374151",
          fontSize: "0.9rem",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
          cursor: "pointer",
          boxShadow: "0 6px 18px rgba(15,23,42,0.12)",
        }}
      >
        ← Volver
      </button>

      <h2 style={{ marginBottom: "1rem" }}>
        Todas las reseñas de {businessName || "tu local"}
      </h2>

      {/* Mostrar todas las reseñas disponibles (sin límite) y sin botón "Ver todas" */}
      <RecentReviews
        reviews={statistics.recentReviews}
        businessId={businessId}
        showViewAllButton={false}
      />
    </div>
  );
}
