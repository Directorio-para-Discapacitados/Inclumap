import React, { useState, useEffect, useContext } from "react";
import "./CrearNegocio.css";
import { HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  const [coordinates, setCoordinates] = useState("0,0");
  const [selectedAccessibility, setSelectedAccessibility] = useState<number[]>([]);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    business_name: "",
    business_address: "",
    NIT: "",
    description: "",
  });

  // Obtener ubicación actual
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoordinates(`${latitude},${longitude}`);
        },
        () => setCoordinates("0,0")
      );
    }
  }, []);

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

    // Validaciones
    if (!formData.business_name.trim()) {
      toast.warning("⚠️ El nombre del negocio es requerido", {
        position: "top-center",
        autoClose: 4000,
      });
      return;
    }

    if (!formData.NIT || formData.NIT.length < 8) {
      toast.warning("⚠️ El NIT debe tener al menos 8 dígitos", {
        position: "top-center",
        autoClose: 4000,
      });
      return;
    }

    setIsLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("❌ No hay sesión activa. Inicia sesión primero.", {
        position: "top-center",
        autoClose: 4000,
      });
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

      // Actualizar el token si viene uno nuevo
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      toast.success("✅ Negocio creado exitosamente", {
        position: "top-center",
        autoClose: 2000,
        onClose: () => navigate("/perfil"),
      });
    } catch (error: any) {
      toast.error(`❌ ${error.message}`, { 
        position: "top-center", 
        autoClose: 4000 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="crear-negocio-fondo">
      <form className="crear-negocio-form" onSubmit={handleSubmit}>
        <h2 className="crear-negocio-titulo">
          Registra tu negocio
        </h2>
        <p className="crear-negocio-subtitulo">
          Completa la información para convertir tu cuenta en una cuenta de negocio
        </p>

        {/* Paso 1: Información básica del negocio */}
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
            
            <input 
              name="business_address" 
              type="text" 
              placeholder="Dirección del negocio" 
              value={formData.business_address} 
              onChange={handleChange} 
              required 
            />
            
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

            <div className="coordenadas-info">
              <p>📍 Ubicación detectada: {coordinates}</p>
              <small>Tu ubicación actual se usará para el negocio</small>
            </div>

            <button type="button" className="crear-negocio-btn" onClick={handleNext}>
              Siguiente: Accesibilidad
            </button>
          </div>
        )}

        {/* Paso 2: Selección de accesibilidades */}
        {step === 2 && (
          <div className="fade-in">
            <h3 className="accesibilidad-titulo">Selecciona la accesibilidad de tu local</h3>
            <p className="accesibilidad-subtitulo">
              Esto ayudará a las personas con discapacidad a encontrar lugares adecuados
            </p>

            <div className="accesibilidad-grid">
              {accesibilidades.map((item) => (
                <div
                  key={item.id}
                  className={`accesibilidad-boton ${
                    selectedAccessibility.includes(item.id) ? "seleccionado" : ""
                  }`}
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
              <button type="button" className="crear-negocio-btn secondary" onClick={handlePrev}>
                Atrás
              </button>
              <button type="submit" className="crear-negocio-btn" disabled={isLoading}>
                {isLoading ? "Creando negocio..." : "Crear negocio"}
              </button>
            </div>
          </div>
        )}

        <div className="crear-negocio-cancel">
          <button 
            type="button" 
            onClick={() => navigate(-1)}
            className="cancel-link"
          >
            Cancelar
          </button>
        </div>
      </form>
      <ToastContainer theme="colored" newestOnTop pauseOnHover />
    </div>
  );
}