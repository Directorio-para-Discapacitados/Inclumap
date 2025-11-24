import React from 'react';
import { useSpeech } from '../context/SpeechContext';
import { useSpeakable } from '../hooks/useSpeakable';
import './SpeechToggle.css';

const SpeechToggle: React.FC = () => {
  const { isSpeechEnabled, toggleSpeech } = useSpeech();
  const { onMouseEnter, onFocus } = useSpeakable({
    customText: isSpeechEnabled 
      ? 'Desactivar asistente de voz' 
      : 'Activar asistente de voz'
  });

  return (
    <button
      className={`speech-toggle ${isSpeechEnabled ? 'active' : ''}`}
      onClick={toggleSpeech}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      aria-label={isSpeechEnabled ? 'Desactivar asistente de voz' : 'Activar asistente de voz'}
      aria-pressed={isSpeechEnabled}
      title={isSpeechEnabled ? 'Asistente de voz activado' : 'Activar asistente de voz'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="speech-icon"
      >
        {isSpeechEnabled ? (
          // Icono de volumen alto (activo)
          <>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </>
        ) : (
          // Icono de volumen muteado (inactivo)
          <>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </>
        )}
      </svg>
    </button>
  );
};

export default SpeechToggle;
