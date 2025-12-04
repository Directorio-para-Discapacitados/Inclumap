// frontend/src/Components/AdminRolePanel/RoleChangeModal.tsx

import React, { useState } from 'react';
import { UserAccount, Rol } from './AdminRolePanel'; // Importamos tipos
import './AdminRolePanel.css'; // Reutilizamos el CSS

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: number, newRoleId: number) => void;
  user: UserAccount;
  availableRoles: Rol[]; // Roles que se pueden asignar
  currentRoleId: number;
  isLoading: boolean; // Para deshabilitar botones
}

const RoleChangeModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  user,
  availableRoles,
  currentRoleId,
  isLoading
}) => {
  // Estado interno del modal para el <select>
  const [selectedRoleId, setSelectedRoleId] = useState<number>(currentRoleId);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(user.user_id, selectedRoleId);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h3>Cambiar Rol</h3>
            <button type="button" className="modal-close" onClick={onClose} disabled={isLoading}>×</button>
          </div>
          <div className="modal-body">
            <p>Estás modificando el rol de:</p>
            <p><strong>{user.people.firstName} {user.people.firstLastName}</strong> ({user.email})</p>
            
            <div className="form-group">
              <label htmlFor="role-select">Asignar Nuevo Rol:</label>
              {/* Selector (dropdown) */}
              <select 
                id="role-select"
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                disabled={isLoading}
              >
                {availableRoles.map(role => (
                  <option key={role.rol_id} value={role.rol_id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isLoading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading || selectedRoleId === currentRoleId}>
              {isLoading ? 'Actualizando...' : 'Confirmar Cambio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleChangeModal;
