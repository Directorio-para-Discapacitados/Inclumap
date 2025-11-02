// frontend/src/pages/registro/registro.tsx (Código Completo)

import React, { useState, useEffect } from "react";
import "./Registro.css";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = "http://localhost:9080";

export default function Registro() {
  const [isBusiness, setIsBusiness] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [coordinates, setCoordinates] = useState("0,0");
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

  // Obtener ubicación automáticamente
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoordinates(`${latitude},${longitude}`);
        },
        () => setCoordinates("0,0")
      );
    } else {
      setCoordinates("0,0");
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "number" ? Number(value) : value,
    });
  };

  const validarPassword = (password: string): boolean => {
    const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(password);
  };

  const togglePassword = () => {
    setMostrarPassword(!mostrarPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarPassword(formData.user_password)) {
      toast.warning(
        "⚠️ La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.",
        { position: "top-center", autoClose: 4000 }
      );
      return;
    }

    const endpoint = isBusiness
      ? `${API_URL}/auth/registerBusiness`
      : `${API_URL}/auth/register`;

    // --- CORRECCIÓN DE ROLES ENVIADOS ---
    const payload = isBusiness
      ? {
          user_email: formData.user_email,
          user_password: formData.user_password,
          firstName: formData.firstName,
          firstLastName: formData.firstLastName,
          cellphone: formData.cellphone,
          address: formData.address,
          gender: formData.gender,
          business_name: formData.business_name,
          business_address: formData.business_address,
          NIT: Number(formData.NIT),
          description: formData.description,
          coordinates,
          rolIds: [2, 3], // CORREGIDO: Rol Usuario (2) y Negocio (3)
          accessibilityIds: [],
        }
      : {
          user_email: formData.user_email,
          user_password: formData.user_password,
          firstName: formData.firstName,
          firstLastName: formData.firstLastName,
          cellphone: formData.cellphone,
          address: formData.address,
          gender: formData.gender,
          rolIds: [2], // CORREGIDO: Rol Usuario (2)
        };
    // --- FIN DE LA CORRECCIÓN ---

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Respuesta:", data);

      if (!res.ok) {
        toast.error(data.message || "❌ Error al registrar", {
          position: "top-center",
          autoClose: 4000,
        });
        return;
      }

      toast.success("✅ Registro exitoso", {
        position: "top-center",
        autoClose: 2500,
        onClose: () => navigate("/login"), // Redirige al login
      });
    } catch (error) {
      console.error("Error al registrar:", error);
      toast.error("❌ Error al registrar. Revisa la consola.", {
        position: "top-center",
        autoClose: 4000,
      });
    }
  };

  return (
    <div className="registro-fondo">
      <form className="registro-form" onSubmit={handleSubmit}>
        <h2 className="registro-titulo">
          {isBusiness ? "Registrate como Negocio" : "Registrate como Persona"}
        </h2>

        <div className="registro-switch-buttons">
          <button
            type="button"
            className={!isBusiness ? "activo" : ""}
            onClick={() => setIsBusiness(false)}
          >
            Persona
          </button>
          <button
            type="button"
            className={isBusiness ? "activo" : ""}
            onClick={() => setIsBusiness(true)}
          >
            Negocio
          </button>
        </div>

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
            onClick={togglePassword}
            className="password-toggle"
          >
            {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
          placeholder="Dirección"
          value={formData.address}
          onChange={handleChange}
          required
        />

        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          required
        >
          <option value="">Selecciona tu género</option>
          <option value="f">Femenino</option>
          <option value="m">Masculino</option>
          <option value="o">Otro</option>
        </select>

        {isBusiness && (
          <div className="registro-extra fade-in">
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
          </div>
        )}

        <button type="submit" className="registro-btn">
          Registrarse
        </button>

        <p className="registro-login-text">
          ¿Ya tienes una cuenta?{" "}
          <a href="/login" className="registro-login-link">
            Inicia sesión
          </a>
        </p>
      </form>

      {/* Contenedor de notificaciones */}
      <ToastContainer theme="colored" newestOnTop pauseOnHover />
    </div>
  );
}