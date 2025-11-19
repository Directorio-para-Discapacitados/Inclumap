import React, { useState, useEffect } from "react";
import "./CrearNegocio.css";
import { HelpCircle, MapPin } from "lucide-react"; 
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../context/AuthContext";
import { useJsApiLoader } from "@react-google-maps/api";
import LocationPicker from "../LocationPicker/LocationPicker";
import CategoryMultiSelect from "../../Components/CategoryMultiSelect/CategoryMultiSelect";
import { getAllCategories, Category } from "../../services/categoryService";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];
const API_URL = "http://localhost:9080";



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



export default function CrearNegocio() {
  const { refreshUser } = useAuth();
  const [coordinates, setCoordinates] = useState("0,0");
  const [locationDetected, setLocationDetected] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapInitialCoords, setMapInitialCoords] = useState({ lat: 4.6097, lng: -74.0817 }); // Default Bogotá
  const [selectedAccessibility, setSelectedAccessibility] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState<string>("");
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    business_name: "",
    business_address: "",
    NIT: "",
    description: "",
  });

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

  // Cargar API de Google Maps
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries,
    language: 'es',
  });

  // Función de geocodificación interna
  const geocodePosition = (lat: number, lng: number) => {
    if (!window.google || !window.google.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const cleanAddress = results[0].formatted_address.replace(", Colombia", "");
        setFormData(prev => ({
          ...prev,
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
          setMapInitialCoords({ lat: latitude, lng: longitude });
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
    setLocationDetected(true);
   
    // Si la API devolvió una dirección, autocompletarla
    if (address) {
      setFormData(prev => ({ ...prev, business_address: address }));
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


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {

    const { name, value } = e.target;

    setFormData({

      ...formData,

      [name]: value,

    });

  };



  const handleAccessibilityChange = (id: number) => {

    setSelectedAccessibility((prev) =>

      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]

    );

  };



  const handleNext = () => {

    if (step < 2) setStep(step + 1);

  };



  const handlePrev = () => {

    if (step > 1) setStep(step - 1);

  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.business_name.trim()) {
      toast.warning("⚠️ El nombre del negocio es requerido", { position: "top-center", autoClose: 4000 });
      return;
    }

    if (!formData.NIT || formData.NIT.length < 8) {
      toast.warning("⚠️ El NIT debe tener al menos 8 dígitos", { position: "top-center", autoClose: 4000 });
      return;
    }

    // Validar que se haya seleccionado al menos una categoría
    if (selectedCategories.length === 0) {
      toast.warning("⚠️ Debes seleccionar al menos una categoría para tu negocio.", { position: "top-center", autoClose: 4000 });
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem('token');
   
    if (!token) {
      toast.error("❌ No hay sesión activa.", { position: "top-center", autoClose: 4000 });
      setIsLoading(false);
      return;
    }

    const payload = {
      business_name: formData.business_name,
      business_address: formData.business_address,
      NIT: Number(formData.NIT),
      description: formData.description,
      coordinates,
      accessibilityIds: selectedAccessibility,
      categoryIds: selectedCategories,
    };



    try {

      const res = await fetch(`${API_URL}/auth/upgrade-to-business`, {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

          "Authorization": `Bearer ${token}`

        },

        body: JSON.stringify(payload),

      });



      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Error al crear el negocio");



      if (data.token) {

        localStorage.setItem('token', data.token);

        await refreshUser();

      }



      toast.success("✅ Negocio creado exitosamente", {

        position: "top-center",

        autoClose: 2000,

        onClose: () => {

           navigate("/perfil?section=owner-profile");

        },

      });

    } catch (error: any) {

      toast.error(`❌ ${error.message}`, { position: "top-center", autoClose: 4000 });

    } finally {

      setIsLoading(false);

    }

  };



  return (

    <div className="crear-negocio-fondo">

      {/* Renderizar el modal del mapa si está activo */}

      {showMap && (

        <LocationPicker
          initialLat={mapInitialCoords.lat}
          initialLng={mapInitialCoords.lng}
          onConfirm={handleMapConfirm}
          onCancel={() => setShowMap(false)}

        />

      )}



      <form className="crear-negocio-form" onSubmit={handleSubmit}>

        <h2 className="crear-negocio-titulo">Registra tu negocio</h2>

        <p className="crear-negocio-subtitulo">Completa la información para convertir tu cuenta</p>



        {step === 1 && (

          <div className="fade-in">

            <input

              name="business_name"

              type="text"

              placeholder="Nombre del negocio"

              value={formData.business_name}

              onChange={handleChange}

              required

            />

           

            {/* Input de dirección con botón de mapa */}
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

           

            <input

              name="NIT"

              type="number"

              placeholder="NIT"

              value={formData.NIT}

              onChange={handleChange}

              required

            />



            <textarea

              name="description"

              placeholder="Descripción del negocio"

              value={formData.description}

              onChange={handleChange}

              rows={3}

              required

            />



            {locationDetected && (

              <div className="coordenadas-info">

                <p>📍 Ubicación exacta guardada</p>

                <small>Coordenadas: {coordinates}</small>

              </div>

            )}



            <button type="button" className="crear-negocio-btn" onClick={handleNext}>

              Siguiente: Accesibilidad

            </button>

          </div>

        )}



        {/* Paso 2: Accesibilidad (Igual que antes) */}

        {step === 2 && (

          <div className="fade-in">

            
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

                <div

                  key={item.id}

                  className={`accesibilidad-boton ${selectedAccessibility.includes(item.id) ? "seleccionado" : ""}`}

                  onClick={() => handleAccessibilityChange(item.id)}

                >

                  <span className="accesibilidad-nombre">{item.nombre}</span>

                  <div className="tooltip-wrapper">

                    <HelpCircle className="help-icon" size={18} />

                    <span className="tooltip-text">{item.desc}</span>

                  </div>

                </div>

              ))}

            </div>

            <div className="crear-negocio-step-buttons">

              <button type="button" className="crear-negocio-btn secondary" onClick={handlePrev}>Atrás</button>

              <button type="submit" className="crear-negocio-btn" disabled={isLoading}>

                {isLoading ? "Creando negocio..." : "Crear negocio"}

              </button>

            </div>

          </div>

        )}



        <div className="crear-negocio-cancel">

          <button type="button" onClick={() => navigate(-1)} className="cancel-link">Cancelar</button>

        </div>

      </form>

      <ToastContainer theme="colored" newestOnTop pauseOnHover />

    </div>

  );

}