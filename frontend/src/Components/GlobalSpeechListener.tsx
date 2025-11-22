import React, { useEffect } from 'react';
import { useSpeech } from '../context/SpeechContext';

/**
 * Componente que añade automáticamente eventos TTS a todos los elementos interactivos
 * cuando el asistente de voz está activado.
 * 
 * Se activa globalmente y escucha eventos en:
 * - Botones (<button>)
 * - Links (<a>)
 * - Inputs (<input>, <textarea>, <select>)
 * - Elementos con role="button"
 * - Elementos con tabindex
 */
export const GlobalSpeechListener: React.FC = () => {
  const { speak, cancelSpeech, isSpeechEnabled } = useSpeech();

  useEffect(() => {
    if (!isSpeechEnabled) return;

    const getTextToSpeak = (element: HTMLElement): string => {
      // 1. Prioridad: aria-label
      const ariaLabel = element.getAttribute('aria-label');
      if (ariaLabel && ariaLabel.trim()) {
        return ariaLabel.trim();
      }

      // 2. Para inputs: placeholder + value
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        const placeholder = element.placeholder;
        const value = element.value;
        
        if (placeholder && value) {
          return `${placeholder}: ${value}`;
        } else if (placeholder) {
          return placeholder;
        } else if (value) {
          return `Valor: ${value}`;
        }
      }

      // 3. Para selects: label + opción seleccionada
      if (element instanceof HTMLSelectElement) {
        const selectedOption = element.options[element.selectedIndex];
        const label = element.getAttribute('aria-label') || element.previousElementSibling?.textContent;
        
        if (label && selectedOption) {
          return `${label}: ${selectedOption.text}`;
        } else if (selectedOption) {
          return selectedOption.text;
        }
      }

      // 4. Para imágenes: alt text
      if (element instanceof HTMLImageElement) {
        return element.alt || 'Imagen';
      }

      // 5. Tercera prioridad: innerText
      const innerText = element.innerText || element.textContent;
      if (innerText && innerText.trim()) {
        return innerText.trim();
      }

      return '';
    };

    const handleFocus = (event: FocusEvent) => {
      const element = event.target as HTMLElement;
      const text = getTextToSpeak(element);

      if (text) {
        cancelSpeech();
        speak(text);
      }
    };

    const handleMouseEnter = (event: MouseEvent) => {
      const element = event.target as HTMLElement;
      
      // Solo leer si es un elemento interactivo
      const isInteractive = 
        element.tagName === 'BUTTON' ||
        element.tagName === 'A' ||
        element.tagName === 'INPUT' ||
        element.tagName === 'TEXTAREA' ||
        element.tagName === 'SELECT' ||
        element.hasAttribute('role') ||
        element.hasAttribute('tabindex') ||
        element.classList.contains('card') ||
        element.classList.contains('accessibility-btn') ||
        element.closest('button, a, [role="button"]');

      if (!isInteractive) return;

      const text = getTextToSpeak(element);

      if (text) {
        cancelSpeech();
        speak(text);
      }
    };

    // Añadir listeners globales
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('mouseenter', handleMouseEnter, true);

    // Cleanup
    return () => {
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('mouseenter', handleMouseEnter, true);
    };
  }, [isSpeechEnabled, speak, cancelSpeech]);

  return null; // Este componente no renderiza nada
};
