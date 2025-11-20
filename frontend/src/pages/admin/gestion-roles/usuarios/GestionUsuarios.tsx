import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsersOnly, AdminUser, eliminarUsuario } from '../../../../services/admin';
import { getAllPeople } from '../../../../services/people';
import { obtenerNegociosDisponibles } from '../../../../services/owner.service';
import EditUserModal from '../../../../Components/EditUserModal/EditUserModal';
import ChangeRoleModal from '../../../../Components/ChangeRoleModal/ChangeRoleModal';
import BusinessDataModal from '../../../../Components/BusinessDataModal/BusinessDataModal';
import AssignBusinessModal from '../../../../Components/AssignBusinessModal/AssignBusinessModal';
import ConfirmationModal from '../../../../Components/ConfirmationModal/ConfirmationModal';
import CreateUserModal from '../../../../Components/CreateUserModal/CreateUserModal';
import Toast from '../../../../Components/Toast/Toast';
import './GestionUsuarios.css';

interface RowUser {
  id: string | number;
  email: string;
  firstName: string;
  firstLastName: string;
  rolesText: string;
}

const GestionUsuarios: React.FC = () => {
  const [users, setUsers] = useState<RowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableBusinessCount, setAvailableBusinessCount] = useState(0);
  const navigate = useNavigate();

  // Estados para los modales
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [changeRoleModalOpen, setChangeRoleModalOpen] = useState(false);
  const [businessDataModalOpen, setBusinessDataModalOpen] = useState(false);
  const [assignBusinessModalOpen, setAssignBusinessModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [selectedUserRole, setSelectedUserRole] = useState('');

  // Estados para notificaciones
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const [usersData, peopleData] = await Promise.all([
          getUsersOnly(),
          getAllPeople()
        ]);
        
        const rows = usersData.map((u: any) => {
          const persona = peopleData.find((p: any) => {
            // Coincidencia por user_id plano o user como id plano
            return (
              p.user_id === u.id ||
              p.user === u.id ||
              (p.user && (p.user.user_id === u.id || p.user.id === u.id))
            );
          });
          return {
            id: u.id ?? u.user_id,
            email: u.email ?? u.user_email,
            firstName: persona?.firstName ?? '-',
            firstLastName: persona?.firstLastName ?? '-',
            rolesText: (u.roles || []).map((r: any) => r.name ?? r.rol_name).filter(Boolean).join(', '),
          };
        });
        setUsers(rows);

        // Obtener cantidad de negocios disponibles
        try {
          const businesses = await obtenerNegociosDisponibles();
          setAvailableBusinessCount(businesses.length);
        } catch (err) {
          setAvailableBusinessCount(0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Funciones para manejar los modales
  const handleEditUser = (user: RowUser) => {
    setSelectedUserId(Number(user.id));
    setSelectedUserName(`${user.firstName} ${user.firstLastName}`);
    setEditModalOpen(true);
  };

  const handleChangeRole = (user: RowUser) => {
    setSelectedUserId(Number(user.id));
    setSelectedUserName(`${user.firstName} ${user.firstLastName}`);
    setSelectedUserRole(user.rolesText);
    setChangeRoleModalOpen(true);
  };

  const handleAssignBusiness = (user: RowUser) => {
    setSelectedUserId(Number(user.id));
    setSelectedUserEmail(user.email);
    setAssignBusinessModalOpen(true);
  };

  const handleDeleteUser = (user: RowUser) => {
    setSelectedUserId(Number(user.id));
    setSelectedUserName(`${user.firstName} ${user.firstLastName}`);
    setSelectedUserEmail(user.email);
    setDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUserId) return;

    try {
      await eliminarUsuario(selectedUserId);
      
      showToast('Usuario eliminado exitosamente', 'success');
      setDeleteModalOpen(false);
      
      // Recargar la lista de usuarios
      handleModalSuccess();
    } catch (error) {
      
      let errorMessage = 'Error desconocido al eliminar usuario';
      
      if (error instanceof Error) {
        // Extraer el mensaje del error del servidor
        if (error.message.includes('tiene un negocio asignado')) {
          errorMessage = 'No se puede eliminar el usuario porque tiene un negocio asignado. Primero elimine o reasigne el negocio.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Error del servidor. El usuario podría tener dependencias que deben eliminarse primero.';
        } else {
          errorMessage = error.message;
        }
      }
      
      showToast(errorMessage, 'error');
    }
  };

  const handleModalClose = () => {
    setEditModalOpen(false);
    setChangeRoleModalOpen(false);
    setBusinessDataModalOpen(false);
    setAssignBusinessModalOpen(false);
    setDeleteModalOpen(false);
    setCreateUserModalOpen(false);
    setSelectedUserId(null);
    setSelectedUserName('');
    setSelectedUserEmail('');
    setSelectedUserRole('');
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  const handlePromoteToBusiness = (userId: number, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setBusinessDataModalOpen(true);
  };

  const handleModalSuccess = () => {
    // Recargar la lista de usuarios después de una operación exitosa
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Esperar un poco para que el backend procese los cambios
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const [usersData, peopleData] = await Promise.all([
          getUsersOnly(),
          getAllPeople()
        ]);
        
        const rows = usersData.map((u: any) => {
          const persona = peopleData.find((p: any) => {
            return (
              p.user_id === u.id ||
              p.user === u.id ||
              (p.user && (p.user.user_id === u.id || p.user.id === u.id))
            );
          });
          return {
            id: u.id ?? u.user_id,
            email: u.email ?? u.user_email,
            firstName: persona?.firstName ?? '-',
            firstLastName: persona?.firstLastName ?? '-',
            rolesText: (u.roles || []).map((r: any) => r.name ?? r.rol_name).filter(Boolean).join(', '),
          };
        });
        setUsers(rows);
        setError(null);

        // Actualizar cantidad de negocios disponibles
        try {
          const businesses = await obtenerNegociosDisponibles();
          setAvailableBusinessCount(businesses.length);
        } catch (err) {
          setAvailableBusinessCount(0);
        }

        showToast('Cambios aplicados exitosamente', 'success');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
        showToast('Error al recargar la lista de usuarios', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
    handleModalClose();
  };



  if (loading) {
    return (
      <div className="gestion-container">
        <div className="content-wrapper">
          <div className="header-section">
            <h1 className="page-title">Gestión de Usuarios</h1>
          </div>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <p style={{ fontSize: '1.2rem', color: '#667eea' }}>Cargando usuarios...</p>
            <div className="loading-shimmer" style={{ width: '200px', margin: '1rem auto' }}></div>
            <div className="loading-shimmer" style={{ width: '150px', margin: '0.5rem auto' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gestion-container">
        <div className="content-wrapper">
          <div className="error-message">
            <h3>❌ Error al cargar usuarios</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>
              🔄 Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gestion-container">
      <div className="content-wrapper">
        <div className="header-section">
          <div className="header-left">
            <button
              className="back-button"
              onClick={() => navigate('/ajustes')}
            >
              <span>←</span>
              Regresar
            </button>
            <h1 className="page-title">Gestión de Usuarios</h1>
          </div>
          <div className="header-right">
            <button
              className="back-button"
              onClick={() => setCreateUserModalOpen(true)}
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              <span>➕</span>
              Crear Usuario
            </button>
          </div>
        </div>

        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-number">{users.length}</div>
            <div className="stat-label">Usuarios Regulares</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{users.filter(u => u.firstName !== '-').length}</div>
            <div className="stat-label">Con Perfil Completo</div>
          </div>
          <div className="stat-card" style={{
            background: availableBusinessCount > 0 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
          }}>
            <div className="stat-number">{availableBusinessCount}</div>
            <div className="stat-label">Negocios Disponibles para Asignar</div>
          </div>
        </div>



        {users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p>No se encontraron usuarios regulares en el sistema</p>
            <small>Se excluyen administradores y propietarios de esta vista</small>
          </div>
        ) : (
          <table className="gestion-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id} style={{ animationDelay: `${index * 0.1}s` }}>
                  <td>{user.firstName || '-'}</td>
                  <td>{user.firstLastName || '-'}</td>
                  <td>{user.email || '-'}</td>
                  <td>
                    <span style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: '500'
                    }}>
                      {user.rolesText || 'Sin roles'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-edit"
                        onClick={() => handleEditUser(user)}
                        title="Editar información del usuario"
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        className="btn-change-role"
                        onClick={() => handleChangeRole(user)}
                        title="Cambiar rol del usuario"
                      >
                        🔄 Cambiar Rol
                      </button>
                      {availableBusinessCount > 0 && (
                        <button 
                          className="btn-assign-business"
                          onClick={() => handleAssignBusiness(user)}
                          title={`Asignar negocio al usuario (${availableBusinessCount} disponibles)`}
                        >
                          🏢 Asignar Negocio
                        </button>
                      )}
                      <button 
                        className="btn-delete"
                        onClick={() => handleDeleteUser(user)}
                        title="Eliminar usuario del sistema"
                        style={{
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: 'white'
                        }}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Modales */}
        <EditUserModal
          isOpen={editModalOpen}
          userId={selectedUserId}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
        
        <ChangeRoleModal
          isOpen={changeRoleModalOpen}
          userId={selectedUserId}
          currentRole={selectedUserRole}
          userName={selectedUserName}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          onPromoteToBusiness={handlePromoteToBusiness}
        />
        
        <BusinessDataModal
          isOpen={businessDataModalOpen}
          userId={selectedUserId}
          userName={selectedUserName}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          onShowToast={showToast}
        />

        <AssignBusinessModal
          isOpen={assignBusinessModalOpen}
          userId={selectedUserId || 0}
          userEmail={selectedUserEmail}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />

        {/* Modal de confirmación para eliminar usuario */}
        {deleteModalOpen && (
          <ConfirmationModal
            isOpen={deleteModalOpen}
            title="🗑️ Eliminar Usuario"
            message={`¿Estás seguro de que deseas eliminar al usuario "${selectedUserName}" completamente?`}
            details={[
              `**Email:** ${selectedUserEmail}`,
              '',
              '⚠️ **Esta acción es irreversible.** Se eliminarán:',
              '• Todos los datos personales del usuario',
              '• Todos sus roles asignados',
              '• Su cuenta de acceso al sistema',
              '',
              '📝 **Nota:** Esta acción NO eliminará los negocios asociados.'
            ]}
            confirmText="Sí, Eliminar Usuario"
            cancelText="Cancelar"
            onConfirm={confirmDeleteUser}
            onCancel={handleModalClose}
            type="danger"
          />
        )}

        {/* Modal para crear nuevo usuario */}
        <CreateUserModal
          isOpen={createUserModalOpen}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          onShowToast={showToast}
        />

        {/* Toast de notificaciones */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

export default GestionUsuarios;