import { api } from "../config/api";

export interface Accessibility {
  accessibility_id: number;
  accessibility_name: string;
  description?: string;
}

export const getAllAccessibilities = async (): Promise<Accessibility[]> => {
  try {
    const response = await api.get('/accessibility');
    return response.data;
  } catch (error) {
    console.error('Error al obtener accesibilidades:', error);
    throw error;
  }
};
