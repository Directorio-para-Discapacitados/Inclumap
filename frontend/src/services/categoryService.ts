const API_URL = "http://localhost:9080";

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

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

/**
 * Crea una nueva categoría
 * @param categoryData - Datos de la categoría a crear
 * @returns Promise con la categoría creada
 */
export const createCategory = async (categoryData: Omit<Category, 'category_id'>): Promise<Category> => {
  try {
    const response = await fetch(`${API_URL}/categories`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error al crear categoría: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al crear categoría:", error);
    throw error;
  }
};

/**
 * Actualiza una categoría existente
 * @param id - ID de la categoría a actualizar
 * @param categoryData - Datos actualizados de la categoría
 * @returns Promise con la categoría actualizada
 */
export const updateCategory = async (id: number, categoryData: Partial<Omit<Category, 'category_id'>>): Promise<Category> => {
  try {
    const response = await fetch(`${API_URL}/categories/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error al actualizar categoría: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al actualizar categoría:", error);
    throw error;
  }
};

/**
 * Elimina una categoría
 * @param id - ID de la categoría a eliminar
 * @returns Promise
 */
export const deleteCategory = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/categories/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error al eliminar categoría: ${response.status}`);
    }
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    throw error;
  }
};
