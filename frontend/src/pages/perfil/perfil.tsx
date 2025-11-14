import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ProfileSidebar from "../../Components/ProfileSidebar/ProfileSidebar";
import UserProfileSection from "../../Components/UserProfileSection/UserProfileSection";
import "./perfil.css";

export default function Perfil() {
  const [activeSection, setActiveSection] = useState('user-profile');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Función para obtener el perfil del backend; la empleamos en useEffect y después de guardar
  // Verificar autenticación
  const token = localStorage.getItem("token");
  if (!token) {
    navigate("/login", { replace: true });
    return null;
  }

  // Verificar permisos
  const allowedRoles = [1, 2, 3];
  if (user && Array.isArray(user.rolIds) && !user.rolIds.some(r => allowedRoles.includes(r))) {
    return (
      <div className="perfil-container">
        <div className="error-message">
          <h3>Acceso Denegado</h3>
          <p>No tienes permisos para ver este perfil.</p>
        </div>
      </div>
    );
  }

  const renderActiveSection = () => {
    return <UserProfileSection />;
  };

  return (
    <div className="perfil-page">
      <div className="perfil-container">
        <div className="perfil-header">
          <button 
            className="back-button"
            onClick={() => navigate('/')}
          >
            <span>←</span>
            Volver al Inicio
          </button>
          <div className="header-content">
            <h1>Configuración de Perfil</h1>
            <p>Gestiona tu cuenta y preferencias del sistema</p>
          </div>
        </div>
        
        <div className="perfil-layout">
          <ProfileSidebar 
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
          
          <div className="perfil-content">
            {renderActiveSection()}
          </div>
        </div>
      </div>
    </div>
  );
}
