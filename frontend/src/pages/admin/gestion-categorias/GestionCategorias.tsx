import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCategories, Category, createCategory, updateCategory, deleteCategory } from '../../../services/categoryService';
import Toast from '../../../Components/Toast/Toast';
import './GestionCategorias.css';

const GestionCategorias: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getAllCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, description: category.description });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.description.trim()) {
      showToast('Por favor completa todos los campos', 'error');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.category_id, formData);
        showToast('Categoría actualizada exitosamente', 'success');
      } else {
        await createCategory(formData);
        showToast('Categoría creada exitosamente', 'success');
      }
      handleCloseModal();
      fetchCategories();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar la categoría';
      showToast(errorMessage, 'error');
    }
  };

  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCategory) return;

    try {
      await deleteCategory(selectedCategory.category_id);
      showToast('Categoría eliminada exitosamente', 'success');
      setDeleteModalOpen(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar la categoría';
      showToast(errorMessage, 'error');
    }
  };

  if (loading) {
    return (
      <div className="gestion-categorias-container">
        <div className="content-wrapper">
          <div className="header-section">
            <h1 className="page-title">Gestión de Categorías</h1>
          </div>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <p style={{ fontSize: '1.2rem', color: '#10B981' }}>Cargando categorías...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gestion-categorias-container">
        <div className="content-wrapper">
          <div className="error-message">
            <h3>❌ Error al cargar categorías</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>🔄 Reintentar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gestion-categorias-container">
      <div className="content-wrapper">
        <div className="header-section">
          <div className="header-left">
            <button className="back-button" onClick={() => navigate('/')}>
              <span>←</span>
              Regresar
            </button>
            <h1 className="page-title">Gestión de Categorías</h1>
          </div>
          <div className="header-right">
            <button
              className="add-button"
              onClick={() => handleOpenModal()}
            >
              <span>➕</span>
              Nueva Categoría
            </button>
          </div>
        </div>

        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-number">{categories.length}</div>
            <div className="stat-label">Total de Categorías</div>
          </div>
        </div>

        <div className="info-box">
          <strong>ℹ️ Información</strong>
          <p>
            Las categorías son elementos fundamentales del sistema que se utilizan para clasificar los negocios.
            Estas categorías están definidas en el backend y se cargan automáticamente al iniciar el sistema.
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏷️</div>
            <p>No se encontraron categorías en el sistema</p>
          </div>
        ) : (
          <div className="categories-grid">
            {categories.map((category, index) => (
              <div
                key={category.category_id}
                className="category-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="category-header">
                  <div className="category-id">ID: {category.category_id}</div>
                  <div className="category-icon">🏷️</div>
                </div>
                <div className="category-body">
                  <h3 className="category-name">{category.name}</h3>
                  <p className="category-description">{category.description}</p>
                </div>
                <div className="category-actions">
                  <button
                    className="btn-edit-cat"
                    onClick={() => handleOpenModal(category)}
                    title="Editar categoría"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className="btn-delete-cat"
                    onClick={() => handleDeleteClick(category)}
                    title="Eliminar categoría"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal para crear/editar categoría */}
        {modalOpen && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingCategory ? '✏️ Editar Categoría' : '➕ Nueva Categoría'}</h2>
                <button className="modal-close" onClick={handleCloseModal}>
                  ✕
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label htmlFor="name">Nombre de la Categoría *</label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Supermercado, Restaurante, etc."
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="description">Descripción *</label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe el tipo de negocios que incluye esta categoría"
                      rows={4}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-save">
                    {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de confirmación para eliminar */}
        {deleteModalOpen && selectedCategory && (
          <div className="modal-overlay" onClick={() => setDeleteModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🗑️ Eliminar Categoría</h2>
                <button className="modal-close" onClick={() => setDeleteModalOpen(false)}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <p>
                  ¿Estás seguro de que deseas eliminar la categoría <strong>"{selectedCategory.name}"</strong>?
                </p>
                <div className="warning-box">
                  <strong>⚠️ Advertencia</strong>
                  <p>
                    Esta acción eliminará la categoría del sistema. Los negocios asociados a esta categoría
                    perderán esta clasificación.
                  </p>
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

export default GestionCategorias;
