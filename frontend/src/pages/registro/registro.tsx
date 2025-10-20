import { useState, ChangeEvent } from "react";
import "./registro.css";

export default function Registro() {
  const [tipo, setTipo] = useState<"persona" | "local">("persona");
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    genero: "",
    correo: "",
    contraseña: "",
    confirmar: "",
    nit: "",
    tieneRampa: false,
    imagenes: [] as File[],
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : files ? Array.from(files) : value,
    });
  };

  const camposLlenos =
    tipo === "persona"
      ? formData.nombre && formData.apellido && formData.genero && formData.correo && formData.contraseña && formData.confirmar
      : formData.nombre && formData.nit && formData.correo && formData.contraseña && formData.confirmar;

  return (
    <div className="registro-container">
      <h2>Registro de {tipo === "persona" ? "Persona" : "Local"}</h2>

      <div className="tipo-switch">
        <label><input type="radio" checked={tipo === "persona"} onChange={() => setTipo("persona")} /> Persona</label>
        <label><input type="radio" checked={tipo === "local"} onChange={() => setTipo("local")} /> Local</label>
      </div>

      <form>
        {tipo === "persona" ? (
          <>
            <input type="text" name="nombre" placeholder="Nombre" onChange={handleChange} />
            <input type="text" name="apellido" placeholder="Apellido" onChange={handleChange} />

            <div className="genero">
              <label><input type="radio" name="genero" value="masculino" onChange={handleChange} /> Masculino</label>
              <label><input type="radio" name="genero" value="femenino" onChange={handleChange} /> Femenino</label>
              <label><input type="radio" name="genero" value="otro" onChange={handleChange} /> Otro</label>
            </div>
          </>
        ) : (
          <>
            <input type="text" name="nombre" placeholder="Nombre del Local" onChange={handleChange} />
            <input type="text" name="nit" placeholder="NIT" onChange={handleChange} />
            <label><input type="checkbox" name="tieneRampa" onChange={handleChange} /> El local tiene rampa</label>
            <label>Subir imágenes:</label>
            <input type="file" name="imagenes" multiple accept="image/*" onChange={handleChange} />
          </>
        )}

        <input type="email" name="correo" placeholder="Correo" onChange={handleChange} />
        <input type="password" name="contraseña" placeholder="Contraseña" onChange={handleChange} />
        <input type="password" name="confirmar" placeholder="Confirmar contraseña" onChange={handleChange} />

        <button type="submit" disabled={!camposLlenos}>Registrarse</button>
      </form>
    </div>
  );
}
