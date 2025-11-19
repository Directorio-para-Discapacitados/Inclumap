import React, { useState, useEffect, useRef } from "react";
import "./OwnerBusinessProfile.css";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { localRecognitionService } from "../../services/localRecognition";
import { businessLogoService } from "../../services/businessLogo";
import { useJsApiLoader } from "@react-google-maps/api";
import LocationPicker from "../../pages/LocationPicker/LocationPicker";
import { MapPin } from "lucide-react";
import CategoryMultiSelect from "../CategoryMultiSelect/CategoryMultiSelect";
import { getAllCategories, Category } from "../../services/categoryService";

interface BusinessCategory {
  category_id: number;
  category: {
    category_id: number;
    name: string;
    description: string;
  };
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

interface BusinessData {
  business_id: number;
  business_name: string;
  address: string;
  NIT: string;
  description: string;
  logo_url?: string | null;
  verified?: boolean;
  coordinates?: string;
  latitude?: number;
  longitude?: number;
  business_categories?: BusinessCategory[];
}

interface EditState {
  business_name: string;
  business_address: string;
  description: string;
  logo?: File;
  logoPreview?: string;
  categoryIds: number[];
}

const API_URL = "http://localhost:9080";

export default function OwnerBusinessProfile() {
  const { user, refreshUser } = useAuth() || {};
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<EditState>({
    business_name: "",
    business_address: "",
    description: "",
    categoryIds: [],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para categorías
  const [categories, setCategories] = useState<Category[]>([]);

  // Estados para el mapa
  const [showMap, setShowMap] = useState(false);
  const [coordinates, setCoordinates] = useState<string>("");
  const [mapInitialCoords, setMapInitialCoords] = useState({ lat: 1.1522, lng: -76.6526 });
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries,
    language: 'es',
  });

  // Cargar categorías disponibles
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await getAllCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error al cargar categorías:", error);
      }
    };

    loadCategories();
  }, []);

  // Obtener datos del negocio del usuario
  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("No hay sesión activa");
          return;
        }

        // Obtener todos los negocios
        const response = await fetch(`${API_URL}/business`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Error al obtener negocios (${response.status})`);
        }

        const businesses = await response.json();
        
        // Filtrar el negocio del usuario actual (propietario)
        const userBusiness = businesses.find((b: any) => 
          b.user && b.user.user_id === user?.user_id
        );

        if (!userBusiness) {
          setBusinessData(null);
          setIsLoading(false);
          return;
        }

        setBusinessData(userBusiness);
        
        // Extraer IDs de categorías
        const categoryIds = userBusiness.business_categories?.map(
          (bc: BusinessCategory) => bc.category.category_id
        ) || [];
        
        setEditData({
          business_name: userBusiness.business_name,
          business_address: userBusiness.address,
          description: userBusiness.description,
          logoPreview: userBusiness.logo_url,
          categoryIds: categoryIds,
        });

        // Configurar coordenadas si existen
        if (userBusiness.coordinates) {
          setCoordinates(userBusiness.coordinates);
          const [lat, lng] = userBusiness.coordinates.split(',').map(Number);
          if (!isNaN(lat) && !isNaN(lng)) {
            setMapInitialCoords({ lat, lng });
          }
        } else if (userBusiness.latitude && userBusiness.longitude) {
          setCoordinates(`${userBusiness.latitude},${userBusiness.longitude}`);
          setMapInitialCoords({ lat: userBusiness.latitude, lng: userBusiness.longitude });
        }
      } catch (error: any) {
        toast.error("Error al cargar los datos del negocio");
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.roleDescription === "Propietario") {
      fetchBusinessData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Funciones para el mapa
  const handleMapConfirm = (lat: number, lng: number, address?: string) => {
    setCoordinates(`${lat},${lng}`);
    setMapInitialCoords({ lat, lng });
    if (address) {
      setEditData(prev => ({ ...prev, business_address: address }));
      toast.success("📍 Dirección actualizada desde el mapa", {
        position: "top-center",
        autoClose: 2000
      });
    } else {
      toast.success("📍 Coordenadas exactas guardadas", {
        position: "top-center",
        autoClose: 2000
      });
    }
    setShowMap(false);
  };

  const handleOpenMap = () => {
    // Si ya tenemos ubicación, abrir directamente
    if (coordinates) {
      setShowMap(true);
      return;
    }
    // Si no, intentar detectar antes de abrir
    if (navigator.geolocation && isLoaded) {
      setIsDetectingLocation(true);
      toast.info("🔍 Detectando tu ubicación actual...", {
        position: "top-center",
        autoClose: 2000
      });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoordinates(`${latitude},${longitude}`);
          setMapInitialCoords({ lat: latitude, lng: longitude });
          setIsDetectingLocation(false);
          setShowMap(true);
          toast.success("✅ Ubicación detectada", {
            position: "top-center",
            autoClose: 2000
          });
        },
        (error) => {
          console.warn("Error al obtener ubicación:", error);
          setIsDetectingLocation(false);
          setShowMap(true);
          toast.warning("⚠️ No se pudo detectar tu ubicación automáticamente. Selecciona manualmente en el mapa.", {
            position: "top-center",
            autoClose: 4000
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      setShowMap(true);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Solo se aceptan imágenes JPG, PNG o WebP");
      return;
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar 5MB");
      return;
    }

    // Crear preview inmediato
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditData(prev => ({
        ...prev,
        logoPreview: e.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);

    // Validar imagen con Google Vision
    validateLogoWithGoogleVision(file);
  };

  const validateLogoWithGoogleVision = async (file: File) => {
    try {
      const toastId = toast.info("🔍 Validando imagen del logo con Google Vision...", { 
        autoClose: false,
        closeButton: false 
      });
      
      const result = await localRecognitionService.recognizeLocal(file);
      
      toast.dismiss(toastId);
      
      if (result.confidence >= 0.7) {
        // ✅ APROBADA - Permite subir la imagen
        toast.success(`✅ Logo validado (${Math.round(result.confidence * 100)}% confianza)`, { 
          autoClose: 3000,
          closeButton: false,
          position: "top-right"
        });
        setEditData(prev => ({
          ...prev,
          logo: file,
        }));
      } else {
        // ❌ RECHAZADA - No permite subir
        toast.error(`❌ Imagen rechazada (${Math.round(result.confidence * 100)}% confianza)`, { 
          autoClose: 3500,
          closeButton: false,
          position: "top-right"
        });
        // NO guardar el archivo - rechazar completamente
        setEditData(prev => ({
          ...prev,
          logo: undefined,
          logoPreview: businessData?.logo_url || undefined,
        }));
      }
    } catch (error: any) {
      toast.error("❌ Error al validar. Intenta de nuevo.", { 
        autoClose: 3000,
        closeButton: false,
        position: "top-right"
      });
      // Rechazar en caso de error
      setEditData(prev => ({
        ...prev,
        logo: undefined,
        logoPreview: businessData?.logo_url || undefined,
      }));
    }
  };

  const handleSave = async () => {
    if (!editData.business_name.trim()) {
      toast.error("El nombre del negocio es requerido");
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No hay sesión activa");
        return;
      }

      // Traer el estado de verificación ACTUAL del backend
      // Solo modificarlo si hay imagen NUEVA
      let verificationStatus = businessData?.verified || false;

      // Si hay una NUEVA imagen, re-validarla
      if (editData.logo) {
        try {
          const processingToastId = toast.info("📸 Validando logo para guardar...", { 
            autoClose: false,
            closeButton: false 
          });
          
          const validationResult = await localRecognitionService.recognizeLocal(editData.logo);
          
          toast.dismiss(processingToastId);
          
          if (validationResult.confidence >= 0.7) {
            // ✅ APROBADA - Proceder
            verificationStatus = true;
            toast.success(`✅ Logo verificado (${Math.round(validationResult.confidence * 100)}%)`, { 
              autoClose: 2500,
              closeButton: false,
              position: "top-right"
            });
            try {
              await businessLogoService.uploadLogo(editData.logo);
              toast.success("✅ Logo subido", { 
                autoClose: 2000,
                position: "top-right",
                closeButton: false
              });
            } catch (logoError) {
              toast.warning("⚠️ Error al subir logo", { 
                autoClose: 2500,
                position: "top-right",
                closeButton: false
              });
            }
          } else {
            // ❌ RECHAZADA - No permitir guardar
            toast.error(`❌ Guardado cancelado: La imagen no cumple requisitos (${Math.round(validationResult.confidence * 100)}% confianza). Sube una imagen de tu negocio.`, { 
              autoClose: 4000,
              closeButton: false,
              position: "top-right",
              draggable: false
            });
            setIsSaving(false);
            return;
          }
        } catch (error) {
          toast.error("❌ Error al validar imagen - Guardado cancelado", { 
            autoClose: 3500, 
            position: "top-right",
            closeButton: false,
            draggable: false
          });
          setIsSaving(false);
          return;
        }
      }

      // Paso 2: Actualizar datos del negocio
      const requestBody: any = {
        business_name: editData.business_name,
        address: editData.business_address,
        description: editData.description,
      };
      
      // Incluir coordenadas si existen y no son vacías
      if (coordinates && coordinates !== "0,0" && coordinates.trim() !== "") {
        requestBody.coordinates = coordinates;
      }
      
      // Siempre incluir categorías (puede ser array vacío)
      requestBody.categoryIds = editData.categoryIds || [];
      
      // SOLO incluir 'verified' si hay una NUEVA imagen (la cual ya fue validada)
      if (editData.logo) {
        requestBody.verified = verificationStatus;
      }

      console.log('📤 Sending update request:', requestBody);
      
      const response = await fetch(
        `${API_URL}/business/${businessData?.business_id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Error response:', errorData);
        throw new Error("Error al actualizar el negocio");
      }

      const updatedData = await response.json();
      console.log('✅ Updated data received:', updatedData);
      
      setBusinessData(updatedData);
      
      // Actualizar también editData con los datos recibidos
      const categoryIds = updatedData.business_categories?.map(
        (bc: any) => bc.category.category_id
      ) || [];
      
      setEditData({
        business_name: updatedData.business_name,
        business_address: updatedData.address,
        description: updatedData.description,
        logoPreview: updatedData.logo_url,
        categoryIds: categoryIds,
      });
      
      // Actualizar coordenadas si vienen en la respuesta
      if (updatedData.coordinates) {
        setCoordinates(updatedData.coordinates);
      }
      
      setIsEditing(false);
      
      // Actualizar el contexto de autenticación para reflejar los cambios
      if (refreshUser) {
        await refreshUser();
      }
      
      if (verificationStatus) {
        toast.success("✅ Negocio guardado y verificado", { 
          autoClose: 3000,
          closeButton: false,
          position: "top-right"
        });
      } else {
        toast.success("✅ Cambios guardados correctamente", { 
          autoClose: 2500,
          closeButton: false,
          position: "top-right"
        });
      }
    } catch (error: any) {
      toast.error(`❌ ${error.message || "Error al guardar"}`, { 
        autoClose: 3000,
        closeButton: false,
        position: "top-right"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || user.roleDescription !== "Propietario") {
    return (
      <div className="owner-profile-container">
        <div className="no-business-message">
          <i className="fas fa-store"></i>
          <h3>No eres propietario de un negocio</h3>
          <p>Crea un negocio para acceder a esta sección</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="owner-profile-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando datos del negocio...</p>
        </div>
      </div>
    );
  }

  if (!businessData) {
    return (
      <>
      {showMap && isLoaded && (
        <LocationPicker
          initialLat={mapInitialCoords.lat}
          initialLng={mapInitialCoords.lng}
          onConfirm={handleMapConfirm}
          onCancel={() => setShowMap(false)}
        />
      )}
      <div className="owner-profile-container">
        <div className="no-business-message">
          <i className="fas fa-store"></i>
          <h3>No tienes un negocio registrado</h3>
          <p>Para usar el perfil del propietario, primero debes registrar un negocio.</p>
          <a href="/crear-negocio" className="create-business-btn">
            <i className="fas fa-plus"></i> Registrar Negocio
          </a>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      {showMap && isLoaded && (
        <LocationPicker
          initialLat={mapInitialCoords.lat}
          initialLng={mapInitialCoords.lng}
          onConfirm={handleMapConfirm}
          onCancel={() => setShowMap(false)}
        />
      )}
      <div className="owner-profile-container">
      <div className="owner-profile-card">
        <div className="profile-header">
          <h2>
            <i className="fas fa-store"></i> Perfil de Propietario
          </h2>
          {businessData.verified && (
            <div className="verified-badge">
              <i className="fas fa-check-circle"></i>
              Verificado
            </div>
          )}
        </div>

        {!isEditing ? (
          // Vista de lectura
          <div className="profile-view">
            <div className="logo-section">
              {businessData.logo_url ? (
                <div className="logo-container">
                  <img src={businessData.logo_url} alt={businessData.business_name} className="business-logo" />
                  {businessData.verified && (
                    <div className="logo-verification-badge">
                      <i className="fas fa-check-circle"></i>
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-logo">
                  <i className="fas fa-image"></i>
                  <p>Sin logo</p>
                </div>
              )}
            </div>

            <div className="business-info">
              <div className="info-item">
                <label>Nombre del Negocio</label>
                <p>{businessData.business_name}</p>
              </div>

              <div className="info-item">
                <label>Dirección</label>
                <p>{businessData.address}</p>
              </div>

              <div className="info-item">
                <label>NIT</label>
                <p>{businessData.NIT}</p>
              </div>

              <div className="info-item">
                <label>Descripción</label>
                <p>{businessData.description}</p>
              </div>

              <div className="info-item">
                <label>Categorías</label>
                <div className="categories-display">
                  {businessData.business_categories && businessData.business_categories.length > 0 ? (
                    businessData.business_categories.map((bc) => (
                      <span key={bc.category_id} className="category-badge">
                        {bc.category.name}
                      </span>
                    ))
                  ) : (
                    <p className="no-categories">Sin categorías asignadas</p>
                  )}
                </div>
              </div>
            </div>

            <div className="profile-actions">
              <button 
                className="edit-btn"
                onClick={() => {
                  setIsEditing(true);
                  if (!businessData.logo_url) {
                    toast.info("💡 Sube un logo para verificación", {
                      position: "top-right",
                      autoClose: 2500,
                      closeButton: false
                    });
                  }
                }}
              >
                <i className="fas fa-edit"></i> Editar Información
              </button>
            </div>
          </div>
        ) : (
          // Vista de edición
          <div className="profile-edit">
            <div className="logo-upload">
              <h4>Logo del Negocio</h4>
              <div 
                className="logo-upload-area"
                onClick={() => fileInputRef.current?.click()}
              >
                {editData.logoPreview ? (
                  <img src={editData.logoPreview} alt="Preview" className="logo-preview" />
                ) : (
                  <div className="upload-placeholder">
                    <i className="fas fa-cloud-upload-alt"></i>
                    <p>Clic para subir logo</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoSelect}
                style={{ display: "none" }}
              />
            </div>

            <div className="edit-form">
              <div className="form-group">
                <label>Nombre del Negocio *</label>
                <input
                  type="text"
                  name="business_name"
                  value={editData.business_name}
                  onChange={handleInputChange}
                  placeholder="Nombre del negocio"
                />
              </div>

              <div className="form-group">
                <label>Dirección *</label>
                <div className="input-with-action">
                  <input
                    type="text"
                    name="business_address"
                    value={editData.business_address}
                    onChange={handleInputChange}
                    placeholder="Dirección del negocio (o selecciona en mapa)"
                  />
                  <button
                    type="button"
                    className="map-picker-btn"
                    onClick={handleOpenMap}
                    disabled={isDetectingLocation}
                    title={isDetectingLocation ? "Detectando ubicación..." : "Seleccionar ubicación en el mapa"}
                  >
                    {isDetectingLocation ? (
                      <span style={{ fontSize: '12px' }}>...</span>
                    ) : (
                      <MapPin size={20} />
                    )}
                  </button>
                </div>
                {coordinates && coordinates !== "0,0" && (
                  <div className="location-status-info">
                    <span className="location-icon">✓</span>
                    <span className="location-text">Ubicación: {coordinates}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Descripción *</label>
                <textarea
                  name="description"
                  value={editData.description}
                  onChange={handleInputChange}
                  placeholder="Descripción del negocio"
                  rows={4}
                  maxLength={255}
                />
                <div className="character-counter">
                  <span className={editData.description.length > 255 ? 'counter-exceeded' : ''}>
                    {editData.description.length}/255 caracteres
                  </span>
                </div>
              </div>

              <div className="form-group categories-group">
                <CategoryMultiSelect
                  categories={categories}
                  selectedCategoryIds={editData.categoryIds}
                  onChange={(categoryIds) => setEditData(prev => ({ ...prev, categoryIds }))}
                />
              </div>
            </div>

            <div className="edit-actions">
              <button 
                className="cancel-btn"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                <i className="fas fa-times"></i> Cancelar
              </button>
              <button 
                className="save-btn"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="spinner-small"></span> Guardando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i> Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
