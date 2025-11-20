import React, { useState } from 'react';
import LocationPicker from '../../pages/LocationPicker/LocationPicker';
import './CreateUserModal.css';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

interface CreateUserFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  firstLastName: string;
  cellphone: string;
  address: string;
  gender: string;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onSuccess, onShowToast }) => {
  const [formData, setFormData] = useState<CreateUserFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    firstLastName: '',
    cellphone: '',
    address: '',
    gender: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Scroll al inicio cuando se abre el modal
  React.useEffect(() => {
    if (isOpen) {
      const modalBody = document.querySelector('.create-user-modal .modal-body');
      if (modalBody) {
        modalBody.scrollTop = 0;
      }
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMapClick = () => {
    setShowMapPicker(true);
  };

  const handleLocationConfirm = (lat: number, lng: number, address?: string) => {
    setFormData(prev => ({
      ...prev,
      address: address || prev.address
    }));
    setShowMapPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar contraseñas
    if (formData.password !== formData.confirmPassword) {
      if (onShowToast) {
        onShowToast('Las contraseñas no coinciden', 'error');
      } else {
        setError('Las contraseñas no coinciden');
      }
      return;
    }

    if (formData.password.length < 6) {
      if (onShowToast) {
        onShowToast('La contraseña debe tener al menos 6 caracteres', 'error');
      } else {
        setError('La contraseña debe tener al menos 6 caracteres');
      }
      return;
    }

    setLoading(true);

    try {
      const API_URL = 'http://localhost:9080';
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No estás autenticado');
      }

      // Crear usuario con todos los campos requeridos por el backend
      const userResponse = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_email: formData.email,
          user_password: formData.password,
          firstName: formData.firstName,
          firstLastName: formData.firstLastName,
          cellphone: formData.cellphone || '',
          address: formData.address || '',
          gender: formData.gender || ''
        })
      });

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        throw new Error(`Error al crear usuario: ${errorText}`);
      }

      const userResult = await userResponse.json();
      
      // El backend ya crea la información personal automáticamente
      // No es necesario hacer una segunda llamada

      if (onShowToast) {
        onShowToast(`✅ Usuario "${formData.firstName} ${formData.firstLastName}" creado exitosamente`, 'success');
      }

      // Limpiar formulario
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        firstLastName: '',
        cellphone: '',
        address: '',
        gender: ''
      });

      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear usuario';
      if (onShowToast) {
        onShowToast(errorMessage, 'error');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="create-user-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>➕ Crear Nuevo Usuario</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="error-message">
              <span>❌</span>
              {error}
            </div>
          )}

          <div className="form-section">
            <h4>🔐 Credenciales de Acceso</h4>
            
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Contraseña *</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    placeholder="Repetir contraseña"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>👤 Información Personal</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">Nombre *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  placeholder="Nombre"
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
                  placeholder="Apellido"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="cellphone">Teléfono (opcional)</label>
              <input
                type="tel"
                id="cellphone"
                name="cellphone"
                value={formData.cellphone}
                onChange={handleInputChange}
                placeholder="Número de teléfono"
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Dirección (opcional)</label>
              <div className="location-input-group">
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Dirección de residencia"
                />
                <button 
                  type="button" 
                  onClick={handleMapClick}
                  className="btn-map-small"
                  title="Seleccionar en mapa"
                >
                  📍
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="gender">Género (opcional)</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
              >
                <option value="">Seleccionar género</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
                <option value="prefiero-no-decir">Prefiero no decir</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-create">
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  Creando...
                </>
              ) : (
                '➕ Crear Usuario'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de selección de ubicación */}
      {showMapPicker && (
        <LocationPicker
          initialLat={0}
          initialLng={0}
          onConfirm={handleLocationConfirm}
          onCancel={() => setShowMapPicker(false)}
        />
      )}
    </div>
  );
};

export default CreateUserModal;
