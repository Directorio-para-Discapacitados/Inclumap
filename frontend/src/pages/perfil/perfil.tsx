import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ProfileSidebar from "../../Components/ProfileSidebar/ProfileSidebar";
import UserProfileSection from "../../Components/UserProfileSection/UserProfileSection";
import OwnerBusinessProfile from "../../Components/OwnerBusinessProfile/OwnerBusinessProfile";
import "./perfil.css";

export default function Perfil() {
  const [searchParams] = useSearchParams();
  const sectionParam = searchParams.get('section');
  const [activeSection, setActiveSection] = useState(sectionParam || 'user-profile');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Actualizar la sección activa cuando cambia el parámetro de query
  useEffect(() => {
    if (sectionParam) {
      setActiveSection(sectionParam);
    }
  }, [sectionParam]);

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
    if (activeSection === 'owner-profile' && user?.roleDescription === 'Propietario') {
      return <OwnerBusinessProfile />;
    }
    return <UserProfileSection />;
  };

  return (
    <div className="perfil-page">
      <div className="perfil-container">
        <div className="perfil-header">
          <div className="header-title-row">
            <button 
              className="back-button"
              onClick={() => navigate('/')}
            >
              <span>←</span>
              Volver
            </button>
            <div className="header-content">
              <h1>Configuración de Perfil</h1>
            </div>
          </div>
          <p className="header-subtitle">Gestiona tu cuenta y preferencias del sistema</p>
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
