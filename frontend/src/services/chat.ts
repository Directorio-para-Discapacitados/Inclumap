import { API_URL } from "../config/api";

export type BusinessLocation = {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number;
};

export type ChatResponse = {
  response: string;
  suggestions?: string[];
  businesses?: BusinessLocation[];
};

export type ChatCoordinates = {
  latitude: number;
  longitude: number;
};

export async function sendChatMessage(
  message: string,
  coordinates?: ChatCoordinates
): Promise<ChatResponse> {
  const body: any = { message };
  
  // Agregar coordenadas si están disponibles
  if (coordinates) {
    body.latitude = coordinates.latitude;
    body.longitude = coordinates.longitude;
  }

  const res = await fetch(`${API_URL}/chatbot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error ${res.status}`);
  }

  return (await res.json()) as ChatResponse;
}
