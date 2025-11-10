import React, { useState, useEffect } from 'react';
import { EditUserData, updateUser, getUserForEdit } from '../../services/admin';
import './EditUserModal.css';

interface EditUserModalProps {
  isOpen: boolean;
  userId: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, userId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<EditUserData>({
    id: 0,
    email: '',
    firstName: '',
    firstLastName: '',
    cellphone: '',
    address: '',
    gender: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [hasPersonalInfo, setHasPersonalInfo] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      loadUserData();
    }
  }, [isOpen, userId]);

  const loadUserData = async () => {
    if (!userId) return;
    
    setLoadingUserData(true);
    setError(null);
    
    try {
      const userData = await getUserForEdit(userId);
      if (userData) {
        setFormData(userData);
        // Verificar si el usuario tiene información personal
        const hasPersonData = userData.firstName || userData.firstLastName || userData.cellphone || userData.address || userData.gender;
        setHasPersonalInfo(!!hasPersonData);
      } else {
        setError('No se pudo cargar la información del usuario');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos del usuario');
    } finally {
      setLoadingUserData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Enviando datos de actualización:', formData);
      
      // Si no hay información personal, solo actualizar email
      const dataToUpdate = hasPersonalInfo 
        ? formData 
        : { id: formData.id, email: formData.email };
      
      await updateUser(userId, dataToUpdate);
      console.log('Usuario actualizado exitosamente');
      
      // Cerrar modal y notificar éxito
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error al actualizar usuario:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar usuario');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-user-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✏️ Editar Usuario</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {loadingUserData ? (
          <div className="modal-body">
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Cargando información del usuario...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-body">
            {error && (
              <div className="error-message">
                <span>❌</span>
                {error}
              </div>
            )}

            {!hasPersonalInfo && (
              <div className="info-message">
                <span>ℹ️</span>
                Este usuario no tiene información personal registrada. Solo se puede editar el email.
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Ingrese el email del usuario"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">Nombre {hasPersonalInfo ? '*' : '(No disponible)'}</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required={hasPersonalInfo}
                  disabled={!hasPersonalInfo}
                  placeholder={hasPersonalInfo ? "Nombre" : "Sin información personal"}
                />
              </div>
              <div className="form-group">
                <label htmlFor="firstLastName">Apellido {hasPersonalInfo ? '*' : '(No disponible)'}</label>
                <input
                  type="text"
                  id="firstLastName"
                  name="firstLastName"
                  value={formData.firstLastName}
                  onChange={handleInputChange}
                  required={hasPersonalInfo}
                  disabled={!hasPersonalInfo}
                  placeholder={hasPersonalInfo ? "Apellido" : "Sin información personal"}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="cellphone">Teléfono {!hasPersonalInfo && '(No disponible)'}</label>
              <input
                type="tel"
                id="cellphone"
                name="cellphone"
                value={formData.cellphone}
                onChange={handleInputChange}
                disabled={!hasPersonalInfo}
                placeholder={hasPersonalInfo ? "Número de teléfono" : "Sin información personal"}
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Dirección {!hasPersonalInfo && '(No disponible)'}</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={!hasPersonalInfo}
                placeholder={hasPersonalInfo ? "Dirección de residencia" : "Sin información personal"}
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Género {!hasPersonalInfo && '(No disponible)'}</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                disabled={!hasPersonalInfo}
              >
                <option value="">{hasPersonalInfo ? "Seleccionar género" : "Sin información personal"}</option>
                {hasPersonalInfo && (
                  <>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                    <option value="prefiero-no-decir">Prefiero no decir</option>
                  </>
                )}
              </select>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={onClose} className="btn-cancel">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="btn-save">
                {loading ? (
                  <>
                    <div className="spinner-small"></div>
                    Guardando...
                  </>
                ) : (
                  '💾 Guardar Cambios'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditUserModal;