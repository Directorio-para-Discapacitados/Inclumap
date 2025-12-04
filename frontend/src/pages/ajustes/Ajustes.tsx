// frontend/src/pages/ajustes/Ajustes.tsx

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './Ajustes.css';
import { 
  changeUserPassword, 
  requestPasswordReset, 
  verifyResetCode, 
  resetPassword 
} from '../../config/auth';

// --- NUEVA CONSTANTE REGEX ---
const uppercaseRegex = /(?=.*[A-Z])/;

const AjustesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.rolIds?.includes(1);
  const [showSecuritySection, setShowSecuritySection] = useState(false);

  // Estados formulario principal
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Estados del modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [resetCode, setResetCode] = useState('');
  const [modalNewPassword, setModalNewPassword] = useState('');
  
  // Estados de feedback
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Formulario principal
  const handleSubmitChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones de Frontend
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    // --- NUEVA VALIDACIÓN AÑADIDA ---
    if (!uppercaseRegex.test(newPassword)) {
      setError('La nueva contraseña debe contener al menos una mayúscula.');
      return;
    }
    if (currentPassword === newPassword) {
      setError('La nueva contraseña no puede ser igual a la actual.');
      return;
    }
    
    setLoading(true);
    // ... (el resto de la función sigue igual)
    setError('');
    setMessage('');
    const token = localStorage.getItem('token');
    try {
      if (!token) throw new Error('No estás autenticado.');
      await changeUserPassword({ currentPassword, newPassword }, token);
      setMessage('¡Contraseña actualizada con éxito!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal (Paso 1)
  const handleForgotPassword = async () => {
    // ... (esta función sigue igual)
    if (!user?.email) { 
      setError('No se pudo encontrar tu email de usuario.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await requestPasswordReset(user.email);
      handleCancel();
      setMessage('Se ha enviado un código de reseteo a tu correo.');
      setShowResetModal(true); 
      setModalStep(1);
    } catch (err: any) {
      setError(err.message || 'Error al solicitar el reseteo.');
    } finally {
      setLoading(false);
    }
  };

  // Manejador del Paso 1 del Modal (Verificar Código)
  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    // ... (esta función sigue igual, con el delay)
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await verifyResetCode(resetCode);
      
      setTimeout(() => {
        setLoading(false);
        setModalStep(2);
        setMessage('Código verificado. Ahora crea tu nueva contraseña.');
      }, 2500);
      
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Código inválido o expirado');
    }
  };

  // Manejador del Paso 2 del Modal (Nueva Contraseña)
  const handleNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones de Frontend
    if (modalNewPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    // --- NUEVA VALIDACIÓN AÑADIDA ---
    if (!uppercaseRegex.test(modalNewPassword)) {
      setError('La nueva contraseña debe contener al menos una mayúscula.');
      return;
    }

    setLoading(true);
    // ... (el resto de la función sigue igual)
    setError('');
    setMessage('');

    try {
      await resetPassword(resetCode, modalNewPassword);
      setLoading(false);
      setMessage('¡Tu contraseña ha sido reseteada con éxito!');
      handleCloseModal();
      
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Error al resetear la contraseña.');
    }
  };

  const handleCancel = () => {
    // ... (esta función sigue igual)
    setCurrentPassword('');
    setNewPassword('');
    setError('');
    setMessage('');
  };
  
  const handleCloseModal = () => {
    // ... (esta función sigue igual)
    setShowResetModal(false);
    setModalStep(1);
    setResetCode('');
    setModalNewPassword('');
    setError(''); 
  }

  return (
    <div className="ajustes-page">
   
      <div className="ajustes-header">
        <div className="header-title-row">
          <button 
            className="back-button-ajustes"
            onClick={() => navigate('/')}
          >
            <span>←</span>
            Volver
          </button>
          <h1 className="page-title-ajustes">⚙️ Ajustes y Configuración</h1>
        </div>
        <p className="page-subtitle">Gestiona tu cuenta y preferencias del sistema</p>
      </div>

      <div className="ajustes-container">
        {isAdmin ? (
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
                </div>
                <div className="card-arrow">→</div>
              </Link>

              <Link to="/admin/gestion-propietarios" className="admin-card propietarios-card">
                <div className="card-icon-wrapper">
                  <span className="card-icon">🏢</span>
                </div>
                <div className="card-content">
                  <h3>Gestión de Propietarios</h3>
                </div>
                <div className="card-arrow">→</div>
              </Link>
            </div>
          </div>
        ) : (
          <div className="user-settings-wrapper">
            {/* TARJETA DE PERFIL */}
            <div className="user-profile-card">
              <div className="profile-header">
                <div className="profile-avatar">
                  <div className="avatar-circle">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.displayName || 'Usuario'} className="avatar-image" />
                    ) : (
                      <span className="avatar-text">
                        {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="profile-info">
                  <h2 className="profile-name">
                    {user?.displayName || 'Usuario'}
                  </h2>
                  <p className="profile-email">{user?.email}</p>
                  <div className="profile-badge">
                    <span className="badge-icon">🎖️</span>
                    <span className="badge-text">{user?.roleDescription || 'Usuario'}</span>
                  </div>
                </div>
              </div>
              
              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-icon">📅</span>
                  <div className="stat-content">
                    <span className="stat-label">Miembro desde</span>
                    <span className="stat-value">
                      {user?.created_at 
                        ? new Date(user.created_at).toLocaleDateString('es-ES', { 
                            day: 'numeric',
                            year: 'numeric', 
                            month: 'long' 
                          })
                        : 'No disponible'
                      }
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">🔐</span>
                  <div className="stat-content">
                    <span className="stat-label">Estado de cuenta</span>
                    <span className="stat-value status-active">Activa</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN DE SEGURIDAD */}
            <div className="security-section">
              <div 
                className="security-header"
                onClick={() => setShowSecuritySection(!showSecuritySection)}
              >
                 <div className="security-icon-wrapper">
                  <span className="security-icon">🔒</span>
                </div>
                <div className="security-content">
                  <h3>Seguridad</h3>
                  <p>Gestiona tu contraseña y configuración de seguridad</p>
                </div>
                <div className={`security-arrow ${showSecuritySection ? 'expanded' : ''}`}>
                  ▼
                </div>
              </div>
              
              {showSecuritySection && (
                <div className="security-options">
                  <div className="security-option">
                    <div className="option-header">
                      <div className="option-icon">🔑</div>
                      <div className="option-content">
                        <h4>Cambiar contraseña</h4>
                        <p>Actualiza tu contraseña para mantener tu cuenta segura</p>
                      </div>
                    </div>
                    
                    <form className="password-change-form" onSubmit={handleSubmitChangePassword}>
                      <div className="form-group">
                        <label htmlFor="current-password">Contraseña actual</label>
                        <input 
                          type="password" 
                          id="current-password" 
                          placeholder="Ingresa tu contraseña actual"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          disabled={loading && !showResetModal}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="new-password">Nueva contraseña</label>
                        <input 
                          type="password" 
                          id="new-password" 
                          placeholder="Mínimo 6 caracteres, 1 mayúscula"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          disabled={loading && !showResetModal}
                        />
                      </div>
                      
                      {!showResetModal && message && <p className="success-message">{message}</p>}
                      {!showResetModal && error && <p className="error-message">{error}</p>}

                      <div className="form-actions">
                        <a
                          href="#"
                          className="forgot-password-link"
                          onClick={(e) => { e.preventDefault(); handleForgotPassword(); }}
                          style={{ pointerEvents: (loading && !showResetModal) ? 'none' : 'auto' }}
                        >
                          ¿Olvidaste tu contraseña actual?
                        </a>
                        
                        <div className="form-actions-buttons">
                          <button 
                            type="button" 
                            className="btn-cancel" 
                            onClick={handleCancel}
                            disabled={loading && !showResetModal}
                          >
                            Cancelar
                          </button>
                          <button 
                            type="submit" 
                            className="btn-save"
                            disabled={loading && !showResetModal}
                          >
                            {(loading && !showResetModal) ? 'Actualizando...' : 'Actualizar contraseña'}
                          </button>
                        </div>
                      </div>

                    </form>

                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- Modal (Paso 1) --- */}
      {showResetModal && (
        <div className="reset-modal-backdrop" onClick={handleCloseModal}>
          <div className="reset-modal-content" onClick={(e) => e.stopPropagation()}>
            
            {modalStep === 1 && (
              <form onSubmit={handleVerifyCodeSubmit} className="reset-modal-form">
                <h3>Restablecer Contraseña</h3>
                <p>Se ha enviado un código a tu correo. Ingrésalo para continuar.</p>
                
                <div className="form-group">
                  <label htmlFor="reset-code">Código de verificación</label>
                  <input
                    type="text"
                    id="reset-code"
                    placeholder="Ingresa el código"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}

                <div className="form-actions-buttons">
                  <button 
                    type="button" 
                    className="btn-cancel" 
                    onClick={handleCloseModal}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn-save"
                    disabled={loading}
                  >
                    {loading ? 'Verificando...' : 'Verificar Código'}
                  </button>
                </div>
              </form>
            )}

            {/* --- Modal (Paso 2) --- */}
            {modalStep === 2 && (
              <form onSubmit={handleNewPasswordSubmit} className="reset-modal-form">
                <h3>Crear Nueva Contraseña</h3>
                <p>Código verificado. Por favor, ingresa tu nueva contraseña.</p>

                <div className="form-group">
                  <label htmlFor="new-reset-password">Nueva Contraseña</label>
                  <input
                    type="password"
                    id="new-reset-password"
                    placeholder="Mínimo 6 caracteres, 1 mayúscula"
                    value={modalNewPassword}
                    onChange={(e) => setModalNewPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}

                <div className="form-actions-buttons">
                  <button 
                    type="button" 
                    className="btn-cancel" 
                    onClick={handleCloseModal}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn-save"
                    disabled={loading}
                  >
                    {loading ? 'Guardando...' : 'Restablecer Contraseña'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default AjustesPage;
