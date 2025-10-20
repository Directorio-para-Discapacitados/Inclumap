import { useState, ChangeEvent, useMemo, FormEvent } from "react";
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
    direccion: "",
    contactoTelefono: "",
    descripcion: "",
    accesibilidad: {
      rampa: false,
      banioAdaptado: false,
      senaletica: false,
      anchoPuertas: false,
      ascensor: false,
      braille: false,
      pasillos: false,
      pantallas: false,
      parqueadero: false,
    },
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : files ? Array.from(files) : value,
    });
  };

  function handleAccChange(key: keyof typeof formData.accesibilidad) {
    setFormData((prev) => ({ ...prev, accesibilidad: { ...prev.accesibilidad, [key]: !prev.accesibilidad[key] } }));
  }

  const previews = useMemo(() => formData.imagenes.map((f) => URL.createObjectURL(f)), [formData.imagenes]);

  function validateEmail(email: string) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  const localErrors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!formData.nombre.trim()) e.nombre = "Requerido";
    if (!formData.direccion.trim()) e.direccion = "Requerido";
    if (!formData.correo.trim()) e.correo = "Requerido";
    else if (!validateEmail(formData.correo)) e.correo = "Formato inválido";
    if (formData.descripcion.length > 500) e.descripcion = "Máximo 500 caracteres";
    if (formData.contactoTelefono && formData.contactoTelefono.length > 20) e.contactoTelefono = "Máximo 20 caracteres";
    return e;
  }, [formData]);

  const camposLlenos =
    tipo === "persona"
      ? formData.nombre && formData.apellido && formData.genero && formData.correo && formData.contraseña && formData.confirmar
      : formData.nombre && formData.direccion && formData.correo && !Object.keys(localErrors).length;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (tipo === "local") {
      if (Object.keys(localErrors).length) return;
      const base = (import.meta as any).env?.VITE_API_URL || "";
      const url = `${base}/api/locales`;
      const fd = new FormData();
      fd.append("nombre", formData.nombre);
      fd.append("direccion", formData.direccion);
      fd.append("contactoEmail", formData.correo);
      fd.append("contactoTelefono", formData.contactoTelefono);
      fd.append("descripcion", formData.descripcion);
      fd.append("accesibilidad", JSON.stringify(formData.accesibilidad));
      formData.imagenes.forEach((f) => fd.append("fotos", f));
      try {
        const res = await fetch(url, { method: "POST", body: fd });
        if (res.ok) {
          alert("Registro exitoso");
          setFormData({
            nombre: "",
            apellido: "",
            genero: "",
            correo: "",
            contraseña: "",
            confirmar: "",
            nit: "",
            tieneRampa: false,
            imagenes: [],
            direccion: "",
            contactoTelefono: "",
            descripcion: "",
            accesibilidad: {
              rampa: false,
              banioAdaptado: false,
              senaletica: false,
              anchoPuertas: false,
              ascensor: false,
              braille: false,
              pasillos: false,
              pantallas: false,
              parqueadero: false,
            },
          });
        } else if (res.status === 409) {
          alert("El local ya existe");
        } else {
          const data = await res.json().catch(() => null);
          alert((data && (data.message || data.error)) || "Error al registrar");
        }
      } catch (err) {
        alert("Error de red");
      }
    }
  }

  return (
    <div className="registro-container">
      <h2>Registro de {tipo === "persona" ? "Persona" : "Local"}</h2>

      <div className="tipo-switch">
        <label><input type="radio" checked={tipo === "persona"} onChange={() => setTipo("persona")} /> Persona</label>
        <label><input type="radio" checked={tipo === "local"} onChange={() => setTipo("local")} /> Local</label>
      </div>

      <form onSubmit={onSubmit}>
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
            <input type="text" name="nombre" placeholder="Nombre del Local" value={formData.nombre} onChange={handleChange} />
            {localErrors.nombre && <span className="error-text">{localErrors.nombre}</span>}

            <input type="text" name="direccion" placeholder="Dirección" value={formData.direccion} onChange={handleChange} />
            {localErrors.direccion && <span className="error-text">{localErrors.direccion}</span>}

            <input type="text" name="contactoTelefono" placeholder="Teléfono de contacto" value={formData.contactoTelefono} onChange={handleChange} />
            {localErrors.contactoTelefono && <span className="error-text">{localErrors.contactoTelefono}</span>}

            <textarea name="descripcion" placeholder="Descripción (máx. 500)" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} />
            {localErrors.descripcion && <span className="error-text">{localErrors.descripcion}</span>}

            <fieldset className="accesibilidad">
              <legend>Accesibilidad</legend>
              <div className="acc-grid">
                <label className="check"><input type="checkbox" checked={formData.accesibilidad.rampa} onChange={() => handleAccChange("rampa")} /> <span>Rampa de Acceso</span></label>
                <label className="check"><input type="checkbox" checked={formData.accesibilidad.banioAdaptado} onChange={() => handleAccChange("banioAdaptado")} /> <span>Baño Adaptado</span></label>
                <label className="check"><input type="checkbox" checked={formData.accesibilidad.anchoPuertas} onChange={() => handleAccChange("anchoPuertas")} /> <span>Ancho de puertas adecuado</span></label>
                <label className="check"><input type="checkbox" checked={formData.accesibilidad.ascensor} onChange={() => handleAccChange("ascensor")} /> <span>Ascensor Accesible</span></label>
                <label className="check"><input type="checkbox" checked={formData.accesibilidad.braille} onChange={() => handleAccChange("braille")} /> <span>Sistema Braille</span></label>
                <label className="check"><input type="checkbox" checked={formData.accesibilidad.pasillos} onChange={() => handleAccChange("pasillos")} /> <span>Pasillos Amplios</span></label>
                <label className="check"><input type="checkbox" checked={formData.accesibilidad.pantallas} onChange={() => handleAccChange("pantallas")} /> <span>Pantallas Informativas</span></label>
                <label className="check"><input type="checkbox" checked={formData.accesibilidad.parqueadero} onChange={() => handleAccChange("parqueadero")} /> <span>Parqueaderos Reservados</span></label>
              </div>
            </fieldset>

            <label>Subir imágenes:</label>
            <input type="file" name="imagenes" multiple accept="image/*" onChange={handleChange} />
            {previews.length > 0 && (
              <div className="preview-grid">
                {previews.map((src, idx) => (
                  <img className="preview" key={idx} src={src} alt={`foto-${idx}`} />
                ))}
              </div>
            )}
          </>
        )}

        <input type="email" name="correo" placeholder="Correo" value={formData.correo} onChange={handleChange} />
        {tipo === "local" && localErrors.correo && <span className="error-text">{localErrors.correo}</span>}
        <input type="password" name="contraseña" placeholder="Contraseña" onChange={handleChange} />
        <input type="password" name="confirmar" placeholder="Confirmar contraseña" onChange={handleChange} />

        <button type="submit" disabled={!camposLlenos}>Registrarse</button>
      </form>
    </div>
  );
}
