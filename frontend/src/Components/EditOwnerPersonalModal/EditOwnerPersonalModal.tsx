import React, { useState, useEffect } from 'react';
import { getUserCompleteInfo, updatePeopleInfo, updateUserEmail } from '../../services/admin';
import Toast from '../Toast/Toast';
import './EditOwnerPersonalModal.css';

interface PersonalData {
  firstName: string;
  firstLastName: string;
  cellphone: string;
  address: string;
  gender: string;
  email: string;
  changePassword: boolean;
  newPassword: string;
  confirmPassword: string;
}

interface EditOwnerPersonalModalProps {
  isOpen: boolean;
  userId: number | null;
  userName: string;
  userEmail: string;
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToBusiness?: () => void; // Función opcional para cambiar al modal de negocio
}

const EditOwnerPersonalModal: React.FC<EditOwnerPersonalModalProps> = ({
  isOpen,
  userId,
  userName,
  userEmail,
  onClose,
  onSuccess,
  onSwitchToBusiness
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peopleId, setPeopleId] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [formData, setFormData] = useState<PersonalData>({
    firstName: '',
    firstLastName: '',
    cellphone: '',
    address: '',
    gender: '',
    email: userEmail || '',
    changePassword: false,
    newPassword: '',
    confirmPassword: ''
  });

  // Función helper para mostrar toast
  const showToastMessage = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const closeToast = () => {
    setShowToast(false);
  };

  // Cargar datos existentes cuando se abre el modal
  useEffect(() => {
    if (isOpen && userId) {
      loadUserData();
    }
  }, [isOpen, userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!userId) {
        throw new Error('ID de usuario no proporcionado');
      }

      const data = await getUserCompleteInfo(userId);
      
      // Guardar el peopleId para las actualizaciones (usar userId si no hay peopleId)
      if (data.people?.people_id) {
        setPeopleId(data.people.people_id);
      } else {
        setPeopleId(userId); // Usar userId como fallback
      }
      
      // Llenar el formulario con los datos existentes
      setFormData({
        firstName: data.people?.firstName || '',
        firstLastName: data.people?.firstLastName || '',
        cellphone: data.people?.cellphone || '',
        address: data.people?.address || '',
        gender: data.people?.gender || '',
        email: data.user?.user_email || userEmail || '',
        changePassword: false,
        newPassword: '',
        confirmPassword: ''
      });
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al cargar los datos del usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    // Validaciones
    if (!formData.firstName.trim() || !formData.firstLastName.trim()) {
      setError('El nombre y apellido son obligatorios');
      return;
    }

    if (!formData.email.trim()) {
      setError('El email es obligatorio');
      return;
    }

    if (formData.changePassword) {
      if (formData.newPassword.length < 6) {
        setError('La nueva contraseña debe tener al menos 6 caracteres');
        return;
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Actualizar información personal (people) usando userId
      if (userId) {
        const peopleData = {
          firstName: formData.firstName,
          firstLastName: formData.firstLastName,
          cellphone: formData.cellphone,
          address: formData.address,
          gender: formData.gender
        };
        
        await updatePeopleInfo(userId, peopleData);
      }

      // 2. Actualizar email del usuario si cambió
      if (formData.email !== userEmail) {
        const userData: any = {
          user_email: formData.email
        };
        
        // 3. Incluir cambio de contraseña si se solicitó
        if (formData.changePassword && formData.newPassword) {
          userData.user_password = formData.newPassword;
        }
        
        await updateUserEmail(userId, userData);
      } else if (formData.changePassword && formData.newPassword) {
        // Solo cambio de contraseña
        await updateUserEmail(userId, { user_password: formData.newPassword });
      }
      
      // Mostrar toast de éxito con animación
      showToastMessage('🎉 ¡Información personal actualizada exitosamente!', 'success');
      
      // Esperar un poco para que el usuario vea la notificación antes de cerrar
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al actualizar la información';
      setError(errorMessage);
      showToastMessage(`❌ Error: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-owner-personal-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👤 Editar Información Personal</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading && (
            <div className="loading-message">
              <div className="loading-spinner"></div>
              <p>Cargando información...</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <span>❌</span>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Sección: Datos Personales */}
            <div className="form-section">
              <h3>📝 Datos Personales</h3>
              
              <div className="form-group">
                <label htmlFor="firstName">Nombre *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  placeholder="Ingrese el nombre"
                />
              </div>

              <div className="form-group">
                <label htmlFor="firstLastName">Apellido *</label>
                <input
                  type="text"
                  id="firstLastName"
                  name="firstLastName"
                  value={formData.firstLastName}
                  onChange={handleInputChange}
                  required
                  placeholder="Ingrese el apellido"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cellphone">Teléfono</label>
                  <input
                    type="tel"
                    id="cellphone"
                    name="cellphone"
                    value={formData.cellphone}
                    onChange={handleInputChange}
                    placeholder="+57 300 123 4567"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gender">Género</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                    <option value="prefiero_no_decir">Prefiero no decir</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address">Dirección Personal</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Calle 123 #45-67, Barrio, Ciudad"
                />
              </div>
            </div>

            {/* Sección: Datos de Cuenta */}
            <div className="form-section">
              <h3>📧 Cuenta de Usuario</h3>
              
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="usuario@ejemplo.com"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="changePassword"
                    checked={formData.changePassword}
                    onChange={handleInputChange}
                  />
                  <span>Cambiar contraseña</span>
                </label>
              </div>

              {formData.changePassword && (
                <div className="password-section">
                  <div className="form-group">
                    <label htmlFor="newPassword">Nueva Contraseña *</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder="Mínimo 6 caracteres"
                      required={formData.changePassword}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Repetir la nueva contraseña"
                      required={formData.changePassword}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              
              {/* Botón para cambiar al modal de negocio si está disponible */}
              {onSwitchToBusiness && (
                <button 
                  type="button" 
                  className="btn-switch"
                  onClick={onSwitchToBusiness}
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white'
                  }}
                >
                  🏢 Editar Negocio
                </button>
              )}
              
              <button 
                type="submit" 
                className="btn-save"
                disabled={loading}
              >
                {loading ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Toast de notificación */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={closeToast}
          duration={3000}
        />
      )}
    </div>
  );
};

export default EditOwnerPersonalModal;