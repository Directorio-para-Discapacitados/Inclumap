// frontend/src/pages/ajustes/Ajustes.tsx

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import UserSettings from '../../Components/UserSettings/UserSettings';
import './Ajustes.css';

const AjustesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.rolIds?.includes(1);

  return (
    <div className="ajustes-page">
      <div className="ajustes-header">
        <button 
          className="back-button-ajustes"
          onClick={() => navigate('/')}
        >
          <span>←</span>
          Volver al Inicio
        </button>
        <div className="header-content">
          <h1 className="page-title-ajustes">⚙️ Ajustes y Configuración</h1>
          <p className="page-subtitle">Gestiona tu cuenta y preferencias del sistema</p>
        </div>
      </div>

      <div className="ajustes-container">
        {isAdmin ? (
          // Panel exclusivo para administradores
          <div className="admin-gestion-section">
            <div className="section-header">
              <div className="section-icon">👥</div>
              <div>
                <h2>Panel de Administración</h2>
                <p className="section-description">Gestiona usuarios y propietarios del sistema</p>
              </div>
            </div>
            
            <div className="admin-cards">
              <Link to="/admin/gestion-usuarios" className="admin-card usuarios-card">
                <div className="card-icon-wrapper">
                  <span className="card-icon">👤</span>
                </div>
                <div className="card-content">
                  <h3>Gestión de Usuarios</h3>
                  <p>Administra usuarios regulares del sistema</p>
                  <div className="card-features">
                    <span className="feature-badge">✏️ Editar</span>
                    <span className="feature-badge">🔄 Cambiar Rol</span>
                    <span className="feature-badge">🗑️ Eliminar</span>
                  </div>
                </div>
                <div className="card-arrow">→</div>
              </Link>

              <Link to="/admin/gestion-propietarios" className="admin-card propietarios-card">
                <div className="card-icon-wrapper">
                  <span className="card-icon">🏢</span>
                </div>
                <div className="card-content">
                  <h3>Gestión de Propietarios</h3>
                  <p>Administra propietarios y sus negocios</p>
                  <div className="card-features">
                    <span className="feature-badge">✏️ Editar</span>
                    <span className="feature-badge">🔄 Degradar</span>
                    <span className="feature-badge">🗑️ Eliminar</span>
                  </div>
                </div>
                <div className="card-arrow">→</div>
              </Link>
            </div>

            <div className="admin-stats">
              <div className="stat-item">
                <span className="stat-icon">📊</span>
                <span className="stat-text">Gestión completa de roles y permisos</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🔒</span>
                <span className="stat-text">Acceso exclusivo para administradores</span>
              </div>
            </div>
          </div>
        ) : (
          // Configuración de cuenta para usuarios regulares y propietarios
          <div className="user-settings-wrapper">
            <UserSettings />
          </div>
        )}
      </div>
    </div>
  );
};

export default AjustesPage;