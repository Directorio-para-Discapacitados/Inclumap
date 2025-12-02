import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAllBusinesses } from '../../../services/admin';
import { eliminarNegocioCompleto } from '../../../services/owner.service';
import Toast from '../../../Components/Toast/Toast';
import { useSpeakable } from '../../../hooks/useSpeakable';
import './GestionNegocios.css';

interface Business {
  id: number;
  business_id: number;
  name: string;
  address: string;
  average_rating: number;
  logo_url?: string;
  business_categories?: any[];
  user?: {
    id: number;
    email: string;
    people?: {
      firstName: string;
      firstLastName: string;
    };
  } | null;
}

const GestionNegocios: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [deleteOwner, setDeleteOwner] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { onMouseEnter, onFocus } = useSpeakable();

  const filterType = searchParams.get('filter'); // 'unverified' o null

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const data = await getAllBusinesses();
      console.log('📊 Negocios obtenidos:', data);
      console.log('📊 Total de negocios:', data.length);
      console.log('📊 Negocios sin logo (sin verificar):', data.filter((b: any) => !b.logo_url).length);
      setBusinesses(data);
      setError(null);
    } catch (err) {
      console.error('❌ Error al cargar negocios:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar negocios');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBusiness = (business: Business) => {
    setSelectedBusiness(business);
    setDeleteOwner(false);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedBusiness) return;

    try {
      await eliminarNegocioCompleto(selectedBusiness.business_id, deleteOwner);
      showToast('Negocio eliminado exitosamente', 'success');
      setDeleteModalOpen(false);
      setSelectedBusiness(null);
      fetchBusinesses();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el negocio';
      showToast(errorMessage, 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  const getOwnerName = (business: Business): string => {
    if (!business.user) return 'Sin propietario';
    if (business.user.people) {
      return `${business.user.people.firstName} ${business.user.people.firstLastName}`;
    }
    return business.user.email;
  };

  const getCategoryNames = (business: Business): string => {
    if (!business.business_categories || business.business_categories.length === 0) {
      return 'Sin categorías';
    }
    return business.business_categories
      .map((bc: any) => bc.category?.name || 'Sin nombre')
      .join(', ');
  };

  // Filtrar negocios según el parámetro de URL
  const filteredBusinesses = React.useMemo(() => {
    console.log('🔍 Filtro activo:', filterType);
    console.log('🔍 Total businesses:', businesses.length);
    
    if (filterType === 'unverified') {
      // Negocios sin verificar = sin logo_url
      const unverified = businesses.filter(b => !b.logo_url);
      console.log('🔍 Negocios sin verificar (sin logo):', unverified.length);
      console.log('🔍 Ejemplos:', unverified.slice(0, 3));
      return unverified;
    }
    
    console.log('🔍 Mostrando todos los negocios');
    return businesses;
  }, [businesses, filterType]);

  if (loading) {
    return (
      <div className="gestion-negocios-container">
        <div className="content-wrapper">
          <div className="header-section">
            <h1 className="page-title">Gestión de Negocios</h1>
          </div>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <p style={{ fontSize: '1.2rem', color: '#EC4899' }}>Cargando negocios...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gestion-negocios-container">
        <div className="content-wrapper">
          <div className="error-message">
            <h3>❌ Error al cargar negocios</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>🔄 Reintentar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gestion-negocios-container">
      <div className="content-wrapper">
        <div className="header-section">
          <button 
            className="back-button" 
            onClick={() => navigate('/')}
            aria-label="Regresar al inicio"
            onMouseEnter={onMouseEnter}
            onFocus={onFocus}
          >
            <span>←</span>
            Regresar
          </button>
          <h1 className="page-title">
            {filterType === 'unverified' ? 'Negocios Sin Verificar' : 'Gestión de Negocios'}
          </h1>
          <button
            className="advanced-button"
            onClick={() => navigate('/admin/gestion-propietarios')}
            aria-label="Opciones avanzadas"
            onMouseEnter={onMouseEnter}
            onFocus={onFocus}
          >
            ⚙️ Opciones Avanzadas
          </button>
        </div>

        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-number">{filteredBusinesses.length}</div>
            <div className="stat-label">
              {filterType === 'unverified' ? 'Sin Verificar' : 'Total de Negocios'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{businesses.filter(b => b.logo_url).length}</div>
            <div className="stat-label">Verificados (con logo)</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{businesses.filter(b => !b.logo_url).length}</div>
            <div className="stat-label">Sin Verificar (sin logo)</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {businesses.filter(b => typeof b.average_rating === 'number' && b.average_rating >= 4).length}
            </div>
            <div className="stat-label">Con Rating Alto (≥4)</div>
          </div>
        </div>

        {filteredBusinesses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏪</div>
            <p>
              {filterType === 'unverified' 
                ? 'No hay negocios sin verificar' 
                : 'No se encontraron negocios en el sistema'}
            </p>
          </div>
        ) : (
          <table className="gestion-table">
            <thead>
              <tr>
                <th>Logo</th>
                <th>Nombre</th>
                <th>Dirección</th>
                <th>Estado</th>
                <th>Propietario</th>
                <th>Categorías</th>
                <th>Rating</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.map((business, index) => (
                <tr key={business.id} style={{ animationDelay: `${index * 0.1}s` }}>
                  <td>
                    <div className="business-logo">
                      {business.logo_url ? (
                        <img src={business.logo_url} alt={business.name} />
                      ) : (
                        <div className="logo-placeholder">🏪</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <strong>{business.name}</strong>
                  </td>
                  <td>{business.address || '-'}</td>
                  <td>
                    <span className={business.logo_url ? 'owner-badge' : 'no-owner-badge'}>
                      {business.logo_url ? '✓ Verificado' : '⚠️ Sin verificar'}
                    </span>
                  </td>
                  <td>
                    <span className={business.user ? 'owner-badge' : 'no-owner-badge'}>
                      {getOwnerName(business)}
                    </span>
                  </td>
                  <td>
                    <span className="categories-badge">{getCategoryNames(business)}</span>
                  </td>
                  <td>
                    <div className="rating-display">
                      <span className="star-icon">⭐</span>
                      <span>
                        {typeof business.average_rating === 'number' 
                          ? business.average_rating.toFixed(1) 
                          : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-view"
                        onClick={() => navigate(`/local/${business.business_id}`)}
                        title="Ver detalles del negocio"
                      >
                        👁️ Ver
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteBusiness(business)}
                        title="Eliminar negocio"
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

        {/* Modal de confirmación para eliminar negocio */}
        {deleteModalOpen && selectedBusiness && (
          <div className="modal-overlay" onClick={() => setDeleteModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🗑️ Eliminar Negocio</h2>
                <button className="modal-close" onClick={() => setDeleteModalOpen(false)}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro de que deseas eliminar el negocio <strong>"{selectedBusiness.name}"</strong>?</p>
                
                {selectedBusiness.user && (
                  <div className="delete-options">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={deleteOwner}
                        onChange={(e) => setDeleteOwner(e.target.checked)}
                      />
                      <span>También eliminar el usuario propietario ({getOwnerName(selectedBusiness)})</span>
                    </label>
                  </div>
                )}

                <div className="warning-box">
                  <strong>⚠️ Esta acción es irreversible</strong>
                  <ul>
                    <li>Se eliminará el negocio completo</li>
                    <li>Se eliminarán todas sus reseñas</li>
                    <li>Se eliminarán todas sus relaciones</li>
                    {deleteOwner && <li>Se eliminará el usuario propietario</li>}
                  </ul>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setDeleteModalOpen(false)}>
                  Cancelar
                </button>
                <button className="btn-confirm-delete" onClick={confirmDelete}>
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast de notificaciones */}
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    </div>
  );
};

export default GestionNegocios;
