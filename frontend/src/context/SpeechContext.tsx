import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';

interface SpeechContextType {
  isSpeechEnabled: boolean;
  toggleSpeech: () => void;
  speak: (text: string) => void;
  cancelSpeech: () => void;
}

const SpeechContext = createContext<SpeechContextType | undefined>(undefined);

export const SpeechProvider = ({ children }: { children: ReactNode }) => {
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(() => {
    try {
      const savedMode = sessionStorage.getItem('speechEnabled');
      return savedMode === 'true';
    } catch {
      return false;
    }
  });

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Inicializar la Web Speech API
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  useEffect(() => {
    // Persistir el estado en sessionStorage
    try {
      sessionStorage.setItem('speechEnabled', isSpeechEnabled.toString());
    } catch {}
  }, [isSpeechEnabled]);

  const cancelSpeech = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      currentUtteranceRef.current = null;
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSpeechEnabled || !synthRef.current || !text.trim()) {
      return;
    }

    // Cancelar cualquier lectura en curso para evitar superposición
    cancelSpeech();

    try {
      const utterance = new SpeechSynthesisUtterance(text.trim());
      
      // Configuración de la voz
      utterance.lang = 'es-ES'; // Español
      utterance.rate = 1.0; // Velocidad normal
      utterance.pitch = 1.0; // Tono normal
      utterance.volume = 1.0; // Volumen máximo

      // Intentar usar una voz en español si está disponible
      const voices = synthRef.current.getVoices();
      const spanishVoice = voices.find(voice => voice.lang.startsWith('es'));
      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }

      currentUtteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    } catch (error) {
      console.error('Error al sintetizar voz:', error);
    }
  }, [isSpeechEnabled, cancelSpeech]);

  const toggleSpeech = useCallback(() => {
    setIsSpeechEnabled(prev => {
      const newValue = !prev;
      
      // Si se desactiva, cancelar cualquier lectura en curso
      if (!newValue && synthRef.current) {
        synthRef.current.cancel();
      }
      
      // Anunciar el cambio de estado
      setTimeout(() => {
        if (newValue && synthRef.current) {
          const announcement = new SpeechSynthesisUtterance('Asistente de voz activado');
          announcement.lang = 'es-ES';
          synthRef.current.speak(announcement);
        }
      }, 100);
      
      return newValue;
    });
  }, []);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const value: SpeechContextType = {
    isSpeechEnabled,
    toggleSpeech,
    speak,
    cancelSpeech,
  };

  return (
    <SpeechContext.Provider value={value}>
      {children}
    </SpeechContext.Provider>
  );
};

export const useSpeech = () => {
  const context = useContext(SpeechContext);
  if (context === undefined) {
    throw new Error('useSpeech debe ser usado dentro de un SpeechProvider');
  }
  return context;
};
