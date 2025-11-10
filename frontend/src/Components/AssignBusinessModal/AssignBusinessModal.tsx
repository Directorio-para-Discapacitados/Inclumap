import React, { useState, useEffect } from 'react';
import { obtenerNegociosDisponibles, asignarNegocioAPropietario } from '../../services/owner.service';
import Toast from '../Toast/Toast';
import './AssignBusinessModal.css';

interface Business {
  business_id: number;
  business_name: string;
  description: string;
  address: string;
  coordinates: string;
}

interface AssignBusinessModalProps {
  isOpen: boolean;
  userId: number;
  userEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AssignBusinessModal: React.FC<AssignBusinessModalProps> = ({
  isOpen,
  userId,
  userEmail,
  onClose,
  onSuccess
}) => {
  const [availableBusinesses, setAvailableBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Estados para Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // Helper para mostrar Toast
  const showToastMessage = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // Cargar negocios disponibles al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadAvailableBusinesses();
    }
  }, [isOpen]);

  const loadAvailableBusinesses = async () => {
    try {
      setLoading(true);
      const businesses = await obtenerNegociosDisponibles();
      setAvailableBusinesses(businesses);
    } catch (error) {
      console.error('Error al cargar negocios:', error);
      showToastMessage('Error al cargar negocios disponibles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessSelect = (businessId: number) => {
    setSelectedBusinessId(businessId);
    const business = availableBusinesses.find(b => b.business_id === businessId);
    setSelectedBusiness(business || null);
  };

  const handleConfirmSelection = () => {
    if (selectedBusiness) {
      setShowConfirmation(true);
    }
  };

  const handleFinalConfirm = async () => {
    if (!selectedBusinessId || !selectedBusiness) return;

    try {
      setLoading(true);
      await asignarNegocioAPropietario(selectedBusinessId, userId);
      
      showToastMessage(
        `🎉 ¡Negocio "${selectedBusiness.business_name}" asignado exitosamente a ${userEmail}!`,
        'success'
      );

      setTimeout(() => {
        setShowConfirmation(false);
        onSuccess();
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error al asignar negocio:', error);
      showToastMessage(
        `❌ Error al asignar negocio: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setSelectedBusinessId(null);
    setSelectedBusiness(null);
  };

  const handleClose = () => {
    handleCancel();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay">
        <div className="assign-business-modal">
          {!showConfirmation ? (
            <>
              <div className="modal-header">
                <h2>🏢 Asignar Negocio</h2>
                <button className="close-button" onClick={handleClose}>×</button>
              </div>

              <div className="modal-body">
                <div className="user-info">
                  <p><strong>Usuario:</strong> {userEmail}</p>
                  <p><strong>ID:</strong> {userId}</p>
                </div>

                <div className="business-selection">
                  <h3>Negocios Disponibles:</h3>
                  
                  {loading && <div className="loading">Cargando negocios...</div>}
                  
                  {!loading && availableBusinesses.length === 0 && (
                    <div className="no-businesses">
                      ℹ️ No hay negocios disponibles sin propietario
                    </div>
                  )}

                  {!loading && availableBusinesses.length > 0 && (
                    <div className="business-dropdown">
                      <select
                        value={selectedBusinessId || ''}
                        onChange={(e) => handleBusinessSelect(Number(e.target.value))}
                        className="business-select"
                      >
                        <option value="">-- Selecciona un negocio --</option>
                        {availableBusinesses.map((business) => (
                          <option key={business.business_id} value={business.business_id}>
                            {business.business_name} - {business.address}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {selectedBusiness && (
                  <div className="business-preview">
                    <h4>📋 Vista previa del negocio:</h4>
                    <div className="business-card">
                      <h5>{selectedBusiness.business_name}</h5>
                      <p><strong>Dirección:</strong> {selectedBusiness.address}</p>
                      <p><strong>Descripción:</strong> {selectedBusiness.description}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn-cancel" onClick={handleClose}>
                  Cancelar
                </button>
                <button 
                  className="btn-confirm" 
                  onClick={handleConfirmSelection}
                  disabled={!selectedBusinessId || loading}
                >
                  Continuar
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="modal-header">
                <h2>⚠️ Confirmar Asignación</h2>
                <button className="close-button" onClick={handleClose}>×</button>
              </div>

              <div className="modal-body">
                <div className="confirmation-content">
                  <h3>¿Estás seguro de asignar este negocio?</h3>
                  
                  {selectedBusiness && (
                    <div className="confirmation-details">
                      <div className="detail-row">
                        <strong>Usuario:</strong> {userEmail}
                      </div>
                      <div className="detail-row">
                        <strong>Negocio:</strong> {selectedBusiness.business_name}
                      </div>
                      <div className="detail-row">
                        <strong>Dirección:</strong> {selectedBusiness.address}
                      </div>
                      <div className="business-description">
                        <strong>Descripción del negocio:</strong>
                        <p>{selectedBusiness.description}</p>
                      </div>
                    </div>
                  )}

                  <div className="warning-notice">
                    <p>⚠️ Esta acción:</p>
                    <ul>
                      <li>Asignará al usuario como propietario del negocio</li>
                      <li>Le otorgará rol de "Propietario" automáticamente</li>
                      <li>El usuario aparecerá en "Gestión de Propietarios"</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-cancel" onClick={handleCancel} disabled={loading}>
                  Cancelar
                </button>
                <button 
                  className="btn-confirm" 
                  onClick={handleFinalConfirm}
                  disabled={loading}
                >
                  {loading ? 'Asignando...' : '✅ Confirmar Asignación'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
};

export default AssignBusinessModal;