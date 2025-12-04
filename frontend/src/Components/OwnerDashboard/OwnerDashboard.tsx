import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { getBusinessStatistics, BusinessStatistics } from "../../services/ownerStatistics";
import { api } from "../../config/api";
import { RefreshCw } from "lucide-react";
import { businessImagesService } from "../../services/businessImages";
import { toast } from "react-toastify";
import MetricsGrid from "./MetricsGrid";
import RatingDistribution from "./RatingDistribution";
import VisitsChart from "./VisitsChart";
import SentimentAnalysis from "./SentimentAnalysis";
import RecentReviews from "./RecentReviews";
import AccessibilityScore from "./AccessibilityScore";
import QuickActions from "./QuickActions";
import "./OwnerDashboard.css";

export default function OwnerDashboard() {
  const { user } = useAuth() || {};
  const [statistics, setStatistics] = useState<BusinessStatistics | null>(null);
  const [businessId, setBusinessId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [businessLogo, setBusinessLogo] = useState<string | null>(null);
  const [businessImages, setBusinessImages] = useState<{ id: number; url: string }[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [filePreviewMap, setFilePreviewMap] = useState<Map<number, string>>(new Map());
  const [hoveredFileIndex, setHoveredFileIndex] = useState<number | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchBusinessAndStatistics = async () => {
      if (!user?.user_id) return;

      try {
        setLoading(true);
        
        // Obtener el negocio del propietario (asociación usuario-negocio)
        const response = await api.get(`/user/${user.user_id}/business`);
        const business = response.data;

        if (!business?.business_id) {
          setError("No tienes un negocio asignado");
          setLoading(false);
          return;
        }

        setBusinessId(business.business_id);

        // Intentar obtener imágenes directamente del negocio; si no vienen, consultar detalle del negocio
        let images: { id: number; url: string }[] = Array.isArray(business.images)
          ? business.images
          : [];

        let name: string | null = business.business_name || user.displayName || null;
        let logo: string | null = business.logo_url || null;

        if ((!images || images.length === 0 || !logo) && business.business_id) {
          try {
            const businessDetailResp = await api.get(`/business/${business.business_id}`);
            const businessDetail = businessDetailResp.data;

            if (Array.isArray(businessDetail.images)) {
              images = businessDetail.images;
            }

            if (businessDetail.business_name) {
              name = businessDetail.business_name;
            }

            if (businessDetail.logo_url) {
              logo = businessDetail.logo_url;
            }
          } catch (detailError) {

          }
        }

        setBusinessName(name);
        setBusinessLogo(logo);
        setBusinessImages(images || []);

        // Obtener estadísticas
        const stats = await getBusinessStatistics(business.business_id);
        setStatistics(stats);
        setError(null);
      } catch (err: any) {

        setError(err.response?.data?.message || "Error al cargar las estadísticas");
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessAndStatistics();
  }, [user?.user_id]);

  const handleOpenImage = (url: string) => {
    setSelectedImage(url);
  };

  const handleCloseImage = () => {
    setSelectedImage(null);
  };

  const handleGalleryImagesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !businessId) return;

    // Convertir FileList a Array
    const filesArray = Array.from(files);

    // Validar que no supere 5 imágenes
    if (filesArray.length > 5) {
      toast.error('Solo puedes subir un máximo de 5 imágenes por vez');
      return;
    }

    setPendingFiles(filesArray);

    // Generar previsualizaciones
    const previewMap = new Map<number, string>();
    for (let i = 0; i < filesArray.length; i++) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          previewMap.set(i, event.target.result as string);
          if (previewMap.size === filesArray.length) {
            setFilePreviewMap(new Map(previewMap));
          }
        }
      };
      reader.readAsDataURL(filesArray[i]);
    }

    setShowUploadConfirm(true);
  };

  const handleRemoveFile = (indexToRemove: number) => {
    const updatedFiles = pendingFiles.filter((_, index) => index !== indexToRemove);
    setPendingFiles(updatedFiles);

    // Actualizar previsualizaciones
    const updatedPreviewMap = new Map(filePreviewMap);
    updatedPreviewMap.delete(indexToRemove);
    setFilePreviewMap(updatedPreviewMap);

    // Si no hay más archivos, cerrar el modal
    if (updatedFiles.length === 0) {
      setShowUploadConfirm(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (pendingFiles.length === 0 || !businessId) return;

    try {
      setIsUploadingImages(true);
      setShowUploadConfirm(false);
      
      // Mostrar notificación de carga en verde
      const loadingToastId = toast.loading(
        `Subiendo ${pendingFiles.length} imagen(es)...`,
        {
          position: "top-right",
          style: {
            backgroundColor: '#10b981',
            color: '#ffffff',
          },
        }
      );

      const result = await businessImagesService.uploadImages(businessId, pendingFiles);
      
      // Descartar la notificación de carga
      toast.dismiss(loadingToastId);

      // La respuesta tiene { message: string, images: Array }
      toast.success(result.message || `${pendingFiles.length} imagen(es) subida(s) correctamente`, {
        position: "top-right",
        autoClose: 3000
      });
      
      // Actualizar la lista de imágenes con las nuevas
      if (result.images && Array.isArray(result.images) && result.images.length > 0) {
        setBusinessImages(prev => [...prev, ...result.images]);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al subir las imágenes", {
        position: "top-right",
        autoClose: 4000
      });
    } finally {
      setIsUploadingImages(false);
      setPendingFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCancelUpload = () => {
    setShowUploadConfirm(false);
    setPendingFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRefresh = async () => {
    if (!businessId || refreshing) return;
    
    try {
      setRefreshing(true);
      const stats = await getBusinessStatistics(businessId);
      setStatistics(stats);
    } catch (err: any) {

    } finally {
      setRefreshing(false);
    }
  };

  // Funciones del carrusel
  const handlePrevImage = () => {
    if (businessImages.length === 0) return;
    setCarouselIndex((prev) => (prev === 0 ? businessImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (businessImages.length === 0) return;
    setCarouselIndex((prev) => (prev === businessImages.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setCarouselIndex(index);
  };

  const handleDeleteImage = (imageId: number) => {
    setImageToDelete(imageId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!businessId || !imageToDelete) return;

    try {

      setIsDeletingImage(true);
      await businessImagesService.deleteImage(businessId, imageToDelete);
      
      // Actualizar la lista de imágenes removiendo la eliminada
      const updatedImages = businessImages.filter((img) => img.id !== imageToDelete);
      setBusinessImages(updatedImages);
      
      // Ajustar el índice del carrusel si es necesario
      if (updatedImages.length > 0) {
        if (carouselIndex >= updatedImages.length) {
          setCarouselIndex(updatedImages.length - 1);
        }
      } else {
        setCarouselIndex(0);
      }
      
      toast.success('Imagen eliminada correctamente', {
        position: "top-right",
        autoClose: 3000
      });
      setShowDeleteConfirm(false);
      setImageToDelete(null);
    } catch (error: any) {

      toast.error(error.message || 'Error al eliminar la imagen', {
        position: "top-right",
        autoClose: 4000
      });
    } finally {
      setIsDeletingImage(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setImageToDelete(null);
  };

  if (loading) {
    return (
      <div className="owner-dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando tu dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="owner-dashboard-error">
        <div className="error-icon">⚠️</div>
        <h3>No se pudieron cargar las estadísticas</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!statistics || !businessId) {
    return null;
  }

  return (
    <div className="owner-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>
            👋 Bienvenido, <span className="business-name">{user?.displayName}</span>
          </h1>
          <div className="header-actions">
            <button 
              className={`refresh-button ${refreshing ? 'spinning' : ''}`}
              onClick={handleRefresh}
              disabled={refreshing}
              title="Actualizar estadísticas"
            >
              <RefreshCw size={20} />
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
            <div className="verification-badge">
              {user?.verified ? (
                <span className="badge verified">✅ Verificado</span>
              ) : (
                <span className="badge pending">⚠️ Pendiente de verificación</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <MetricsGrid 
        statistics={statistics} 
        businessImages={businessImages}
        businessName={businessName}
        onImageClick={handleOpenImage}
      />

      <div className="dashboard-grid">
        <div className="dashboard-column-main">
          <RatingDistribution distribution={statistics.rating.distribution} />
          <VisitsChart views={statistics.views} />
          <SentimentAnalysis sentiment={statistics.reviews.sentiment} />
          <RecentReviews
            reviews={statistics.recentReviews}
            businessId={businessId}
            businessLogo={businessLogo}
            limit={2}
            onReplyUpdated={handleRefresh}
          />

          {/* Galería de tu local - Siempre visible */}
          <div id="gallery" className="dashboard-card owner-photos-card">
            <h3 className="card-title">Galería de tu local</h3>
            
            {businessImages.length > 0 ? (
              <>
                {/* Carrusel principal */}
                <div className="carousel-container">
                  {/* Imagen principal */}
                  <div className="carousel-main">
                    <img
                      src={businessImages[carouselIndex]?.url}
                      alt={`Foto ${carouselIndex + 1}`}
                      className="carousel-main-image"
                    />
                    
                    {/* Botón de eliminar */}
                    <button
                      className="carousel-delete-btn"
                      onClick={() => handleDeleteImage(businessImages[carouselIndex]?.id)}
                      title="Eliminar esta imagen"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                    
                    {/* Botones de navegación */}
                    <button
                      className="carousel-nav-btn carousel-prev"
                      onClick={handlePrevImage}
                      title="Imagen anterior"
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    
                    <button
                      className="carousel-nav-btn carousel-next"
                      onClick={handleNextImage}
                      title="Siguiente imagen"
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                    
                    {/* Indicador de progreso */}
                    <div className="carousel-counter">
                      {carouselIndex + 1} / {businessImages.length}
                    </div>
                  </div>
                  
                  {/* Miniaturas y botón de agregar */}
                  <div className="carousel-thumbnails-section">
                    <div className="carousel-thumbnails">
                      {businessImages.map((img, index) => (
                        <div key={img.id} className="carousel-thumbnail-wrapper">
                          <button
                            className={`carousel-thumbnail ${index === carouselIndex ? 'active' : ''}`}
                            onClick={() => handleThumbnailClick(index)}
                            title={`Ir a foto ${index + 1}`}
                          >
                            <img src={img.url} alt={`Miniatura ${index + 1}`} />
                          </button>
                          <button
                            className="carousel-thumbnail-delete"
                            onClick={() => handleDeleteImage(img.id)}
                            title="Eliminar imagen"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {/* Botón para agregar más imágenes */}
                    <label className="add-photo-carousel">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleGalleryImagesSelect}
                        disabled={isUploadingImages}
                        style={{ display: "none" }}
                      />
                      <div className="add-photo-carousel-icon">
                        {isUploadingImages ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fas fa-plus"></i>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </>
            ) : (
              /* Sin imágenes - mostrar área de carga */
              <div className="gallery-empty-state">
                <div className="empty-state-icon">
                  <i className="fas fa-image"></i>
                </div>
                <h4>Sin imágenes aún</h4>
                <p>Sube fotos de tu local para que los clientes vean cómo es tu negocio</p>
                <label className="gallery-upload-btn-empty">
                  <i className="fas fa-cloud-upload-alt"></i>
                  <span>Subir imágenes</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleGalleryImagesSelect}
                    disabled={isUploadingImages}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-column-sidebar">
          <AccessibilityScore accessibility={statistics.accessibility} />
          <QuickActions businessId={businessId} />
        </div>
      </div>

      {/* Modal de confirmación para subir imágenes */}
      {showUploadConfirm && (
        <div className="upload-confirm-modal-overlay" onClick={handleCancelUpload}>
          <div className="upload-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="upload-confirm-header">
              <i className="fas fa-images"></i>
              <h3>Confirmar subida de imágenes</h3>
            </div>
            <div className="upload-confirm-body">
              <p>¿Deseas subir {pendingFiles.length} imagen(es) a la galería?</p>
              <div className="upload-preview">
                {pendingFiles.map((file, index) => (
                  <div
                    key={index}
                    className="upload-preview-item"
                    onMouseEnter={() => setHoveredFileIndex(index)}
                    onMouseLeave={() => setHoveredFileIndex(null)}
                  >
                    {hoveredFileIndex === index && filePreviewMap.get(index) ? (
                      <>
                        <img
                          src={filePreviewMap.get(index)}
                          alt={`Vista previa de ${file.name}`}
                          className="upload-preview-thumbnail"
                        />
                        <div className="upload-preview-content">
                          <span className="upload-file-name">{file.name}</span>
                          <span className="upload-file-size">
                            {(file.size / 1024).toFixed(2)} KB
                          </span>
                        </div>
                        <button
                          className="upload-remove-btn"
                          onClick={() => handleRemoveFile(index)}
                          title="Eliminar esta imagen"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-file-image"></i>
                        <span>{file.name}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="upload-confirm-actions">
              <button 
                className="upload-cancel-btn" 
                onClick={handleCancelUpload}
                disabled={isUploadingImages}
              >
                Cancelar
              </button>
              <button 
                className="upload-confirm-btn" 
                onClick={handleConfirmUpload}
                disabled={isUploadingImages}
              >
                {isUploadingImages ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Subiendo...
                  </>
                ) : (
                  <>
                    <i className="fas fa-upload"></i> Subir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar imagen */}
      {showDeleteConfirm && (
        <div className="delete-confirm-modal-overlay" onClick={handleCancelDelete}>
          <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-header">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            
            <div className="delete-confirm-content">
              <h3>Eliminar imagen</h3>
              <p>¿Estás seguro de que deseas eliminar esta imagen? Esta acción no se puede deshacer.</p>
            </div>
            
            <div className="delete-confirm-actions">
              <button
                className="delete-cancel-btn"
                onClick={handleCancelDelete}
                disabled={isDeletingImage}
              >
                <i className="fas fa-times"></i>
                Cancelar
              </button>
              <button
                className="delete-confirm-btn"
                onClick={handleConfirmDelete}
                disabled={isDeletingImage}
              >
                {isDeletingImage ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash-alt"></i>
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="image-modal-overlay" onClick={handleCloseImage}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt={businessName || "Foto del local"} />
            <button
              type="button"
              className="image-modal-close"
              onClick={handleCloseImage}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
