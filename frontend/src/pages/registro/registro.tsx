// frontend/src/pages/registro/registro.tsx

import React, { useState, useEffect } from "react";
import "./registro.css";
import { Eye, EyeOff, HelpCircle } from "lucide-react";
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

export default function Registro() {
  const [isBusiness, setIsBusiness] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [coordinates, setCoordinates] = useState("0,0");
  const [selectedAccessibility, setSelectedAccessibility] = useState<number[]>([]);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

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

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoordinates(`${latitude},${longitude}`);
        },
        () => setCoordinates("0,0") // Fallback seguro
      );
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value, // Guardar todo como string inicialmente para evitar errores de conversión
    });
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
      toast.warning("⚠️ La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.", {
        position: "top-center",
        autoClose: 4000,
      });
      return;
    }

    const endpoint = isBusiness
      ? `${API_URL}/auth/registerBusiness`
      : `${API_URL}/auth/register`;

    // PREPARACIÓN DEL PAYLOAD
    const payload = isBusiness
      ? {
          ...formData,
          // Importante: Enviar NIT como string para evitar desbordamiento de enteros o problemas de formato
          NIT: Number(formData.NIT), 
          coordinates: coordinates || "0,0", // Asegurar que nunca vaya undefined
          rolIds: [2, 3],
          accessibilityIds: selectedAccessibility,
        }
      : {
          ...formData,
          rolIds: [2],
        };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (!res.ok) {
        // Capturar mensaje de error del backend
        throw new Error(data.message || `Error del servidor: ${res.status}`);
      }

      toast.success("✅ Registro exitoso", {
        position: "top-center",
        autoClose: 2500,
        onClose: () => navigate("/login"),
      });
    } catch (error: any) {
      console.error("Error en registro:", error);
      toast.error(`❌ ${error.message || "Error al registrar"}`, { 
        position: "top-center", 
        autoClose: 4000 
      });
    }
  };

  return (
    <div className="registro-fondo">
      <form className="registro-form" onSubmit={handleSubmit}>
        <h2 className="registro-titulo">
          {isBusiness ? "Registra tu negocio" : "Registro de persona"}
        </h2>

        <div className="registro-switch-buttons">
          <button type="button" className={!isBusiness ? "activo" : ""} onClick={() => { setIsBusiness(false); setStep(1); }}>
            Persona
          </button>
          <button type="button" className={isBusiness ? "activo" : ""} onClick={() => { setIsBusiness(true); setStep(1); }}>
            Negocio
          </button>
        </div>

        {/* paso 1 */}
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

        {/* paso 2 */}
        {step === 2 && (
          <div className="fade-in">
            <input name="cellphone" type="text" placeholder="Celular" value={formData.cellphone} onChange={handleChange} required />
            <input name="address" type="text" placeholder="Dirección" value={formData.address} onChange={handleChange} required />

            <select name="gender" value={formData.gender} onChange={handleChange} required>
              <option value="">Selecciona tu género</option>
              <option value="f">Femenino</option>
              <option value="m">Masculino</option>
              <option value="o">Otro</option>
            </select>

            {isBusiness ? (
              <>
                <input name="business_name" type="text" placeholder="Nombre del negocio" value={formData.business_name} onChange={handleChange} required />
                <input name="business_address" type="text" placeholder="Dirección del negocio" value={formData.business_address} onChange={handleChange} required />
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

        {/* paso 3 (solo negocio) */}
        {step === 3 && isBusiness && (
          <div className="fade-in">
            <textarea name="description" placeholder="Descripción del negocio" value={formData.description} onChange={handleChange} rows={3} required />

            <h3 className="accesibilidad-titulo">Selecciona la accesibilidad de tu local</h3>

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

            <div className="registro-step-buttons">
              <button type="button" className="registro-btn secondary" onClick={handlePrev}>Atrás</button>
              <button type="submit" className="registro-btn">Registrarse</button>
            </div>
          </div>
        )}

        <p className="registro-login-text">
          ¿Ya tienes una cuenta?{" "}
          <a href="/login" className="registro-login-link">Inicia sesión</a>
        </p>
      </form>
      <ToastContainer theme="colored" newestOnTop pauseOnHover />
    </div>
  );
}