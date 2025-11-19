const API_URL = "http://localhost:9080";

export interface Category {
  category_id: number;
  name: string;
  description: string;
}

/**
 * Obtiene todas las categorías disponibles
 * @returns Promise con el arreglo de categorías ordenadas por ID (según el orden del seed)
 */
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const response = await fetch(`${API_URL}/categories`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener categorías: ${response.status}`);
    }

    const data: Category[] = await response.json();
    
    // Ordenar por category_id (respetando el orden del seed del backend)
    const sortedCategories = data.sort((a, b) => a.category_id - b.category_id);
    
    return sortedCategories;
  } catch (error) {
    console.error("Error al cargar categorías:", error);
    throw error;
  }
};

/**
 * Obtiene una categoría por ID
 * @param id - ID de la categoría
 * @returns Promise con la categoría
 */
export const getCategoryById = async (id: number): Promise<Category> => {
  try {
    const response = await fetch(`${API_URL}/categories/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener categoría: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al cargar categoría:", error);
    throw error;
  }
};
