// frontend/src/Components/AdminRolePanel/UserRoleList.tsx

import React from 'react';
import { FaEdit } from 'react-icons/fa';
import { UserAccount, getPrimaryRole } from './AdminRolePanel'; // Importamos tipos
import './AdminRolePanel.css'; // Reutilizamos el CSS

interface UserListProps {
  users: UserAccount[];
  onEditRoleClick: (user: UserAccount) => void;
  isSubmitting: boolean;
}

const UserRoleList: React.FC<UserListProps> = ({ users, onEditRoleClick, isSubmitting }) => (
  <div className="admin-list table-container">
    <table className="role-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Correo Electrónico</th>
          <th>Rol Actual</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.user_id}>
            {/* Nombre y Correo */}
            <td>{user.people.firstName} {user.people.firstLastName}</td>
            <td>{user.email}</td>
            
            {/* Rol Actual (con insignia) */}
            <td>
              <span className={`role-badge ${getPrimaryRole(user.user_rols).toLowerCase()}`}>
                {getPrimaryRole(user.user_rols)}
              </span>
            </td>
            
            {/* Acciones */}
            <td>
              <button 
                onClick={() => onEditRoleClick(user)} 
                className="action-btn edit" 
                title="Cambiar Rol"
                disabled={isSubmitting} // Deshabilitado durante la acción
              >
                <FaEdit /> Cambiar Rol
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default UserRoleList;