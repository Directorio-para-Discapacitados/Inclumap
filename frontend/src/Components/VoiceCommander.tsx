import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./VoiceCommander.css";

// Declaración de tipos para SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export const VoiceCommander: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isListening, setIsListening] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isProcessingRef = useRef(false);
  const shouldRestartRef = useRef(false);

  console.log('VoiceCommander renderizado:', { isEnabled, isListening });

  // Comandos de voz y sus rutas correspondientes
  const voiceCommands: { [key: string]: string } = {
    // Navegación principal
    "inicio": "/",
    "ir a inicio": "/",
    "ir al inicio": "/",
    "página principal": "/",
    "home": "/",
    "volver": "/",
    "regresar": "/",
    
    // Autenticación
    "login": "/login",
    "iniciar sesión": "/login",
    "entrar": "/login",
    "ir a login": "/login",
    "ingresar": "/login",
    
    "registro": "/registro",
    "registrarme": "/registro",
    "crear cuenta": "/registro",
    "ir a registro": "/registro",
    "registrar": "/registro",
    "nueva cuenta": "/registro",
    
    "cerrar sesión": "/logout",
    "salir": "/logout",
    
    "recuperar contraseña": "/forgot-password",
    "olvidé mi contraseña": "/forgot-password",
    "recuperar password": "/forgot-password",
    "restablecer contraseña": "/forgot-password",
    
    // Perfil y ajustes
    "perfil": "/perfil",
    "mi perfil": "/perfil",
    "ir a perfil": "/perfil",
    "ver perfil": "/perfil",
    "ver mi perfil": "/perfil",
    "mi cuenta": "/perfil",
    
    "ajustes": "/ajustes",
    "configuración": "/ajustes",
    "configurar": "/ajustes",
    "preferencias": "/ajustes",
    
    "guardados": "/guardados",
    "mis guardados": "/guardados",
    "lugares guardados": "/guardados",
    "favoritos": "/guardados",
    "mis favoritos": "/guardados",
    
    // Negocios
    "negocios": "/negocios",
    "ver negocios": "/negocios",
    "todos los negocios": "/negocios",
    "mostrar negocios": "/negocios",
    "lugares accesibles": "/negocios",
    "ver lugares": "/negocios",
    "encontrar lugares": "/negocios",
    "buscar lugares": "/negocios",
    
    "crear negocio": "/crear-negocio",
    "nuevo negocio": "/crear-negocio",
    "agregar negocio": "/crear-negocio",
    "registrar negocio": "/crear-negocio",
    "añadir negocio": "/crear-negocio",
    "publicar negocio": "/crear-negocio",
    
    // Reconocimiento
    "reconocimiento": "/reconocimiento",
    "escanear local": "/reconocimiento",
    "verificar local": "/reconocimiento",
    "comprobar accesibilidad": "/reconocimiento",
    
    // Reseñas
    "reseñas": "/reviews",
    "ver reseñas": "/reviews",
    "opiniones": "/reviews",
    "comentarios": "/reviews",
    "calificaciones": "/reviews",
    
    // Admin (si es necesario)
    "admin": "/admin",
    "administración": "/admin",
    "panel admin": "/admin",
  };

  // Inicializar reconocimiento de voz
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn("Speech Recognition no está soportado en este navegador");
      setFeedback("❌ Tu navegador no soporta reconocimiento de voz. Usa Chrome, Edge o verifica la configuración de Brave.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "es-ES";
    

    // Cuando se recibe un resultado de voz
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (isProcessingRef.current) return;
      
      const result = event.results[event.resultIndex];
      const transcript = result[0].transcript.toLowerCase().trim();
      
      console.log("🎤 Comando de voz detectado:", transcript);
      setLastCommand(transcript);
      setFeedback(`🎤 Escuché: "${transcript}"`);
      
      isProcessingRef.current = true;
      processVoiceCommand(transcript);
      
      // Reiniciar escucha automáticamente después de 1.5 segundos si está habilitado
      setTimeout(() => {
        isProcessingRef.current = false;
        if (shouldRestartRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
            console.log("🔄 Reiniciando escucha automática...");
          } catch (e) {
            console.log("Ya está escuchando");
          }
        }
      }, 1500);
    };

    // Cuando el reconocimiento se inicia
    recognition.onstart = () => {
      console.log("🎤 Reconocimiento de voz iniciado");
      setIsListening(true);
    };

    // Cuando el reconocimiento se detiene
    recognition.onend = () => {
      console.log("🎤 Reconocimiento de voz detenido");
      setIsListening(false);
    };

    // Manejo de errores
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Error en reconocimiento de voz:", event.error);
      
      if (event.error === "not-allowed") {
        setFeedback("❌ Permiso de micrófono denegado. Verifica los permisos del navegador.");
        setIsEnabled(false);
        // Mostrar instrucciones específicas para Brave
        setTimeout(() => {
          setFeedback("💡 En Brave: Haz clic en el león → Desactiva 'Shields' para localhost");
        }, 3000);
      } else if (event.error === "no-speech") {
        console.log("ℹ️ No se detectó voz, continuando...");
        // No hacer nada, es normal
      } else if (event.error === "aborted") {
        console.log("ℹ️ Reconocimiento abortado");
        // No mostrar error, solo reiniciar si está habilitado
      } else if (event.error === "network") {
        setFeedback("⚠️ Error de red. Verifica tu conexión.");
      } else {
        console.warn(`⚠️ Error: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Procesar comandos de voz
  const processVoiceCommand = (command: string) => {
    console.log("📝 Procesando comando:", command);
    
    // Comandos especiales con parámetros dinámicos
    
    // Ver detalles de negocio específico: "ver detalles de KFC" o "ver negocio McDonald's"
    if (command.includes("ver detalles") || command.includes("ver negocio") || 
        command.includes("abrir negocio") || command.includes("ir al negocio")) {
      // Extraer el nombre del negocio
      let businessName = command
        .replace("ver detalles del negocio", "")
        .replace("ver detalles de", "")
        .replace("ver negocio", "")
        .replace("abrir negocio", "")
        .replace("ir al negocio", "")
        .trim();
      
      if (businessName) {
        setFeedback(`🔍 Buscando negocio: "${businessName}". Por ahora navega a la lista de negocios.`);
        // TODO: Implementar búsqueda por nombre y navegación directa
        // Por ahora llevamos a la lista de negocios
        setTimeout(() => {
          navigate("/negocios");
        }, 500);
        setTimeout(() => setFeedback(""), 3000);
        return;
      }
    }
    
    // Buscar por categoría: "buscar restaurantes", "ver hoteles", etc.
    if (command.includes("buscar") || command.includes("mostrar")) {
      const categories = ["restaurante", "hotel", "tienda", "farmacia", "banco", "supermercado", "café"];
      const foundCategory = categories.find(cat => command.includes(cat));
      
      if (foundCategory) {
        setFeedback(`🔍 Buscando ${foundCategory}s...`);
        navigate("/negocios");
        setTimeout(() => setFeedback(""), 3000);
        return;
      }
    }
    
    // Comandos de navegación estándar
    let matchedRoute: string | null = null;
    let matchedCommand: string | null = null;

    for (const [voiceCommand, route] of Object.entries(voiceCommands)) {
      if (command.includes(voiceCommand)) {
        matchedRoute = route;
        matchedCommand = voiceCommand;
        console.log("✅ Coincidencia encontrada:", voiceCommand, "->", route);
        break;
      }
    }

    if (matchedRoute) {
      console.log("🚀 Navegando a:", matchedRoute);
      setFeedback(`✅ Navegando a: ${matchedCommand}`);
      
      setTimeout(() => {
        navigate(matchedRoute);
      }, 500);
      
      setTimeout(() => setFeedback(""), 3000);
    } else {
      console.warn("❌ Comando no reconocido:", command);
      setFeedback(`❓ No entendí: "${command}". Intenta: inicio, login, registro, negocios, perfil, crear negocio, guardados`);
      setTimeout(() => setFeedback(""), 5000);
    }
  };

  // Toggle del modo de escucha automática
  const toggleVoiceCommands = () => {
    if (!isEnabled) {
      // Activar modo escucha
      try {
        if (recognitionRef.current) {
          shouldRestartRef.current = true;
          recognitionRef.current.start();
          setIsEnabled(true);
          setFeedback("🎤 Comandos de voz ACTIVADOS. Di: inicio, negocios, perfil, login, registro, crear negocio, guardados, ajustes, reseñas, buscar [categoría]");
          setTimeout(() => setFeedback(""), 6000);
          console.log("✅ Modo comandos de voz ACTIVADO");
        }
      } catch (error: any) {
        console.error("Error al iniciar:", error);
        setFeedback("❌ Error. Verifica permisos del micrófono.");
      }
    } else {
      // Desactivar modo escucha
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsEnabled(false);
      setFeedback("🔇 Comandos de voz desactivados");
      setTimeout(() => setFeedback(""), 2000);
      console.log("❌ Modo comandos de voz DESACTIVADO");
    }
  };

  return (
    <div className="voice-commander">
      {/* Botón flotante ON/OFF */}
      <button
        className={`voice-toggle-btn ${isListening ? "listening" : ""} ${!isEnabled ? "disabled" : ""}`}
        onClick={toggleVoiceCommands}
        aria-label={isEnabled ? "Desactivar comandos de voz" : "Activar comandos de voz"}
        title={isEnabled ? "Comandos de voz activados" : "Activar comandos de voz"}
      >
        {isEnabled ? (
          <i className="fas fa-microphone"></i>
        ) : (
          <i className="fas fa-microphone-slash"></i>
        )}
        {isListening && <span className="listening-pulse"></span>}
      </button>

      {/* Feedback visual */}
      {feedback && (
        <div className="voice-feedback">
          <p>{feedback}</p>
        </div>
      )}

      {/* Indicador de último comando (solo visible cuando hay uno) */}
      {lastCommand && (
        <div className="last-command">
          <small>Último comando: "{lastCommand}"</small>
        </div>
      )}
    </div>
  );
};

export default VoiceCommander;
