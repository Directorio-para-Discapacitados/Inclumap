export class BusinessStatisticsDto {
  views: {
    total: number;
    lastWeek: number;
    lastMonth: number;
    trend: number; // porcentaje de cambio vs periodo anterior
    daily: Array<{ date: string; count: number }>; // últimas 24 horas por hora
    weekly: Array<{ date: string; count: number }>; // últimos 7 días
    monthly: Array<{ date: string; count: number }>; // últimas 4 semanas
    yearly: Array<{ date: string; count: number }>; // últimos 12 meses
  };

  rating: {
    current: number;
    previous: number;
    distribution: {
      five: number;
      four: number;
      three: number;
      two: number;
      one: number;
    };
  };

  reviews: {
    total: number;
    newThisWeek: number;
    newThisMonth: number;
    byStars: {
      five: number;
      four: number;
      three: number;
      two: number;
      one: number;
    };
    sentiment: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };

  accessibility: {
    score: number; // porcentaje de accesibilidades completadas
    total: number;
    completed: number;
    missing: string[];
    completedItems: string[];
  };

  photos: {
    count: number;
    hasLogo: boolean;
    recentCount: number; // fotos de la última semana
  };

  notifications: {
    pending: number;
    urgent: number;
  };

  recentReviews: Array<{
    review_id: number;
    rating: number;
    comment: string;
    sentiment_label: string;
    created_at: Date;
    user: {
      firstName: string;
      firstLastName: string;
    };
  }>;
}

export class RecordViewDto {
  business_id: number;
  user_ip?: string;
  user_agent?: string;
  referrer?: string;
}
