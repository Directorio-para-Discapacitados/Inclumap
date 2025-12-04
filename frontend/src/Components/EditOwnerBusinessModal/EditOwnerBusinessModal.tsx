import React, { useState, useEffect } from 'react';
import { getUserCompleteInfo, updateBusinessInfo } from '../../services/admin';
import Toast from '../Toast/Toast';
import './EditOwnerBusinessModal.css';

interface BusinessData {
  businessName: string;
  nit: string;
  address: string;
  description: string;
  coordinates: string;
  accessibilityIds: number[];
}

interface AccessibilityOption {
  id: number;
  name: string;
  description: string;
}

interface EditOwnerBusinessModalProps {
  isOpen: boolean;
  businessId: number | null;
  businessName: string;
  userId: number | null; // ID del usuario para obtener información completa
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToPersonal?: () => void; // Función opcional para cambiar al modal personal
}

const EditOwnerBusinessModal: React.FC<EditOwnerBusinessModalProps> = ({
  isOpen,
  businessId,
  businessName,
  userId,
  onClose,
  onSuccess,
  onSwitchToPersonal
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [accessibilityOptions, setAccessibilityOptions] = useState<AccessibilityOption[]>([]);
  const [formData, setFormData] = useState<BusinessData>({
    businessName: businessName || '',
    nit: '',
    address: '',
    description: '',
    coordinates: '0,0',
    accessibilityIds: []
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
    if (isOpen && businessId && userId) {
      loadBusinessData();
      loadAccessibilityOptions();
    }
  }, [isOpen, businessId, userId]);

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!userId) {
        throw new Error('ID de usuario no proporcionado');
      }

      const data = await getUserCompleteInfo(userId);
      
      // Buscar el negocio específico si hay múltiples
      const business = data.businesses?.find((b: any) => b.business_id === businessId) || data.businesses?.[0];
      
      if (business) {
        setFormData({
          businessName: business.business_name || '',
          nit: business.NIT?.toString() || '',
          address: business.address || '',
          description: business.description || '',
          coordinates: business.coordinates || '',
          accessibilityIds: business.accessibilities || []
        });
      } else {
        // Si no hay negocio, usar valores por defecto
        setFormData({
          businessName: businessName || '',
          nit: '',
          address: '',
          description: '',
          coordinates: '',
          accessibilityIds: []
        });
      }
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al cargar los datos del negocio');
    } finally {
      setLoading(false);
    }
  };

  const loadAccessibilityOptions = async () => {
    try {
      // TODO: Cargar opciones de accesibilidad desde el backend
      const mockAccessibilities: AccessibilityOption[] = [
        { id: 1, name: 'Rampa de acceso', description: 'Acceso sin escalones' },
        { id: 2, name: 'Baños adaptados', description: 'Sanitarios accesibles' },
        { id: 3, name: 'Señalización en braille', description: 'Información táctil' },
        { id: 4, name: 'Intérprete de lengua de señas', description: 'Comunicación inclusiva' },
        { id: 5, name: 'Estacionamiento accesible', description: 'Espacios reservados' },
        { id: 6, name: 'Menú en braille', description: 'Carta accesible' }
      ];
      
      setAccessibilityOptions(mockAccessibilities);
    } catch (error) {
      // Error silencioso - usar opciones por defecto
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAccessibilityChange = (accessibilityId: number, isChecked: boolean) => {
    setFormData(prev => ({
      ...prev,
      accessibilityIds: isChecked
        ? [...prev.accessibilityIds, accessibilityId]
        : prev.accessibilityIds.filter(id => id !== accessibilityId)
    }));
  };

  const handleLocationSelector = () => {
    // TODO: Implementar selector de ubicación con mapa
    showToastMessage('🗺️ Selector de ubicación en desarrollo. Por ahora puedes ingresar las coordenadas manualmente.', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;

    // Validaciones
    if (!formData.businessName.trim()) {
      setError('El nombre del negocio es obligatorio');
      return;
    }

    if (!formData.nit.trim()) {
      setError('El NIT es obligatorio');
      return;
    }

    if (!formData.address.trim()) {
      setError('La dirección es obligatoria');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Preparar datos para el backend
      const businessData = {
        business_name: formData.businessName,
        NIT: parseInt(formData.nit), // El backend espera número
        address: formData.address,
        description: formData.description,
        coordinates: formData.coordinates,
        // TODO: Implementar actualización de accessibilityIds cuando esté listo el backend
      };

      await updateBusinessInfo(businessId, businessData);
      
      // Mostrar toast de éxito con animación
      showToastMessage('🏢 ¡Información del negocio actualizada exitosamente!', 'success');
      
      // Esperar un poco para que el usuario vea la notificación antes de cerrar
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al actualizar la información del negocio';
      setError(errorMessage);
      showToastMessage(`❌ Error: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-owner-business-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🏢 Editar Información del Negocio</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading && (
            <div className="loading-message">
              <div className="loading-spinner"></div>
              <p>Cargando información del negocio...</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <span>❌</span>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Sección: Información Básica */}
            <div className="form-section">
              <h3>📋 Información Básica</h3>
              
              <div className="form-group">
                <label htmlFor="businessName">Nombre del Negocio *</label>
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  required
                  placeholder="Nombre comercial del establecimiento"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nit">NIT *</label>
                  <input
                    type="text"
                    id="nit"
                    name="nit"
                    value={formData.nit}
                    onChange={handleInputChange}
                    required
                    placeholder="123456789-0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="coordinates">Coordenadas</label>
                  <div className="location-input">
                    <input
                      type="text"
                      id="coordinates"
                      name="coordinates"
                      value={formData.coordinates}
                      onChange={handleInputChange}
                      placeholder="Latitud, Longitud"
                      readOnly
                    />
                    <button
                      type="button"
                      className="btn-location"
                      onClick={handleLocationSelector}
                      title="Seleccionar en el mapa"
                    >
                      📍
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address">Dirección del Negocio *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  placeholder="Dirección completa del establecimiento"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Descripción</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Describe tu negocio, servicios que ofreces, horarios de atención, etc."
                />
              </div>
            </div>

            {/* Sección: Accesibilidades */}
            <div className="form-section">
              <h3>♿ Servicios de Accesibilidad</h3>
              <p className="section-description">
                Selecciona los servicios de accesibilidad que ofrece tu negocio:
              </p>
              
              <div className="accessibility-grid">
                {accessibilityOptions.map((option) => (
                  <div key={option.id} className="accessibility-option">
                    <label className="accessibility-label">
                      <input
                        type="checkbox"
                        checked={formData.accessibilityIds.includes(option.id)}
                        onChange={(e) => handleAccessibilityChange(option.id, e.target.checked)}
                      />
                      <div className="accessibility-content">
                        <h4>{option.name}</h4>
                        <p>{option.description}</p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
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
              
              {/* Botón para cambiar al modal personal si está disponible */}
              {onSwitchToPersonal && (
                <button 
                  type="button" 
                  className="btn-switch"
                  onClick={onSwitchToPersonal}
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                    color: 'white'
                  }}
                >
                  👤 Editar Personal
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

export default EditOwnerBusinessModal;
