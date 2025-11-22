import { useCallback } from 'react';
import { useSpeech } from '../context/SpeechContext';

interface UseSpeakableOptions {
  /**
   * Prioridad de lectura:
   * 1. aria-label del elemento
   * 2. customText proporcionado
   * 3. innerText del elemento
   */
  customText?: string;
  /**
   * Si es true, cancela la lectura actual antes de hablar
   * (útil para navegación rápida)
   */
  cancelPrevious?: boolean;
}

/**
 * Hook personalizado que proporciona manejadores de eventos para Text-to-Speech
 * 
 * @example
 * ```tsx
 * const { onMouseEnter, onFocus } = useSpeakable({ customText: 'Botón de enviar' });
 * 
 * return (
 *   <button 
 *     aria-label="Enviar formulario"
 *     onMouseEnter={onMouseEnter}
 *     onFocus={onFocus}
 *   >
 *     Enviar
 *   </button>
 * );
 * ```
 */
export const useSpeakable = (options: UseSpeakableOptions = {}) => {
  const { speak, cancelSpeech, isSpeechEnabled } = useSpeech();
  const { customText, cancelPrevious = true } = options;

  /**
   * Obtiene el texto a leer del elemento, priorizando aria-label
   */
  const getTextToSpeak = useCallback((element: HTMLElement): string => {
    // 1. Prioridad: aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.trim()) {
      return ariaLabel.trim();
    }

    // 2. Segunda prioridad: customText proporcionado
    if (customText && customText.trim()) {
      return customText.trim();
    }

    // 3. Tercera prioridad: innerText del elemento
    const innerText = element.innerText || element.textContent;
    if (innerText && innerText.trim()) {
      return innerText.trim();
    }

    return '';
  }, [customText]);

  /**
   * Manejador para el evento onMouseEnter
   */
  const onMouseEnter = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (!isSpeechEnabled) return;

    const element = event.currentTarget;
    const text = getTextToSpeak(element);

    if (text) {
      if (cancelPrevious) {
        cancelSpeech();
      }
      speak(text);
    }
  }, [isSpeechEnabled, getTextToSpeak, speak, cancelSpeech, cancelPrevious]);

  /**
   * Manejador para el evento onFocus
   */
  const onFocus = useCallback((event: React.FocusEvent<HTMLElement>) => {
    if (!isSpeechEnabled) return;

    const element = event.currentTarget;
    const text = getTextToSpeak(element);

    if (text) {
      if (cancelPrevious) {
        cancelSpeech();
      }
      speak(text);
    }
  }, [isSpeechEnabled, getTextToSpeak, speak, cancelSpeech, cancelPrevious]);

  /**
   * Manejador para detener la lectura al salir del elemento
   */
  const onMouseLeave = useCallback(() => {
    if (isSpeechEnabled && cancelPrevious) {
      cancelSpeech();
    }
  }, [isSpeechEnabled, cancelSpeech, cancelPrevious]);

  /**
   * Función para leer texto manualmente
   */
  const speakText = useCallback((text: string) => {
    if (isSpeechEnabled && text.trim()) {
      if (cancelPrevious) {
        cancelSpeech();
      }
      speak(text);
    }
  }, [isSpeechEnabled, speak, cancelSpeech, cancelPrevious]);

  return {
    onMouseEnter,
    onFocus,
    onMouseLeave,
    speakText,
  };
};
