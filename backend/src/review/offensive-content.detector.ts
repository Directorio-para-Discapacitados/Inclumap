import { Injectable } from '@nestjs/common';

@Injectable()
export class OffensiveContentDetector {
  // Lista de palabras ofensivas (puedes expandir esta lista)
  private offensiveWords = [
    'idiota', 'idiotas', 'estúpido', 'estúpidos', 'imbécil', 'imbéciles', 
    'pendejo', 'pendejos', 'puto', 'putos', 'puta', 'putas', 'ptas', 'mierda',
    'carajo', 'joder', 'coño', 'huevón', 'huevones', 'culero', 'culeros',
    'mamón', 'mamones', 'cabrón', 'cabrones', 'chingada', 'verga', 'pinche',
    'gonorrea', 'malparido', 'malparidos', 'hijueputa', 'hijueputas',
    'hp', 'hps', 'hdp', 'basura', 'porquería', 'maldito', 'malditos',
    'concha', 'cagada', 'ojete', 'marica', 'maricas', 'perra', 'perras',
    'zorra', 'zorras', 'ramera', 'rameras', 'prostituta', 'prostitutas',
    // Inglés
    'fuck', 'fucks', 'shit', 'shits', 'bitch', 'bitches', 'asshole', 'assholes',
    'bastard', 'bastards', 'damn', 'crap', 'stupid', 'idiot', 'idiots',
    'moron', 'morons', 'retard', 'retards', 'dumb', 'loser', 'losers'
  ];

  /**
   * Detecta si un texto contiene palabras ofensivas
   * @param text - Texto a analizar
   * @returns true si contiene palabras ofensivas, false si no
   */
  containsOffensiveContent(text: string): boolean {
    if (!text) return false;

    const normalizedText = text.toLowerCase();
    
    return this.offensiveWords.some(word => {
      // Buscar la palabra completa (con límites de palabra)
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(normalizedText);
    });
  }

  /**
   * Obtiene las palabras ofensivas encontradas en el texto
   * @param text - Texto a analizar
   * @returns Array de palabras ofensivas encontradas
   */
  getOffensiveWords(text: string): string[] {
    if (!text) return [];

    const normalizedText = text.toLowerCase();
    const foundWords: string[] = [];

    this.offensiveWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(normalizedText)) {
        foundWords.push(word);
      }
    });

    return foundWords;
  }

  /**
   * Censura las palabras ofensivas en el texto
   * @param text - Texto a censurar
   * @returns Texto con palabras ofensivas censuradas
   */
  censorOffensiveContent(text: string): string {
    if (!text) return text;

    let censoredText = text;

    this.offensiveWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const replacement = word[0] + '*'.repeat(word.length - 1);
      censoredText = censoredText.replace(regex, replacement);
    });

    return censoredText;
  }
}
