import React, { useState, useEffect } from 'react';
import { UserRole, changeUserRole, getAllRoles } from '../../services/admin';
import './ChangeRoleModal.css';

interface ChangeRoleModalProps {
  isOpen: boolean;
  userId: number | null;
  currentRole: string;
  userName: string;
  onClose: () => void;
  onSuccess: () => void;
  onPromoteToBusiness?: (userId: number, userName: string) => void; // Nueva prop para manejar promoción a propietario
}

const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({ 
  isOpen, 
  userId, 
  currentRole, 
  userName, 
  onClose, 
  onSuccess,
  onPromoteToBusiness 
}) => {
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadRoles();
    }
  }, [isOpen]);

  const loadRoles = async () => {
    setLoadingRoles(true);
    setError(null);
    
    try {
      const rolesData = await getAllRoles();
      
      // Filtrar para excluir el rol de Admin (ID: 1)
      // Solo permitir Usuario (ID: 2) y Propietario (ID: 3)
      const allowedRoles = rolesData.filter(role => 
        role.id === 2 || role.id === 3 || 
        role.name.toLowerCase() === 'user' || 
        role.name.toLowerCase() === 'propietario'
      );
      
      setRoles(allowedRoles);
      
      // Pre-seleccionar el rol actual si existe en los roles permitidos
      const currentRoleObj = allowedRoles.find(role => 
        role.name.toLowerCase() === currentRole.toLowerCase()
      );
      if (currentRoleObj) {
        setSelectedRoleId(currentRoleObj.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar roles');
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedRoleId(parseInt(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !selectedRoleId) return;

    setLoading(true);
    setError(null);

    try {
      await changeUserRole(userId, selectedRoleId);
      
      // Verificar si se está promoviendo a Propietario
      const newRole = roles.find(role => role.id === selectedRoleId);
      const isPromotingToBusiness = newRole?.name.toLowerCase() === 'propietario' || selectedRoleId === 3;
      
      if (isPromotingToBusiness && onPromoteToBusiness && userId) {
        // Cerrar este modal primero
        onClose();
        // Abrir modal de datos de negocio
        onPromoteToBusiness(userId, userName);
      } else {
        // Flujo normal para otros cambios de rol
        onSuccess();
        onClose();
      }
    } catch (err) {
      
      // Mensajes de error más específicos
      let errorMessage = 'Error al cambiar rol';
      
      if (err instanceof Error) {
        if (err.message.includes('Error de conexión')) {
          errorMessage = '❌ No se puede conectar al servidor. Verifica que el backend esté funcionando correctamente.';
        } else if (err.message.includes('No estás autenticado')) {
          errorMessage = '🔒 Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        } else if (err.message.includes('Forbidden')) {
          errorMessage = '⛔ No tienes permisos para realizar esta acción.';
        } else if (err.message.includes('No hay conexión')) {
          errorMessage = '🌐 Verifica tu conexión a internet e inténtalo de nuevo.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getRoleDescription = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'user':
        return 'Usuario regular con acceso básico a la plataforma';
      case 'propietario':
        return 'Propietario de negocio con capacidades de gestión avanzadas';
      default:
        return 'Rol del sistema';
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'user':
        return '👤';
      case 'propietario':
        return '🏢';
      default:
        return '🔧';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="change-role-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔄 Cambiar Rol de Usuario</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <h3>{userName || 'Usuario'}</h3>
              <p className="current-role">
                <strong>Rol actual:</strong> 
                <span className="role-badge">{currentRole || 'Sin rol'}</span>
              </p>
            </div>
          </div>

          {loadingRoles ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Cargando roles disponibles...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="error-message">
                  <span>❌</span>
                  {error}
                </div>
              )}

              <div className="roles-section">
                <h4>Seleccione el nuevo rol:</h4>
                <div className="roles-grid">
                  {roles.map((role) => (
                    <label key={role.id} className="role-option">
                      <input
                        type="radio"
                        name="role"
                        value={role.id}
                        checked={selectedRoleId === role.id}
                        onChange={handleRoleChange}
                      />
                      <div className="role-card">
                        <div className="role-icon">{getRoleIcon(role.name)}</div>
                        <div className="role-content">
                          <h5>{role.name}</h5>
                          <p>{getRoleDescription(role.name)}</p>
                        </div>
                        <div className="role-check">
                          {selectedRoleId === role.id && <span>✓</span>}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={onClose} className="btn-cancel">
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={loading || !selectedRoleId}
                  className="btn-change"
                >
                  {loading ? (
                    <>
                      <div className="spinner-small"></div>
                      Cambiando...
                    </>
                  ) : (
                    '🔄 Cambiar Rol'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangeRoleModal;