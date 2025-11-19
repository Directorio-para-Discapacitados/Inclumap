import React, { useState, useEffect } from "react";
import "./registro.css";
import { Eye, EyeOff, HelpCircle, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useJsApiLoader } from "@react-google-maps/api";
import LocationPicker from "../LocationPicker/LocationPicker";
import CategoryMultiSelect from "../../Components/CategoryMultiSelect/CategoryMultiSelect";
import { getAllCategories, Category } from "../../services/categoryService";

const API_URL = "http://localhost:9080";
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

const accesibilidades = [
  { id: 1, nombre: "Rampa", desc: "Rampa para sillas de ruedas" },
  { id: 2, nombre: "Baño Adaptado", desc: "Baño con barras y espacio suficiente" },
  { id: 3, nombre: "Parqueadero", desc: "Espacio reservado para discapacitados" },
  { id: 4, nombre: "Puertas anchas", desc: "Puertas de mínimo 80 cm de ancho" },
  { id: 5, nombre: "Circulación interior", desc: "Pasillos amplios y sin obstáculos" },
  { id: 6, nombre: "Ascensor", desc: "Ascensor con señalización accesible" },
  { id: 7, nombre: "Pisos seguros", desc: "Superficie firme y antideslizante" },
  { id: 8, nombre: "Barras de apoyo", desc: "Espacios con barras laterales" },
  { id: 9, nombre: "Lavamanos accesible", desc: "Altura adecuada para silla de ruedas" },
  { id: 10, nombre: "Mostrador accesible", desc: "Puntos de atención a menor altura" },
  { id: 11, nombre: "Señalización SIA", desc: "Símbolo internacional de accesibilidad" },
  { id: 12, nombre: "Braille/táctil", desc: "Letreros en Braille o relieve" },
];

export default function Registro() {
  const [isBusiness, setIsBusiness] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [coordinates, setCoordinates] = useState("0,0");
  const [selectedAccessibility, setSelectedAccessibility] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState<string>("");
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  // Estados para el mapa modal
  const [showMap, setShowMap] = useState(false);
  const [mapInitialCoords, setMapInitialCoords] = useState({ lat: 4.6097, lng: -74.0817 });
  const [locationDetected, setLocationDetected] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const [formData, setFormData] = useState({
    user_email: "",
    user_password: "",
    firstName: "",
    firstLastName: "",
    cellphone: "",
    address: "",
    gender: "",
    business_name: "",
    business_address: "",
    NIT: "",
    description: "",
  });

  // 2. Cargar API de Google (Una sola vez)
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script', 
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries,
    language: 'es',
  });

  // Función de geocodificación interna (Auto-detectar al entrar)
  const geocodePosition = (lat: number, lng: number) => {
    if (!window.google || !window.google.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const cleanAddress = results[0].formatted_address.replace(", Colombia", "");
        setFormData(prev => ({
          ...prev,
          // Llenamos ambas por defecto, pero el usuario puede editarlas
          address: prev.address || cleanAddress,
          business_address: prev.business_address || cleanAddress 
        }));
      }
    });
  };

  // Cargar categorías disponibles
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getAllCategories();
        setCategories(data);
      } catch (error) {
        console.error("Error al cargar categorías:", error);
        setCategoriesError("No se pudieron cargar las categorías. Intenta nuevamente.");
        toast.error("❌ Error al cargar las categorías", { 
          position: "top-center", 
          autoClose: 4000 
        });
      }
    };
    loadCategories();
  }, []);

  // Auto-detectar ubicación al cargar
  useEffect(() => {
    if (navigator.geolocation && isLoaded) {
      setIsDetectingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoordinates(`${latitude},${longitude}`);
          setMapInitialCoords({ lat: latitude, lng: longitude }); // Esto centra el mapa al abrirlo
          setLocationDetected(true);
          setIsDetectingLocation(false);
          
          // Llenar campos automáticamente
          geocodePosition(latitude, longitude);
          toast.info("📍 Ubicación detectada automáticamente", { 
            position: "top-center", 
            autoClose: 3000 
          });
        },
        (error) => {
          console.warn("Error al obtener ubicación:", error);
          setCoordinates("0,0");
          setLocationDetected(false);
          setIsDetectingLocation(false);
          toast.warning("⚠️ No se pudo detectar tu ubicación. Puedes seleccionarla manualmente en el mapa.", {
            position: "top-center",
            autoClose: 4000
          });
        }
      );
    }
  }, [isLoaded]);

  // Manejar confirmación del mapa
  const handleMapConfirm = (lat: number, lng: number, address?: string) => {
    setCoordinates(`${lat},${lng}`);
    setMapInitialCoords({ lat, lng }); // Actualizar coordenadas para futuros usos del mapa
    if (address) {
      setFormData(prev => ({
        ...prev,
        business_address: address // Solo actualizamos la del negocio
      }));
      toast.success("📍 Dirección actualizada desde el mapa", { 
        position: "top-center", 
        autoClose: 2000 
      });
    }
    setShowMap(false);
  };

  // Función para abrir el mapa y detectar ubicación si no está disponible
  const handleOpenMap = () => {
    // Si ya tenemos ubicación, abrir directamente
    if (locationDetected) {
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
          setLocationDetected(true);
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
          // Abrir el mapa de todas formas con ubicación por defecto
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
      // Si no hay soporte de geolocalización, abrir directamente
      setShowMap(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const togglePassword = () => setMostrarPassword(!mostrarPassword);
  const validarPassword = (password: string): boolean => /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

  const handleAccessibilityChange = (id: number) => {
    setSelectedAccessibility((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (isBusiness && step < 3) setStep(step + 1);
    if (!isBusiness && step < 2) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarPassword(formData.user_password)) {
      toast.warning("⚠️ La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.", { position: "top-center", autoClose: 4000 });
      return;
    }

    // Validar que se haya seleccionado al menos una categoría para negocios
    if (isBusiness && selectedCategories.length === 0) {
      toast.warning("⚠️ Debes seleccionar al menos una categoría para tu negocio.", { position: "top-center", autoClose: 4000 });
      return;
    }

    const endpoint = isBusiness ? `${API_URL}/auth/registerBusiness` : `${API_URL}/auth/register`;
    const payload = isBusiness
      ? { ...formData, NIT: Number(formData.NIT), coordinates: coordinates || "0,0", rolIds: [2, 3], accessibilityIds: selectedAccessibility, categoryIds: selectedCategories }
      : { ...formData, rolIds: [2] };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Error del servidor: ${res.status}`);

      toast.success("✅ Registro exitoso", { position: "top-center", autoClose: 2500, onClose: () => navigate("/login") });
    } catch (error: any) {
      toast.error(`❌ ${error.message || "Error al registrar"}`, { position: "top-center", autoClose: 4000 });
    }
  };

  return (
    <div className="registro-fondo">
      {/* 3. Modal del Mapa: Pasamos isLoaded para evitar crash */}
      {showMap && (
        <LocationPicker 
          initialLat={mapInitialCoords.lat}
          initialLng={mapInitialCoords.lng}
          onConfirm={handleMapConfirm}
          onCancel={() => setShowMap(false)}
        />
      )}

      <form className="registro-form" onSubmit={handleSubmit}>
        <h2 className="registro-titulo">
          {isBusiness ? "Registra tu negocio" : "Registro de persona"}
        </h2>

        <div className="registro-switch-buttons">
          <button type="button" className={!isBusiness ? "activo" : ""} onClick={() => { setIsBusiness(false); setStep(1); }}>Persona</button>
          <button type="button" className={isBusiness ? "activo" : ""} onClick={() => { setIsBusiness(true); setStep(1); }}>Negocio</button>
        </div>

        {step === 1 && (
          <div className="fade-in">
            <input name="user_email" type="email" placeholder="Correo electrónico" value={formData.user_email} onChange={handleChange} required />
            <div className="password-container">
              <input name="user_password" type={mostrarPassword ? "text" : "password"} placeholder="Contraseña" value={formData.user_password} onChange={handleChange} required />
              <button type="button" onClick={togglePassword} className="password-toggle">
                {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <input name="firstName" type="text" placeholder="Nombre" value={formData.firstName} onChange={handleChange} required />
            <input name="firstLastName" type="text" placeholder="Apellido" value={formData.firstLastName} onChange={handleChange} required />
            <button type="button" className="registro-btn" onClick={handleNext}>Siguiente</button>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <input name="cellphone" type="text" placeholder="Celular" value={formData.cellphone} onChange={handleChange} required />
            
            {/* Dirección personal (Texto normal, sin mapa) */}
            <input 
              name="address" 
              type="text" 
              placeholder="Dirección de residencia" 
              value={formData.address} 
              onChange={handleChange} 
              required 
            />

            <select name="gender" value={formData.gender} onChange={handleChange} required>
              <option value="">Selecciona tu género</option>
              <option value="f">Femenino</option>
              <option value="m">Masculino</option>
              <option value="o">Otro</option>
            </select>

            {isBusiness ? (
              <>
                <input name="business_name" type="text" placeholder="Nombre del negocio" value={formData.business_name} onChange={handleChange} required />
                
                {/* Dirección del negocio (CON BOTÓN DE MAPA) */}
                <div className="input-with-action">
                  <input 
                    name="business_address" 
                    type="text" 
                    placeholder="Dirección del negocio (o selecciona en mapa 👉)" 
                    value={formData.business_address} 
                    onChange={handleChange} 
                    required 
                    style={{ flex: 1 }} 
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
                
                {/* Indicador de ubicación detectada */}
                {locationDetected && coordinates !== "0,0" && (
                  <div className="location-status-info">
                    <span className="location-icon">✓</span>
                    <span className="location-text">Ubicación detectada: {coordinates}</span>
                  </div>
                )}

                <input name="NIT" type="number" placeholder="NIT" value={formData.NIT} onChange={handleChange} required />
                <div className="registro-step-buttons">
                  <button type="button" className="registro-btn secondary" onClick={handlePrev}>Atrás</button>
                  <button type="button" className="registro-btn" onClick={handleNext}>Siguiente</button>
                </div>
              </>
            ) : (
              <div className="registro-step-buttons">
                <button type="button" className="registro-btn secondary" onClick={handlePrev}>Atrás</button>
                <button type="submit" className="registro-btn">Registrarse</button>
              </div>
            )}
          </div>
        )}

        {step === 3 && isBusiness && (
          <div className="fade-in">
            <textarea name="description" placeholder="Descripción del negocio" value={formData.description} onChange={handleChange} rows={3} required />
            
            {/* Selector de categorías */}
            <CategoryMultiSelect
              categories={categories}
              selectedCategoryIds={selectedCategories}
              onChange={setSelectedCategories}
              error={categoriesError}
            />
            
            <h3 className="accesibilidad-titulo">Selecciona la accesibilidad de tu local</h3>
            <div className="accesibilidad-grid">
              {accesibilidades.map((item) => (
                <div key={item.id} className={`accesibilidad-boton ${selectedAccessibility.includes(item.id) ? "seleccionado" : ""}`} onClick={() => handleAccessibilityChange(item.id)}>
                  <span className="accesibilidad-nombre">{item.nombre}</span>
                  <div className="tooltip-wrapper">
                    <HelpCircle className="help-icon" size={18} />
                    <span className="tooltip-text">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="registro-step-buttons">
              <button type="button" className="registro-btn secondary" onClick={handlePrev}>Atrás</button>
              <button type="submit" className="registro-btn">Registrarse</button>
            </div>
          </div>
        )}

        <p className="registro-login-text">
          ¿Ya tienes una cuenta? <a href="/login" className="registro-login-link">Inicia sesión</a>
        </p>
      </form>
      <ToastContainer theme="colored" newestOnTop pauseOnHover />
    </div>
  );
}