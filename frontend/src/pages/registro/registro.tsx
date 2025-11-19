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

// Fallback — Mocoa, Putumayo
const FALLBACK_LOCATION = {
  lat: 1.1522,
  lng: -76.6526,
};

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

  const [coordinates, setCoordinates] = useState(
    `${FALLBACK_LOCATION.lat},${FALLBACK_LOCATION.lng}`
  );

  const [selectedAccessibility, setSelectedAccessibility] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState("");

  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  // Mapa modal
  const [showMap, setShowMap] = useState(false);
  const [mapInitialCoords, setMapInitialCoords] = useState(FALLBACK_LOCATION);
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

  // Google loader
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
    language: "es",
  });

  // ------- CARGAR CATEGORÍAS -------
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAllCategories();
        setCategories(data);
      } catch {
        setCategoriesError("No se pudieron cargar las categorías.");
      }
    };
    load();
  }, []);

  // ------- CONFIRMAR DESDE EL MAPA -------
  const handleMapConfirm = (lat: number, lng: number, address?: string) => {
    setCoordinates(`${lat},${lng}`);
    setMapInitialCoords({ lat, lng });

    if (address) {
      setFormData((prev) => ({
        ...prev,
        business_address: address,
      }));
    }

    toast.success(" Ubicación guardada");
    setShowMap(false);
  };

  // ------- BOTÓN QUE HACE SALTAR EL POPUP -------
  const handleOpenMap = () => {
    if (!navigator.geolocation) {
      setMapInitialCoords(FALLBACK_LOCATION);
      setShowMap(true);
      return;
    }

    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        setCoordinates(`${latitude},${longitude}`);
        setMapInitialCoords({ lat: latitude, lng: longitude });

        setIsDetectingLocation(false);
        setShowMap(true);
      },
      () => {
        // Usuario NO permite → usamos Mocoa
        setIsDetectingLocation(false);
        setCoordinates(`${FALLBACK_LOCATION.lat},${FALLBACK_LOCATION.lng}`);
        setMapInitialCoords(FALLBACK_LOCATION);
        setShowMap(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
      }
    );
  };

  // ------- FORM -------
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validarPassword = (pwd: string) =>
    /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Si no hay coordenadas válidas → Mocoa
    if (!coordinates || coordinates === "0,0") {
      setCoordinates(`${FALLBACK_LOCATION.lat},${FALLBACK_LOCATION.lng}`);
    }

    if (!validarPassword(formData.user_password)) {
      toast.warning("La contraseña debe tener 8 caracteres, mayúscula y número.");
      return;
    }

    if (isBusiness && selectedCategories.length === 0) {
      toast.warning("Selecciona al menos una categoría.");
      return;
    }

    const endpoint = isBusiness
      ? `${API_URL}/auth/registerBusiness`
      : `${API_URL}/auth/register`;

    const payload = isBusiness
      ? {
          ...formData,
          NIT: Number(formData.NIT),
          coordinates,
          rolIds: [2, 3],
          accessibilityIds: selectedAccessibility,
          categoryIds: selectedCategories,
        }
      : {
          ...formData,
          coordinates, // persona también lleva ubicación Mocoa
          rolIds: [2],
        };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Registro exitoso");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      toast.error(err.message || "Error al registrar");
    }
  };

  // ==================== JSX ====================
  return (
    <div className="registro-fondo">
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

        {/* SWITCH */}
        <div className="registro-switch-buttons">
          <button
            type="button"
            className={!isBusiness ? "activo" : ""}
            onClick={() => {
              setIsBusiness(false);
              setStep(1);
            }}
          >
            Persona
          </button>
          <button
            type="button"
            className={isBusiness ? "activo" : ""}
            onClick={() => {
              setIsBusiness(true);
              setStep(1);
            }}
          >
            Negocio
          </button>
        </div>

        {/* ================= STEP 1 ================= */}
        {step === 1 && (
          <div className="fade-in">
            <input
              name="user_email"
              type="email"
              placeholder="Correo electrónico"
              value={formData.user_email}
              onChange={handleChange}
              required
            />

            <div className="password-container">
              <input
                name="user_password"
                type={mostrarPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={formData.user_password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="password-toggle"
              >
                {mostrarPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>

            <input
              name="firstName"
              type="text"
              placeholder="Nombre"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <input
              name="firstLastName"
              type="text"
              placeholder="Apellido"
              value={formData.firstLastName}
              onChange={handleChange}
              required
            />

            <button type="button" className="registro-btn" onClick={() => setStep(2)}>
              Siguiente
            </button>
          </div>
        )}

        {/* ================= STEP 2 ================= */}
        {step === 2 && (
          <div className="fade-in">
            <input
              name="cellphone"
              type="text"
              placeholder="Celular"
              value={formData.cellphone}
              onChange={handleChange}
              required
            />

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
                <input
                  name="business_name"
                  type="text"
                  placeholder="Nombre del negocio"
                  value={formData.business_name}
                  onChange={handleChange}
                  required
                />

                <div className="input-with-action">
                  <input
                    name="business_address"
                    type="text"
                    placeholder="Dirección del negocio (o selecciona en mapa)"
                    value={formData.business_address}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="map-picker-btn"
                    onClick={handleOpenMap}
                    disabled={isDetectingLocation}
                  >
                    <MapPin />
                  </button>
                </div>

                <input
                  name="NIT"
                  type="number"
                  placeholder="NIT"
                  value={formData.NIT}
                  onChange={handleChange}
                  required
                />

                <div className="registro-step-buttons">
                  <button type="button" className="registro-btn secondary" onClick={() => setStep(1)}>
                    Atrás
                  </button>
                  <button type="button" className="registro-btn" onClick={() => setStep(3)}>
                    Siguiente
                  </button>
                </div>
              </>
            ) : (
              <div className="registro-step-buttons">
                <button type="button" className="registro-btn secondary" onClick={() => setStep(1)}>
                  Atrás
                </button>
                <button type="submit" className="registro-btn">
                  Registrarse
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 3 ================= */}
        {step === 3 && isBusiness && (
          <div className="fade-in">
            <textarea
              name="description"
              placeholder="Descripción del negocio"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              required
            />

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
                  className={`accesibilidad-boton ${
                    selectedAccessibility.includes(item.id) ? "seleccionado" : ""
                  }`}
                  onClick={() =>
                    setSelectedAccessibility((prev) =>
                      prev.includes(item.id)
                        ? prev.filter((a) => a !== item.id)
                        : [...prev, item.id]
                    )
                  }
                >
                  <span>{item.nombre}</span>
                  <div className="tooltip-wrapper">
                    <HelpCircle size={18} />
                    <span className="tooltip-text">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="registro-step-buttons">
              <button type="button" className="registro-btn secondary" onClick={() => setStep(2)}>
                Atrás
              </button>
              <button type="submit" className="registro-btn">
                Registrarse
              </button>
            </div>
          </div>
        )}

        <p className="registro-login-text">
          ¿Ya tienes una cuenta?{" "}
          <a href="/login" className="registro-login-link">
            Inicia sesión
          </a>
        </p>
      </form>

      <ToastContainer newestOnTop pauseOnHover theme="colored" />
    </div>
  );
}
