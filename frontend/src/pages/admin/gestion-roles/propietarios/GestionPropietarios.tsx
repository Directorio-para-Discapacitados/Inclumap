import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOwners } from '../../../../services/admin';
import { degradarPropietario, eliminarNegocioCompleto } from '../../../../services/owner.service';
import EditOwnerPersonalModal from '../../../../Components/EditOwnerPersonalModal/EditOwnerPersonalModal';
import EditOwnerBusinessModal from '../../../../Components/EditOwnerBusinessModal/EditOwnerBusinessModal';
import ConfirmationModal from '../../../../Components/ConfirmationModal/ConfirmationModal';
import Toast from '../../../../Components/Toast/Toast';
import '../usuarios/GestionUsuarios.css'; // Reutilizamos los mismos estilos

// Interfaz para tipar los datos del propietario que vienen de la API
interface BusinessData {
  id: number;
  name: string;
  user?: {
    id: number;
    email?: string;
    user_email?: string;
    roles?: { id: number; name: string }[];
  };
}

const GestionPropietarios: React.FC = () => {
  const [businesses, setBusinesses] = useState<BusinessData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDemoteModal, setShowDemoteModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessData | null>(null);
  // Estados para los modales de edición
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [editingOwner, setEditingOwner] = useState<BusinessData | null>(null);
  // Estados para Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  // Estados para el modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'demote' | 'delete' | null>(null);
  const [deleteOwnerToo, setDeleteOwnerToo] = useState(false); // Checkbox para eliminar también al propietario
  const navigate = useNavigate();

  // Helper para mostrar Toast
  const showToastMessage = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      setError(null); // Limpiar error anterior
      const data: any[] = await getOwners();
      console.log('Propietarios recibidos del servicio:', data);
      console.log('Número de propietarios:', data.length);
      
      // Log detallado de cada propietario
      data.forEach((business, index) => {
        console.log(`Propietario ${index + 1}:`, business);
        console.log(`  - ID negocio: ${business.id}`);
        console.log(`  - Nombre negocio: ${business.name}`);
        console.log(`  - Usuario completo:`, business.user);
        if (business.user) {
          console.log(`  - Email usuario: ${business.user?.email || business.user?.user_email}`);
          console.log(`  - Roles del usuario:`, business.user?.roles);
          console.log(`  - ¿Tiene roles array?:`, Array.isArray(business.user?.roles));
          if (business.user?.roles) {
            console.log(`  - Cantidad de roles:`, business.user.roles.length);
            business.user.roles.forEach((role: any, roleIndex: number) => {
              console.log(`    Rol ${roleIndex + 1}:`, role);
            });
          }
        }
        console.log('---');
      });
      
      setBusinesses(data as BusinessData[]);
    } catch (err) {
      console.error('Error al obtener propietarios:', err);
      // Solo establecer error si realmente hay un problema (no solo array vacío)
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido';
      // Si el error es sobre "Not Found", podría ser que simplemente no hay datos
      if (errorMessage.includes('Not Found') || errorMessage.includes('404')) {
        console.warn('Backend devolvió 404, asumiendo que no hay negocios');
        setBusinesses([]); // Establecer array vacío en lugar de error
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();

    // Escuchar evento personalizado para refrescar cuando se crea un nuevo negocio
    const handleBusinessCreated = () => {
      console.log('🔄 Evento detectado: nuevo negocio creado, refrescando lista...');
      fetchBusinesses();
    };

    // Agregar listener del evento
    window.addEventListener('businessCreated', handleBusinessCreated);

    // Cleanup
    return () => {
      window.removeEventListener('businessCreated', handleBusinessCreated);
    };
  }, []);

  // Función para manejar la edición de propietario
  const handleEditBusiness = (business: BusinessData) => {
    console.log('Editando negocio:', business);
    setEditingOwner(business);
    // Mostrar ambos modales o crear un sistema de navegación entre ellos
    setShowPersonalModal(true);
  };

  // Función para alternar entre modales
  const switchToBusinessModal = () => {
    setShowPersonalModal(false);
    setShowBusinessModal(true);
  };

  const switchToPersonalModal = () => {
    setShowBusinessModal(false);
    setShowPersonalModal(true);
  };

  // Función para cerrar ambos modales
  const closeEditModals = () => {
    setShowPersonalModal(false);
    setShowBusinessModal(false);
    setEditingOwner(null);
  };

  // Función cuando se guarda en algún modal
  const handleModalSave = () => {
    // Refrescar la lista después de guardar
    fetchBusinesses();
  };

  // Función para manejar el cambio de rol (propietario → usuario normal)
  const handleDemoteToUser = (business: BusinessData) => {
    setSelectedBusiness(business);
    setShowDemoteModal(true);
  };

  // Opción 1: Conservar negocio, solo quitar rol de propietario
  const handleConfirmDemoteKeepBusiness = async () => {
    if (!selectedBusiness?.user?.id || !selectedBusiness?.id) return;
    
    try {
      console.log('🔄 Iniciando degradación de propietario...');
      console.log('📋 Usuario ID:', selectedBusiness.user.id);
      console.log('📋 Negocio ID:', selectedBusiness.id);
      console.log('📋 Negocio:', selectedBusiness.name);
      
      // Usar el nuevo servicio con parámetros en orden correcto: businessId, userId
      await degradarPropietario(selectedBusiness.id, selectedBusiness.user.id);
      
      console.log('✅ Degradación completada exitosamente');
      
      showToastMessage(
        `🎉 ¡Cambio de rol exitoso! El negocio "${selectedBusiness.name}" se conservó sin propietario.`,
        'success'
      );
      
      setShowDemoteModal(false);
      setSelectedBusiness(null);
      
      // Refrescar lista después de un breve delay para que se vea el toast
      setTimeout(() => {
        fetchBusinesses();
      }, 1500);
    } catch (error) {
      console.error('❌ Error al cambiar rol:', error);
      showToastMessage(
        `❌ Error al cambiar rol: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        'error'
      );
    }
  };

  // Mostrar modal de confirmación para eliminar negocio
  const handleDeleteBusiness = (business: BusinessData) => {
    setSelectedBusiness(business);
    setConfirmAction('delete');
    setShowConfirmModal(true);
    setShowDemoteModal(false);
  };

  // Mostrar modal de confirmación para degradar propietario
  const handleDemoteOwner = (business: BusinessData) => {
    setSelectedBusiness(business);
    setConfirmAction('demote');
    setShowConfirmModal(true);
    setShowDemoteModal(false);
  };

  // Ejecutar la acción confirmada
  const handleConfirmAction = async () => {
    if (!selectedBusiness || !confirmAction) return;

    setShowConfirmModal(false);

    try {
      if (confirmAction === 'delete') {
        console.log(`Eliminando negocio completamente. Eliminar propietario: ${deleteOwnerToo}`);
        
        // Eliminar el negocio y opcionalmente el propietario usando el nuevo servicio
        const result = await eliminarNegocioCompleto(selectedBusiness.id, deleteOwnerToo);
        
        const message = deleteOwnerToo
          ? `🗑️ Negocio "${selectedBusiness.name}" y usuario propietario eliminados completamente (incluyendo accesibilidades y roles) exitosamente`
          : `🗑️ Negocio "${selectedBusiness.name}" eliminado completamente (incluyendo accesibilidades) exitosamente`;
        
        showToastMessage(message, 'success');
      } else if (confirmAction === 'demote') {
        console.log('Degradando propietario pero manteniendo negocio...');
        
        // Para degradar, usar el nuevo servicio que maneja todo correctamente
        if (selectedBusiness.user?.id) {
          await degradarPropietario(selectedBusiness.id, selectedBusiness.user.id);
          
          showToastMessage(
            `👤 Usuario degradado exitosamente. El negocio "${selectedBusiness.name}" ahora está disponible para asignar.`,
            'success'
          );
        }
      }
      
      // Limpiar estados y refrescar
      setSelectedBusiness(null);
      setConfirmAction(null);
      setDeleteOwnerToo(false); // Resetear checkbox
      fetchBusinesses();
    } catch (error) {
      console.error('Error en la acción:', error);
      showToastMessage(
        `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        'error'
      );
    }
  };

  // Cancelar la acción
  const handleCancelAction = () => {
    setShowConfirmModal(false);
    setSelectedBusiness(null);
    setConfirmAction(null);
  };

  if (loading) {
    return (
      <div className="gestion-container">
        <div className="content-wrapper">
          <div className="header-section">
            <h1 className="page-title">Gestión de Propietarios</h1>
          </div>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
            <p style={{ fontSize: '1.2rem', color: '#667eea' }}>Cargando propietarios...</p>
            <div className="loading-shimmer" style={{ width: '250px', margin: '1rem auto' }}></div>
            <div className="loading-shimmer" style={{ width: '180px', margin: '0.5rem auto' }}></div>
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
            <h3>❌ Error al cargar propietarios</h3>
            <p>{error}</p>
            <button onClick={() => fetchBusinesses()}>
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
            <h1 className="page-title">Gestión de Propietarios</h1>
          </div>
          <div className="header-right">
            <button
              className="btn-refresh"
              onClick={() => fetchBusinesses()}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                fontSize: '0.9rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-number">{businesses.length}</div>
            <div className="stat-label">Negocios Registrados</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{businesses.filter(b => b.user).length}</div>
            <div className="stat-label">Con Propietarios Asociados</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{businesses.filter(b => b.user?.email || b.user?.user_email).length}</div>
            <div className="stat-label">Con Email de Contacto</div>
          </div>
        </div>



        {businesses.length > 0 && businesses.filter(b => !b.user).length > 0 && (
          <div className="warning-card">
            ⚠️ {businesses.filter(b => !b.user).length} de {businesses.length} negocios no tienen usuario propietario asociado.
          </div>
        )}
        {businesses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <p>No se encontraron propietarios en el sistema</p>
            <small>Los negocios registrados aparecerán aquí cuando tengan propietarios asociados</small>
          </div>
        ) : (
          <table className="gestion-table">
            <thead>
              <tr>
                <th>Negocio</th>
                <th>Propietario</th>
                <th>Roles</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((business, index) => {
                console.log('Negocio completo:', business);
                
                // Función helper para obtener el email
                const getEmail = () => {
                  if (!business.user) return null;
                  return business.user.email || business.user.user_email || null;
                };
                
                // Función helper para obtener los roles
                const getRoles = () => {
                  if (!business.user || !business.user.roles || !Array.isArray(business.user.roles)) {
                    return [];
                  }
                  return business.user.roles;
                };
                
                const email = getEmail();
                const roles = getRoles();
                
                console.log('Email encontrado:', email);
                console.log('Roles encontrados:', roles);
                
                return (
                  <tr key={business.id} style={{ animationDelay: `${index * 0.1}s` }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: '500'
                        }}>
                          ID: {business.id}
                        </span>
                        <strong>{business.name || 'Sin nombre'}</strong>
                      </div>
                    </td>
                    <td>
                      {email ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: '#22c55e' }}>✅</span>
                          <span>{email}</span>
                        </div>
                      ) : business.user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: '#f59e0b' }}>⚠️</span>
                          <span style={{ color: '#f59e0b', fontStyle: 'italic' }}>Usuario sin email</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: '#ef4444' }}>❌</span>
                          <div>
                            <span style={{ color: '#ef4444', fontStyle: 'italic' }}>Sin usuario asociado</span>
                            <br />
                            <small style={{ fontSize: '0.75em', color: '#9ca3af' }}>
                              El negocio no tiene propietario asignado
                            </small>
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      {roles.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {roles.map((role, roleIndex) => (
                            <span
                              key={roleIndex}
                              style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '8px',
                                fontSize: '0.7rem',
                                fontWeight: '500'
                              }}
                            >
                              {role.name}
                            </span>
                          ))}
                        </div>
                      ) : business.user ? (
                        <span style={{ color: '#f59e0b', fontStyle: 'italic', fontSize: '0.85rem' }}>
                          Sin roles asignados
                        </span>
                      ) : (
                        <span style={{ color: '#ef4444', fontStyle: 'italic', fontSize: '0.85rem' }}>
                          Sin usuario
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-edit" 
                          disabled={!business.user}
                          onClick={() => business.user && handleEditBusiness(business)}
                          style={{ 
                            opacity: !business.user ? 0.5 : 1,
                            cursor: !business.user ? 'not-allowed' : 'pointer'
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <button 
                          className="btn-change-role" 
                          disabled={!business.user}
                          onClick={() => business.user && handleDemoteToUser(business)}
                          style={{ 
                            opacity: !business.user ? 0.5 : 1,
                            cursor: !business.user ? 'not-allowed' : 'pointer'
                          }}
                        >
                          � → Usuario Normal
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Modal de confirmación para cambio de rol */}
        {showDemoteModal && selectedBusiness && (
          <div className="modal-overlay" onClick={() => setShowDemoteModal(false)}>
            <div className="demote-modal" onClick={e => e.stopPropagation()} style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
            }}>
              <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
                <h2>🔄 Cambiar Rol: Propietario → Usuario Normal</h2>
              </div>

              <div className="modal-body">
                <div style={{ marginBottom: '1.5rem' }}>
                  <p><strong>Negocio:</strong> {selectedBusiness.name}</p>
                  <p><strong>Propietario:</strong> {selectedBusiness.user?.email || selectedBusiness.user?.user_email}</p>
                </div>

                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #f59e0b',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <h4 style={{ color: '#92400e', marginBottom: '0.5rem' }}>⚠️ ¿Qué hacer con el negocio?</h4>
                  <p style={{ color: '#92400e', fontSize: '0.9rem', margin: 0 }}>
                    Al cambiar el rol de propietario a usuario normal, ¿qué deseas hacer con la información del negocio?
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                  <div style={{
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = '#3b82f6'}
                  onMouseOut={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                  >
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>
                      📦 Opción 1: Conservar el negocio como "Sin propietario"
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>
                      El negocio permanece en la base de datos pero sin usuario asociado. 
                      Podrá ser asignado a otro propietario más tarde.
                    </p>
                  </div>

                  <div style={{
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = '#ef4444'}
                  onMouseOut={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                  >
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>
                      🗑️ Opción 2: Eliminar el negocio completamente
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>
                      Se eliminará toda la información del negocio de la base de datos. 
                      <strong style={{ color: '#ef4444' }}> Esta acción no se puede deshacer.</strong>
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => setShowDemoteModal(false)}
                    style={{
                      padding: '8px 16px',
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => handleDemoteOwner(selectedBusiness!)}
                    style={{
                      padding: '8px 16px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    📦 Conservar Negocio
                  </button>
                  <button 
                    onClick={() => handleDeleteBusiness(selectedBusiness!)}
                    style={{
                      padding: '8px 16px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️ Eliminar Negocio
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modales de edición */}
        {showPersonalModal && editingOwner && (
          <EditOwnerPersonalModal
            isOpen={showPersonalModal}
            userId={editingOwner.user?.id || null}
            userName={editingOwner.name}
            userEmail={editingOwner.user?.email || editingOwner.user?.user_email || ''}
            onClose={closeEditModals}
            onSuccess={handleModalSave}
            onSwitchToBusiness={switchToBusinessModal}
          />
        )}

        {showBusinessModal && editingOwner && (
          <EditOwnerBusinessModal
            isOpen={showBusinessModal}
            businessId={editingOwner.id}
            businessName={editingOwner.name}
            userId={editingOwner.user?.id || null}
            onClose={closeEditModals}
            onSuccess={handleModalSave}
            onSwitchToPersonal={switchToPersonalModal}
          />
        )}

        <ConfirmationModal
          isOpen={showConfirmModal}
          title={confirmAction === 'delete' ? '🗑️ Eliminar Negocio Completamente' : '👤 Degradar Propietario'}
          message={
            confirmAction === 'delete'
              ? `¿Estás seguro de eliminar completamente el negocio "${selectedBusiness?.name}"?`
              : `¿Estás seguro de degradar al propietario del negocio "${selectedBusiness?.name}"?`
          }
          details={
            confirmAction === 'delete'
              ? [
                  'Eliminará toda la información del negocio',
                  'Eliminará todas las accesibilidades asociadas',
                  deleteOwnerToo 
                    ? 'Eliminará completamente al usuario propietario y todos sus roles'
                    : 'Removerá solo el rol de propietario del usuario'
                ]
              : [
                  'El usuario perderá el rol de propietario',
                  'El negocio quedará sin propietario',
                  'El negocio estará disponible para asignar a otro usuario',
                  'El usuario mantendrá su rol de usuario normal'
                ]
          }
          confirmText={confirmAction === 'delete' ? '🗑️ Eliminar' : '👤 Degradar'}
          cancelText="Cancelar"
          onConfirm={handleConfirmAction}
          onCancel={handleCancelAction}
          type={confirmAction === 'delete' ? 'danger' : 'warning'}
          checkboxLabel={
            confirmAction === 'delete' && selectedBusiness?.user
              ? '🚨 También eliminar completamente al usuario propietario (roles 2 y 3)'
              : undefined
          }
          checkboxChecked={deleteOwnerToo}
          onCheckboxChange={setDeleteOwnerToo}
        />

        {showToast && (
          <Toast
            message={toastMessage}
            type={toastType}
            onClose={() => setShowToast(false)}
          />
        )}
      </div>
    </div>
  );
};

export default GestionPropietarios;
