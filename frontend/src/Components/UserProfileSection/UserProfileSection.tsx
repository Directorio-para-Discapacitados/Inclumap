import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AvatarModal from "../AvatarModal/AvatarModal";
import Avatar from "../Avatar/Avatar";
import { API_URL, api } from "../../config/api";
import "./UserProfileSection.css";

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

export default function UserProfileSection() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editedProfile, setEditedProfile] = useState<Profile>({});
  const [feedback, setFeedback] = useState<FeedbackMessage>(null);
  const [saving, setSaving] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  // Función para obtener el perfil del backend
  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const allowedRoles = [1, 2, 3];
    if (user && Array.isArray(user.rolIds) && !user.rolIds.some(r => allowedRoles.includes(r))) {
      setLoading(false);
      showFeedback('error', 'No tienes permisos para ver este perfil');
      return;
    }

    try {
      const res = await api.get('/people/my-profile');
      setProfile(res.data as Profile);
      setEditedProfile(res.data as Profile);
      
      // Refrescar el contexto de autenticación para sincronizar el avatar en el Navbar
      await refreshUser();
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        // El interceptor manejará esto automáticamente
        return;
      }
      showFeedback("error", error.response?.data?.message || "Error al obtener perfil. Verifica la conexión.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleEditToggle = () => {
    if (editMode && profile) {
      setEditedProfile(profile);
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

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch(`${API_URL}/people/my-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editedProfile)
      });

      if (!res.ok) {
        const errorData = await res.json();
        showFeedback("error", errorData.message || "Error al guardar perfil");
        return;
      }

      setProfile(editedProfile);
      setEditMode(false);
      showFeedback("success", "Perfil actualizado exitosamente");
      await refreshUser();
    } catch (error) {
      showFeedback("error", "Error al guardar perfil. Verifica la conexión.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="user-profile-loading">
        <div className="loading-spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="user-profile-error">
        <h3>Error al cargar el perfil</h3>
        <p>No se pudo obtener la información del perfil.</p>
      </div>
    );
  }

  return (
    <div className="user-profile-section">
      <div className="profile-section-header">
        <h3>Perfil de Usuario</h3>
        <p>Gestiona tu información personal y preferencias de cuenta</p>
      </div>

      {feedback && (
        <div className={`feedback-message ${feedback.type}`}>
          {feedback.text}
        </div>
      )}

      <div className="profile-content">
        <div className="profile-avatar-section">
          <div className="avatar-container">
            <Avatar 
              key={profile.avatar || 'default'} 
              src={profile.avatar} 
              alt={`${profile.firstName} ${profile.firstLastName}`}
              size={120}
            />
            <button 
              className="change-avatar-btn"
              onClick={() => setIsAvatarModalOpen(true)}
            >
              Cambiar foto
            </button>
          </div>
        </div>

        <div className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">Nombre</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={editedProfile.firstName || ''}
                onChange={handleInputChange}
                disabled={!editMode}
                placeholder="Ingresa tu nombre"
              />
            </div>
            <div className="form-group">
              <label htmlFor="firstLastName">Apellido</label>
              <input
                type="text"
                id="firstLastName"
                name="firstLastName"
                value={editedProfile.firstLastName || ''}
                onChange={handleInputChange}
                disabled={!editMode}
                placeholder="Ingresa tu apellido"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cellphone">Teléfono</label>
              <input
                type="tel"
                id="cellphone"
                name="cellphone"
                value={editedProfile.cellphone || ''}
                onChange={handleInputChange}
                disabled={!editMode}
                placeholder="Ingresa tu teléfono"
              />
            </div>
            <div className="form-group">
              <label htmlFor="gender">Género</label>
              <input
                type="text"
                id="gender"
                name="gender"
                value={editedProfile.gender || ''}
                onChange={handleInputChange}
                disabled={!editMode}
                placeholder="Ingresa tu género"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Dirección</label>
            <input
              type="text"
              id="address"
              name="address"
              value={editedProfile.address || ''}
              onChange={handleInputChange}
              disabled={!editMode}
              placeholder="Ingresa tu dirección"
            />
          </div>

          <div className="form-actions">
            {!editMode ? (
              <button className="btn-primary" onClick={handleEditToggle}>
                ✏️ Editar Perfil
              </button>
            ) : (
              <>
                <button className="btn-secondary" onClick={handleEditToggle}>
                  Cancelar
                </button>
                <button 
                  className="btn-primary" 
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {isAvatarModalOpen && (
        <AvatarModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          currentAvatar={profile.avatar}
          onAvatarUpdate={fetchProfile}
        />
      )}
    </div>
  );
}