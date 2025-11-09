import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AvatarModal from "../../Components/AvatarModal/AvatarModal";
import Avatar from "../../Components/Avatar/Avatar";
import "./perfil.css";
import { API_URL } from "../../config/api";

type Profile = {
  people_id?: number;
  firstName?: string;
  firstLastName?: string;
  cellphone?: string;
  address?: string;
  gender?: string;
  avatar?: string;
};

type FeedbackMessage = {
  type: "success" | "error";
  text: string;
} | null;

export default function Perfil() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editedProfile, setEditedProfile] = useState<Profile>({});
  const [feedback, setFeedback] = useState<FeedbackMessage>(null);
  const [saving, setSaving] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  // Función para obtener el perfil del backend; la empleamos en useEffect y después de guardar
  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    // Comprobación local de rol (opcional): si el usuario está cargado y no tiene los roles permitidos,
    // evitamos la petición y mostramos un mensaje claro.
    const allowedRoles = [1, 2, 3];
    if (user && Array.isArray(user.rolIds) && !user.rolIds.some(r => allowedRoles.includes(r))) {
      setLoading(false);
      showFeedback('error', 'No tienes permisos para ver este perfil');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/people/my-profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await res.json() : await res.text();

      if (!res.ok) {
        showFeedback("error", (data && (data as any).message) || "Error al obtener perfil");
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
        }
        return;
      }

      setProfile(data as Profile);
      setEditedProfile(data as Profile);
    } catch (error) {
      console.error("Error obteniendo perfil:", error);
      showFeedback("error", "Error al obtener perfil. Verifica la conexión.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleEditToggle = () => {
    if (editMode && profile) {
      setEditedProfile(profile); // Revert changes
    }
    setEditMode(!editMode);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarClick = () => {
    setIsAvatarModalOpen(true);
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    // Actualizar el perfil local con la nueva URL del avatar
    setProfile(prev => prev ? { ...prev, avatar: newAvatarUrl } : null);
    setEditedProfile(prev => ({ ...prev, avatar: newAvatarUrl }));
    
    // El refreshUser() ya se llama desde el AvatarModal
    // Esto actualizará el AuthContext automáticamente
  };

  const handleFileChange = () => {
    // Esta función ya no se usa, pero la mantenemos para evitar errores
    // La funcionalidad se maneja en el AvatarModal
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token || !profile?.people_id) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/people/${profile.people_id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedProfile),
      });

      const contentType = res.headers.get("content-type") || "";
      let data;
      try {
        // Solo intentar parsear como JSON si el content-type es application/json
        data = contentType.includes("application/json") ? await res.json() : await res.text();
      } catch (e) {
        console.error("Error parsing response:", e);
        throw new Error("Error en el formato de respuesta del servidor");
      }

      if (!res.ok) {
        throw new Error(
          typeof data === "string" 
            ? data 
            : (data.message || "Error al actualizar perfil")
        );
      }

      // Actualizar el estado local primero
      setProfile(editedProfile);
      // Forzar recarga del perfil desde el servidor para asegurar persistencia
      await fetchProfile();
      setEditMode(false);
      showFeedback("success", typeof data === "string" ? data : (data.message || "Perfil actualizado exitosamente"));
      // Actualizar el AuthContext si es necesario
      if (typeof data === 'object' && data.firstName) {
        await refreshUser();
      }
    } catch (error) {
      console.error("Error guardando perfil:", error);
      showFeedback("error", error instanceof Error ? error.message : "Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  // El logout se gestiona desde el Navbar (AuthContext). No hay botón de cerrar sesión aquí.

  if (loading) return <div className="perfil-container">Cargando...</div>;

  if (!profile)
    return (
      <div className="perfil-container">
        <h2>Mi Perfil</h2>
        <p>No se encontraron datos de perfil.</p>
        {/* No mostrar botón de cerrar sesión aquí; usar el Navbar */}
      </div>
    );

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <div className="perfil-avatar-container">
          <Avatar
            src={user?.avatar || profile.avatar}
            alt="Avatar"
            size="large"
            className="perfil-avatar"
            onClick={handleAvatarClick}
          />
          <div className="avatar-overlay">
            📷 Cambiar foto
          </div>
        </div>
        <div className="perfil-info">
          <h2>Mi Perfil</h2>
          {!editMode && (
            <p>Información personal y preferencias</p>
          )}
        </div>
      </div>

      <div className="perfil-grid">
        <div className="campo-perfil">
          <label>Nombre</label>
          {editMode ? (
            <input
              name="firstName"
              value={editedProfile.firstName || ""}
              onChange={handleInputChange}
              placeholder="Tu nombre"
            />
          ) : (
            <div>{profile.firstName}</div>
          )}
        </div>

        <div className="campo-perfil">
          <label>Apellido</label>
          {editMode ? (
            <input
              name="firstLastName"
              value={editedProfile.firstLastName || ""}
              onChange={handleInputChange}
              placeholder="Tu apellido"
            />
          ) : (
            <div>{profile.firstLastName}</div>
          )}
        </div>

        <div className="campo-perfil">
          <label>Celular</label>
          {editMode ? (
            <input
              name="cellphone"
              value={editedProfile.cellphone || ""}
              onChange={handleInputChange}
              placeholder="Tu número de celular"
            />
          ) : (
            <div>{profile.cellphone}</div>
          )}
        </div>

        <div className="campo-perfil">
          <label>Dirección</label>
          {editMode ? (
            <input
              name="address"
              value={editedProfile.address || ""}
              onChange={handleInputChange}
              placeholder="Tu dirección"
            />
          ) : (
            <div>{profile.address}</div>
          )}
        </div>

        <div className="campo-perfil">
          <label>Género</label>
          {editMode ? (
            <input
              name="gender"
              value={editedProfile.gender || ""}
              onChange={handleInputChange}
              placeholder="Tu género"
            />
          ) : (
            <div>{profile.gender}</div>
          )}
        </div>
      </div>

      <div className="perfil-actions">
        {editMode ? (
          <>
            <button
              className="btn btn-secondary"
              onClick={handleEditToggle}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={handleEditToggle}>
              Editar perfil
            </button>
            {/* El botón de Cerrar sesión se ha removido de la página de perfil.
                La gestión de sesión se hace desde el Navbar. */}
          </>
        )}
      </div>

      {feedback && (
        <div className={`mensaje-feedback mensaje-${feedback.type}`}>
          {feedback.text}
        </div>
      )}

      {/* Modal de cambio de avatar */}
      <AvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatar={user?.avatar || profile?.avatar}
        onAvatarUpdate={handleAvatarUpdate}
      />
    </div>
  );
}
