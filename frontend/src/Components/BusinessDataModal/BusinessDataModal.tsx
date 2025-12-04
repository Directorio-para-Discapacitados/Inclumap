import React, { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { createBusinessAsAdmin, changeUserRole } from '../../services/admin';
import { getAllCategories, Category } from '../../services/categoryService';
import CategoryMultiSelect from '../CategoryMultiSelect/CategoryMultiSelect';
import LocationPicker from '../../pages/LocationPicker/LocationPicker';
import './BusinessDataModal.css';

interface BusinessDataModalProps {
  isOpen: boolean;
  userId: number | null;
  userName: string;
  onClose: () => void;
  onSuccess: () => void;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

interface BusinessFormData {
  business_name: string;
  address: string;
  NIT: string;
  description: string;
  coordinates: string;
  accessibilityIds: number[];
  categoryIds: number[];
}

const accesibilidades = [
  { id: 1, nombre: "Rampa", desc: "Rampa para sillas de ruedas" },
  { id: 2, nombre: "Baño Adaptado", desc: "Baño con barras y espacio suficiente" },
  { id: 3, nombre: "Parqueadero", desc: "Espacio reservado para discapacitados" },
  { id: 4, nombre: "Puertas anchas", desc: "Puertas de mínimo 80 cm de ancho" },
  { id: 5, nombre: "Circulación interior", desc: "Pasillos amplios y sin obstáculos" },
  { id: 6, nombre: "Ascensor", desc: "Ascensor con señalización accesible" },
  { id: 7, nombre: "Pisos seguros", desc: "Superficie firme y antideslizante" },
  { id: 8, nombre: "Barras de apoyo", desc: "Espacios con barras laterales" },
  { id: 9, nombre: "Lavamanos accesible", desc: "Altura adecuada para silla de ruedas" },
  { id: 10, nombre: "Mostrador accesible", desc: "Puntos de atención a menor altura" },
  { id: 11, nombre: "Señalización SIA", desc: "Símbolo internacional de accesibilidad" },
  { id: 12, nombre: "Braille/táctil", desc: "Letreros en Braille o relieve" },
];

const BusinessDataModal: React.FC<BusinessDataModalProps> = ({ 
  isOpen, 
  userId, 
  userName, 
  onClose, 
  onSuccess,
  onShowToast
}) => {
  const [formData, setFormData] = useState<BusinessFormData>({
    business_name: '',
    address: '',
    NIT: '',
    description: '',
    coordinates: '0,0',
    accessibilityIds: [],
    categoryIds: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Obtener coordenadas del usuario
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setFormData(prev => ({
              ...prev,
              coordinates: `${latitude},${longitude}`
            }));
          },
          () => {
            setFormData(prev => ({
              ...prev,
              coordinates: '0,0'
            }));
          }
        );
      }
      // Cargar categorías
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (err) {

    } finally {
      setLoadingCategories(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAccessibilityChange = (id: number) => {
    setFormData(prev => ({
      ...prev,
      accessibilityIds: prev.accessibilityIds.includes(id)
        ? prev.accessibilityIds.filter(aid => aid !== id)
        : [...prev.accessibilityIds, id]
    }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCategoryChange = (categoryIds: number[]) => {
    setFormData(prev => ({
      ...prev,
      categoryIds
    }));
  };

  const handleMapClick = () => {
    setShowMapPicker(true);
  };

  const handleCoordinatesChange = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      coordinates: `${lat},${lng}`
    }));
    setShowMapPicker(false);
  };

  const handleLocationConfirm = (lat: number, lng: number, address?: string) => {
    setFormData(prev => ({
      ...prev,
      coordinates: `${lat},${lng}`,
      address: address || prev.address
    }));
    setShowMapPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const payload = {
        business_name: formData.business_name,
        address: formData.address,
        NIT: formData.NIT,
        description: formData.description,
        coordinates: formData.coordinates,
        accessibilityIds: formData.accessibilityIds,
        categoryIds: formData.categoryIds,
        user_id: userId
      };

      // Validar que todos los campos requeridos estén presentes
      if (!payload.business_name || !payload.address || !payload.NIT || !payload.user_id) {
        throw new Error('Faltan datos obligatorios del negocio');
      }

      
      // Usar función de admin que tiene los permisos necesarios
      const result = await createBusinessAsAdmin(payload);

      // DESPUÉS de crear el negocio exitosamente, cambiar el rol a Propietario (ID: 3)
      try {
        await changeUserRole(userId, 3);
      } catch (roleError) {

        // No lanzar error aquí, el negocio ya fue creado exitosamente
      }

      // Emitir evento personalizado para notificar que se creó un nuevo negocio
      window.dispatchEvent(new CustomEvent('businessCreated', { 
        detail: { 
          result: result, 
          businessName: formData.business_name,
          userId: userId 
        } 
      }));

      if (onShowToast) {
        onShowToast(`✅ Negocio "${formData.business_name}" creado exitosamente`, 'success');
      }
      
      onSuccess();
      onClose();
      
      // Resetear form
      setFormData({
        business_name: '',
        address: '',
        NIT: '',
        description: '',
        coordinates: '0,0',
        accessibilityIds: [],
        categoryIds: []
      });
      setStep(1);
    } catch (err) {
      let errorMessage = 'Error al crear el negocio';
      
      if (err instanceof Error) {
        if (err.message.includes('Error de conexión')) {
          errorMessage = 'No se puede conectar al servidor';
        } else if (err.message.includes('Forbidden') || err.message.includes('403')) {
          errorMessage = 'Sin permisos para crear negocio';
        } else if (err.message.includes('No estás autenticado')) {
          errorMessage = 'Sesión expirada. Inicia sesión nuevamente';
        } else {
          errorMessage = err.message;
        }
      }
      
      if (onShowToast) {
        onShowToast(errorMessage, 'error');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Función de diagnóstico temporal para verificar el flujo
  const testBusinessCreation = async () => {
    if (!userId) {
      return;
    }

    const testPayload = {
      business_name: "Negocio de Prueba Admin",
      address: "Dirección de prueba 123",
      NIT: "123456789", // Como string
      description: "Negocio creado por admin para pruebas",
      coordinates: "4.7110,-74.0721",
      accessibilityIds: [1, 2],
      categoryIds: [1],
      user_id: userId
    };

    try {
      const result = await createBusinessAsAdmin(testPayload);
      alert('✅ Prueba exitosa! Negocio creado correctamente.');
    } catch (error) {
      alert('❌ Prueba falló: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="business-data-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🏢 Datos del Negocio</h2>
          <div className="header-buttons">
            <button 
              type="button" 
              onClick={testBusinessCreation}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                marginRight: '8px'
              }}
              title="Prueba rápida de creación de negocio"
            >
              🧪 Test
            </button>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="modal-body">
          <div className="business-info">
            <div className="promotion-message">
              <span className="promotion-icon">🎉</span>
              <div>
                <h3>¡Felicidades {userName}!</h3>
                <p>Has sido promovido a <strong>Propietario</strong>. Para completar tu perfil, necesitamos los datos de tu negocio.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="error-message">
                <span>❌</span>
                {error}
              </div>
            )}

            {/* Paso 1: Datos básicos del negocio */}
            {step === 1 && (
              <div className="step-content">
                <h4>📋 Información Básica del Negocio</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="business_name">Nombre del Negocio *</label>
                    <input
                      type="text"
                      id="business_name"
                      name="business_name"
                      value={formData.business_name}
                      onChange={handleInputChange}
                      required
                      placeholder="Ej: Restaurante El Buen Sabor"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="NIT">NIT *</label>
                    <input
                      type="number"
                      id="NIT"
                      name="NIT"
                      value={formData.NIT}
                      onChange={handleInputChange}
                      required
                      placeholder="Ej: 900123456"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="address">Dirección del Negocio *</label>
                  <p className="field-hint">Escribe la dirección o selecciónala en el mapa</p>
                  <div className="location-input-group">
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      placeholder="Ej: Calle 123 #45-67, Barrio Centro"
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
                  <label htmlFor="description">Descripción del Negocio *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    placeholder="Describe tu negocio, servicios que ofreces, especialidades, etc."
                    maxLength={255}
                  />
                  <div className="character-counter">
                    <span className={formData.description.length > 255 ? 'counter-exceeded' : ''}>
                      {formData.description.length}/255 caracteres
                    </span>
                  </div>
                </div>

                <div className="step-buttons">
                  <button type="button" onClick={onClose} className="btn-cancel">
                    Cancelar
                  </button>
                  <button type="button" onClick={handleNext} className="btn-next">
                    Siguiente →
                  </button>
                </div>
              </div>
            )}

            {/* Paso 2: Categorías y Localización */}
            {step === 2 && (
              <div className="step-content">
                <h4>🏷️ Categorías y Ubicación</h4>
                
                <div className="form-group">
                  <label>Categorías del Negocio *</label>
                  <p className="field-hint">Selecciona las categorías que mejor describan tu negocio</p>
                  {loadingCategories ? (
                    <div className="loading-inline">Cargando categorías...</div>
                  ) : (
                    <CategoryMultiSelect
                      categories={categories}
                      selectedCategoryIds={formData.categoryIds}
                      onChange={handleCategoryChange}
                    />
                  )}
                </div>

                <div className="step-buttons">
                  <button type="button" onClick={handlePrev} className="btn-prev">
                    ← Atrás
                  </button>
                  <button type="button" onClick={handleNext} className="btn-next">
                    Siguiente →
                  </button>
                </div>
              </div>
            )}

            {/* Paso 3: Accesibilidad */}
            {step === 3 && (
              <div className="step-content">
                <h4>♿ Características de Accesibilidad</h4>
                <p className="accessibility-subtitle">
                  Selecciona las características de accesibilidad que tiene tu negocio:
                </p>

                <div className="accessibility-grid">
                  {accesibilidades.map((item) => (
                    <div
                      key={item.id}
                      className={`accessibility-option ${
                        formData.accessibilityIds.includes(item.id) ? 'selected' : ''
                      }`}
                      onClick={() => handleAccessibilityChange(item.id)}
                    >
                      <span className="accessibility-name">{item.nombre}</span>
                      <div className="tooltip-wrapper">
                        <HelpCircle className="help-icon" size={16} />
                        <span className="tooltip-text">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="step-buttons">
                  <button type="button" onClick={handlePrev} className="btn-prev">
                    ← Atrás
                  </button>
                  <button type="submit" disabled={loading || formData.categoryIds.length === 0} className="btn-create">
                    {loading ? (
                      <>
                        <div className="spinner-small"></div>
                        Creando...
                      </>
                    ) : (
                      '🏢 Crear Negocio'
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Map Modal Overlay */}
      {showMapPicker && (
        <LocationPicker 
          initialLat={formData.coordinates ? parseFloat(formData.coordinates.split(',')[0]) : 0}
          initialLng={formData.coordinates ? parseFloat(formData.coordinates.split(',')[1]) : 0}
          onConfirm={handleLocationConfirm}
          onCancel={() => setShowMapPicker(false)}
        />
      )}
    </div>
  );
};

export default BusinessDataModal;
