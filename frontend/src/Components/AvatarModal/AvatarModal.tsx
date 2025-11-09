// frontend/src/Components/AvatarModal/AvatarModal.tsx

import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { avatarService } from '../../services/avatarService';
import { useAuth } from '../../context/AuthContext';
import './AvatarModal.css';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
  onAvatarUpdate: (newAvatarUrl: string) => void;
}

export default function AvatarModal({ 
  isOpen, 
  onClose, 
  currentAvatar, 
  onAvatarUpdate 
}: AvatarModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, refreshUser } = useAuth();

  // Validaciones de archivo
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return 'Solo se permiten archivos de imagen (JPG, PNG, GIF, WebP)';
    }

    if (file.size > maxSize) {
      return 'El archivo debe ser menor a 5MB';
    }

    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSelectedFile(file);
    
    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user?.user_id) {
      toast.error('Selecciona una imagen primero');
      return;
    }

    setLoading(true);
    try {
      const response = await avatarService.uploadAvatar(user.user_id, selectedFile);
      
      // Actualizar el avatar en el componente padre
      onAvatarUpdate(response.avatar_url);
      
      // Actualizar el contexto de usuario
      await refreshUser();
      
      toast.success(response.message || 'Avatar actualizado exitosamente');
      handleClose();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(error instanceof Error ? error.message : 'Error al subir la imagen');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user?.user_id) return;

    if (!window.confirm('¿Estás seguro de que quieres eliminar tu foto de perfil?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await avatarService.deleteAvatar(user.user_id);
      
      // Actualizar el avatar en el componente padre (sin avatar)
      onAvatarUpdate('');
      
      // Actualizar el contexto de usuario
      await refreshUser();
      
      toast.success(response.message || 'Avatar eliminado exitosamente');
      handleClose();
    } catch (error) {
      console.error('Error deleting avatar:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar la imagen');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="avatar-modal-overlay" onClick={handleClose}>
      <div className="avatar-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="avatar-modal-header">
          <h3>Cambiar Foto de Perfil</h3>
          <button className="avatar-modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="avatar-modal-body">
          {/* Avatar actual */}
          <div className="current-avatar-section">
            <h4>Imagen Actual</h4>
            <div className="avatar-preview">
              {currentAvatar ? (
                <img src={currentAvatar} alt="Avatar actual" />
              ) : (
                <div className="no-avatar">
                  <span>Sin foto</span>
                </div>
              )}
            </div>
          </div>

          {/* Selector de archivo */}
          <div className="file-selector-section">
            <h4>Nueva Imagen</h4>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            {previewUrl ? (
              <div className="new-avatar-preview">
                <img src={previewUrl} alt="Vista previa" />
                <button 
                  className="change-image-btn" 
                  onClick={triggerFileInput}
                  disabled={loading}
                >
                  Cambiar Imagen
                </button>
              </div>
            ) : (
              <button 
                className="select-image-btn" 
                onClick={triggerFileInput}
                disabled={loading}
              >
                📁 Seleccionar Imagen
              </button>
            )}
            
            <p className="file-requirements">
              Formatos: JPG, PNG, GIF, WebP • Máximo 5MB
            </p>
          </div>
        </div>

        <div className="avatar-modal-footer">
          <button 
            className="btn-cancel" 
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </button>
          
          {currentAvatar && (
            <button 
              className="btn-delete" 
              onClick={handleDeleteAvatar}
              disabled={loading}
            >
              {loading ? 'Eliminando...' : 'Eliminar Foto'}
            </button>
          )}
          
          <button 
            className="btn-save" 
            onClick={handleUpload}
            disabled={!selectedFile || loading}
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}