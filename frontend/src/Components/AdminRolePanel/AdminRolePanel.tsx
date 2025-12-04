// frontend/src/Components/AdminRolePanel/AdminRolePanel.tsx (MODIFICADO)

import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import './AdminRolePanel.css';
import { FaEdit, FaTrash } from 'react-icons/fa';
import RoleChangeModal from './RoleChangeModal';
import UserRoleList from './UserRoleList';

// --- Definición de Tipos ---
export interface Rol {
  rol_id: number;
  name: string;
}
export interface UserAccount {
  user_id: number;
  email: string;
  people: {
    firstName: string;
    firstLastName: string;
  };
  user_rols: { rol: Rol }[];
}
// (NUEVO) Interfaz para Negocios
export interface BusinessAccount {
  business_id: number;
  business_name: string;
  user: {
    email: string;
    user_id: number;
  };
}
// ------------------------------

// --- Helpers (sin cambios) ---
export const getPrimaryRole = (userRols: { rol: Rol }[]): string => {
  const rol = userRols[0]?.rol;
  return rol ? rol.name : 'Desconocido';
};
export const getPrimaryRoleId = (userRols: { rol: Rol }[]): number => {
  return userRols[0]?.rol?.rol_id || 2;
};
// ------------------------------


const AdminRolePanel = () => {
  // --- PESTAÑAS (TABS) ---
  const [activeTab, setActiveTab] = useState('roles'); // 'roles' o 'negocios'

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [allRoles, setAllRoles] = useState<Rol[]>([]);
  const [businesses, setBusinesses] = useState<BusinessAccount[]>([]); // <-- NUEVO ESTADO

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  const { user, logout } = useAuth();
  const token = localStorage.getItem('token');

  const showSuccess = (message: string) => {
    setError('');
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };
  const showError = (message: string) => {
    setSuccess('');
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const handleApiError = (status: number, defaultMessage: string) => {
    if (status === 401 || status === 403) {
      showError('Acceso denegado. Serás redirigido al login.');
      setTimeout(() => logout(), 2000);
    } else {
      showError(defaultMessage);
    }
  };

  // --- Cargar USUARIOS Y ROLES ---
  const fetchUsersAndRoles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        fetch(`${API_URL}/user`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/roles`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!usersResponse.ok) throw { status: usersResponse.status, message: 'Error al cargar usuarios' };
      if (!rolesResponse.ok) throw { status: rolesResponse.status, message: 'Error al cargar roles' };

      const usersData = await usersResponse.json();
      const rolesData = await rolesResponse.json();
      
      setUsers(usersData.filter((u: UserAccount) => u.user_id !== user?.user_id));
      setAllRoles(rolesData.filter((r: Rol) => r.name !== 'Administrador'));

    } catch (err: any) {
      handleApiError(err.status, err.message);
    }
    setLoading(false);
  }, [token, user?.user_id, logout]);

  // --- (NUEVO) Cargar NEGOCIOS ---
  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Usamos el endpoint de tu backend para ver negocios
      const response = await fetch(`${API_URL}/business`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw { status: response.status, message: 'Error al cargar negocios' };
      }
      const data = await response.json();
      setBusinesses(data); // Guardamos los negocios

    } catch (err: any) {
      handleApiError(err.status, err.message);
    }
    setLoading(false);
  }, [token, logout]);
  
  // Cargar datos cuando cambia la pestaña
  useEffect(() => {
    if (activeTab === 'roles') {
      fetchUsersAndRoles();
    } else {
      fetchBusinesses();
    }
  }, [activeTab, fetchUsersAndRoles, fetchBusinesses]); // Dependencias actualizadas

  // --- (NUEVO) Eliminar Negocio ---
  const handleDeleteBusiness = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este negocio? Esta acción no se puede deshacer.')) {
      setIsSubmitting(true);
      try {
        const response = await fetch(`${API_URL}/business/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw { status: response.status, message: 'Error al eliminar el negocio' };
        
        showSuccess('Negocio eliminado correctamente.');
        await fetchBusinesses(); // Recargar la lista de negocios

      } catch (err: any) {
        handleApiError(err.status, err.message);
      }
      setIsSubmitting(false);
    }
  };

  // --- Cambiar Rol (sin cambios) ---
  const handleChangeRole = async (userId: number, newRoleId: number) => {
    setIsSubmitting(true);
    const endpoint = `${API_URL}/user-rol/${userId}`;
    try {
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rol_id: newRoleId })
      });
      if (!response.ok) throw { status: response.status, message: 'Error al actualizar el rol' };
      showSuccess('Rol actualizado correctamente.');
      await fetchUsersAndRoles();
    } catch (err: any) {
      handleApiError(err.status, err.message);
    }
    setIsSubmitting(false);
    setEditingUser(null);
  };

  return (
    <div className="admin-panel">
      <h2>Panel de Administración</h2>

      {/* --- PESTAÑAS (TABS) --- */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          Gestión de Roles
        </button>
        <button 
          className={`tab-btn ${activeTab === 'negocios' ? 'active' : ''}`}
          onClick={() => setActiveTab('negocios')}
        >
          Gestión de Negocios
        </button>
      </div>

      {/* Mensajes de estado */}
      {success && <div className="message success-message">{success}</div>}
      {error && <div className="message error-message">{error}</div>}
      {loading && <p>Cargando...</p>}

      {/* --- Contenido de Pestañas --- */}
      <div className="admin-content">
        
        {/* Pestaña 1: Gestión de Roles */}
        {activeTab === 'roles' && (
          <div>
            {!loading && !error && users.length === 0 && (
              <div className="message info-message">
                <p>No se encontraron usuarios para gestionar.</p>
                <p>Si crees que esto es un error, **mira el backend** (o puede ser que solo existas tú como admin).</p>
              </div>
            )}
            {!loading && users.length > 0 && (
              <UserRoleList
                users={users}
                onEditRoleClick={(user) => setEditingUser(user)}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        )}

        {/* Pestaña 2: Gestión de Negocios */}
        {activeTab === 'negocios' && (
          <div>
            {!loading && !error && businesses.length === 0 && (
              <div className="message info-message">
                <p>No se encontraron negocios para gestionar.</p>
              </div>
            )}
            {!loading && businesses.length > 0 && (
              <BusinessList
                businesses={businesses}
                onDeleteClick={handleDeleteBusiness}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        )}
      </div>

      {/* Modal de Confirmación (sin cambios) */}
      {editingUser && (
        <RoleChangeModal
          user={editingUser}
          availableRoles={allRoles}
          currentRoleId={getPrimaryRoleId(editingUser.user_rols)}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onConfirm={handleChangeRole}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
};

// --- (NUEVO) Componente para la lista de Negocios ---
interface BusinessListProps {
  businesses: BusinessAccount[];
  onDeleteClick: (id: number) => void;
  isSubmitting: boolean;
}

const BusinessList: React.FC<BusinessListProps> = ({ businesses, onDeleteClick, isSubmitting }) => (
  <div className="admin-list table-container">
    <table className="role-table">
      <thead>
        <tr>
          <th>Nombre del Negocio</th>
          <th>Email del Propietario</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {businesses.map(business => (
          <tr key={business.business_id}>
            <td>{business.business_name}</td>
            <td>{business.user.email}</td>
            <td>
              <button 
                onClick={() => onDeleteClick(business.business_id)} 
                className="action-btn delete" // Botón de eliminar
                title="Eliminar Negocio"
                disabled={isSubmitting}
              >
                <FaTrash /> Eliminar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);


export default AdminRolePanel;
