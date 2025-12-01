import React, { useState } from "react";
import "./AccessibilitySidebar.css";
import ChatWidget from "../ChatWidget";
import SpeechToggle from "../SpeechToggle";
import { VoiceCommander } from "../VoiceCommander";
import { useSpeakable } from "../../hooks/useSpeakable";
import HelpFab from "../HelpFab";

/**
 * Sidebar de Accesibilidad
 * Componente que agrupa las herramientas de accesibilidad en iconos flotantes:
 * - Chatbot (asistente virtual)
 * - Asistente de voz (TTS)
 * - Comandos de voz (reconocimiento de voz)
 */
export const AccessibilitySidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem("accessibilitySidebarOpen") || "false");
    } catch {
      return false;
    }
  });
  const { onMouseEnter, onFocus } = useSpeakable();

  const toggleSidebar = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    localStorage.setItem("accessibilitySidebarOpen", JSON.stringify(newState));
  };

  return (
    <>
      {/* Botón flotante principal para abrir/cerrar el sidebar */}
      <button
        className={`accessibility-sidebar-toggle ${isOpen ? "open" : ""}`}
        onClick={toggleSidebar}
        onMouseEnter={onMouseEnter}
        onFocus={onFocus}
        aria-label={isOpen ? "Cerrar herramientas de accesibilidad" : "Abrir herramientas de accesibilidad"}
        aria-expanded={isOpen}
        title={isOpen ? "Cerrar accesibilidad" : "Herramientas de accesibilidad"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="accessibility-icon"
        >
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v8" />
          <path d="M8 10l4 2 4-2" />
          <path d="M8 15l4 4 4-4" />
        </svg>
      </button>

      {/* Contenedor de herramientas flotantes */}
      {isOpen && (
        <div className="accessibility-tools-container">
          {/* Botón de Asistente de Voz */}
          <div className="accessibility-tool-item" title="Asistente de Voz">
            <SpeechToggle />
          </div>

          {/* Botón de Comandos de Voz */}
          <div className="accessibility-tool-item" title="Comandos de Voz">
            <VoiceCommander />
          </div>

          {/* Botón de Chatbot */}
          <div className="accessibility-tool-item" title="Asistente Virtual">
            <ChatWidget />
          </div>

        {/* Botón de Ayuda y Tutoriales: AÑADIDO */}
        <div className="accessibility-tool-item" title="Ayuda y Tutoriales">
          <HelpFab />
        </div>
      </div>
    )}
    </>
  );
};

export default AccessibilitySidebar;
