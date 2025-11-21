import { api } from '../config/api';

export interface BusinessStatistics {
  views: {
    total: number;
    lastWeek: number;
    lastMonth: number;
    trend: number;
    daily: Array<{ date: string; count: number }>;
    weekly: Array<{ date: string; count: number }>;
    monthly: Array<{ date: string; count: number }>;
    yearly: Array<{ date: string; count: number }>;
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
    score: number;
    total: number;
    completed: number;
    missing: string[];
    completedItems: string[];
  };
  photos: {
    count: number;
    hasLogo: boolean;
    recentCount: number;
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

export const getBusinessStatistics = async (
  businessId: number
): Promise<BusinessStatistics> => {
  const response = await api.get(`/business/${businessId}/statistics`);
  return response.data;
};

export const recordBusinessView = async (businessId: number): Promise<void> => {
  try {
    // Usar el endpoint público para no requerir autenticación
    await api.post(`/business/public/${businessId}/view`, {
      user_agent: navigator.userAgent,
      referrer: document.referrer,
    });
  } catch (error) {
    console.error('Error recording view:', error);
  }
};
