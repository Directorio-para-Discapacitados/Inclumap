import React, { useState } from "react";
import "./Registro.css"; // Importamos los estilos

const API_URL = "http://localhost:3030";

export default function Registro() {
  const [isBusiness, setIsBusiness] = useState(false);
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
    coordinates: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: type === "number" ? Number(value) : value,
    });
  };

  const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsBusiness(e.target.checked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const endpoint = isBusiness
      ? `${API_URL}/auth/registerBusiness`
      : `${API_URL}/auth/register`;

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
          coordinates: formData.coordinates,
          rolIds: [2],
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
          rolIds: [1],
        };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Respuesta:", data);

      if (!res.ok) {
        alert(data.message || "Error al registrar");
        return;
      }

      alert("Registro exitoso");
    } catch (error) {
      console.error("Error al registrar:", error);
      alert("Error al registrar. Revisa la consola.");
    }
  };

  return (
    <div className="registro-fondo">
      <form className="registro-form" onSubmit={handleSubmit}>
        <h2 className="registro-titulo">
          {isBusiness ? "Registro de Local" : "Registro de Persona"}
        </h2>

        <label className="registro-switch">
          <input
            type="checkbox"
            checked={isBusiness}
            onChange={handleCheck}
          />
          <span>Registrarme como local</span>
        </label>

        <input
          name="user_email"
          type="email"
          placeholder="Correo electrónico"
          value={formData.user_email}
          onChange={handleChange}
          required
        />
        <input
          name="user_password"
          type="password"
          placeholder="Contraseña"
          value={formData.user_password}
          onChange={handleChange}
          required
        />
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
        <input
          name="gender"
          type="text"
          placeholder="Género"
          value={formData.gender}
          onChange={handleChange}
          required
        />

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
            <input
              name="coordinates"
              type="text"
              placeholder="Coordenadas (lat, lng)"
              value={formData.coordinates}
              onChange={handleChange}
              required
            />
          </div>
        )}

        <button type="submit" className="registro-btn">
          Registrar
        </button>
      </form>
    </div>
  );
}
