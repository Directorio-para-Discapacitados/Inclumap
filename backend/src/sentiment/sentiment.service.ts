import { Injectable } from '@nestjs/common';
import * as Sentiment from 'sentiment';

interface SentimentAnalysisResult {
  sentiment_label: string;
  coherence_check: string;
  suggested_action: string;
}

@Injectable()
export class SentimentService {
  private sentiment: any;

  constructor() {
    this.sentiment = new Sentiment();
  }

  /**
   * Analiza el sentimiento de un texto en español
   * @param text - Texto del comentario a analizar
   * @returns 'Positivo', 'Negativo' o 'Neutral'
   */
  analyzeSentiment(text: string): string {
    if (!text || text.trim().length === 0) {
      return 'Neutral';
    }

    const result = this.sentiment.analyze(text);
    const score = result.score;

    if (score > 0) {
      return 'Positivo';
    } else if (score < 0) {
      return 'Negativo';
    } else {
      return 'Neutral';
    }
  }

  /**
   * Verifica la coherencia entre la calificación de estrellas y el sentimiento del comentario
   * @param stars - Calificación en estrellas (1-5)
   * @param sentimentScore - Puntuación del sentimiento
   * @returns Mensaje de coherencia
   */
  checkCoherence(stars: number, sentimentLabel: string): string {
    // Estrellas altas (4-5) deberían tener sentimiento positivo
    if (stars >= 4) {
      if (sentimentLabel === 'Negativo') {
        return 'Incoherente: Calificación alta con comentario negativo';
      }
      return 'Coherente: Calificación alta con comentario positivo/neutral';
    }

    // Estrellas medias (3) pueden ser neutrales o mixtas
    if (stars === 3) {
      return 'Coherente: Calificación media';
    }

    // Estrellas bajas (1-2) deberían tener sentimiento negativo
    if (stars <= 2) {
      if (sentimentLabel === 'Positivo') {
        return 'Incoherente: Calificación baja con comentario positivo';
      }
      return 'Coherente: Calificación baja con comentario negativo/neutral';
    }

    return 'Coherente';
  }

  /**
   * Analiza una reseña completa: sentimiento + coherencia
   * @param stars - Calificación en estrellas (1-5)
   * @param comment - Texto del comentario (opcional)
   * @returns Objeto con sentiment_label, coherence_check y suggested_action
   */
  analyzeReview(stars: number, comment?: string): SentimentAnalysisResult {
    // Si no hay comentario, solo validar estrellas
    if (!comment || comment.trim().length === 0) {
      return {
        sentiment_label: 'Sin comentario',
        coherence_check: 'Solo calificación numérica',
        suggested_action: 'Validación automática',
      };
    }

    const sentimentLabel = this.analyzeSentiment(comment);
    const coherenceCheck = this.checkCoherence(stars, sentimentLabel);

    // Determinar acción sugerida basada en coherencia
    let suggestedAction = 'Validación automática';
    if (coherenceCheck.startsWith('Incoherente')) {
      suggestedAction = 'Revisar manualmente';
    }

    return {
      sentiment_label: sentimentLabel,
      coherence_check: coherenceCheck,
      suggested_action: suggestedAction,
    };
  }
}
