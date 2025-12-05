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

    const esLanguage = {
      labels: {
        // Positivas
        buen: 2,
        bueno: 2,
        buena: 2,
        buenos: 2,
        buenas: 2,
        excelente: 5,
        genial: 4,
        gran: 3,
        grande: 2,
        maravilloso: 5,
        maravillosa: 5,
        increíble: 5,
        fantástico: 5,
        perfecto: 5,
        bien: 2,
        mejor: 3,
        gusta: 2,
        gusto: 2,
        encanta: 4,
        encanto: 4,
        recomiendo: 3,
        recomendado: 3,
        amable: 2,
        rapido: 1,
        limpio: 2,
        rico: 3,
        delicioso: 4,
        accesible: 2,
        útil: 2,
        gracias: 1,
        feliz: 3,
        vuelvan: 2, // La palabra clave de tu ejemplo
        volvere: 2,
        volveremos: 2,
        seguro: 1,
        comodo: 2,
        bonito: 3,
        lindo: 3,
        hermoso: 4,

        // Negativas
        mal: -2,
        malo: -3,
        mala: -3,
        malos: -3,
        malas: -3,
        pesimo: -5,
        pesima: -5,
        horrible: -5,
        terrible: -5,
        fatal: -5,
        peor: -4,
        odio: -4,
        disgusto: -3,
        sucio: -3,
        lento: -2,
        caro: -2,
        feo: -2,
        triste: -2,
        jamás: -2,
        nunca: -1,
        difícil: -2,
        complicado: -2,
        grosero: -3,
        inseguro: -3,
        basura: -5,
        estafa: -5,
        fraude: -5,
        incoherente: -2,
        no: -1, // Cuidado con el contexto, pero ayuda en negativos simples
        tardado: -2,
        desastre: -4,
        decepcion: -4,
        decepcionante: -4,
      },
    };

    // Registramos el idioma 'es'
    this.sentiment.registerLanguage('es', esLanguage);
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

    // USAMOS EL IDIOMA 'es' EN EL ANÁLISIS
    const result = this.sentiment.analyze(text, { language: 'es' });
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
