import React, { useEffect, useRef, useState } from "react";
import "./ChatWidget.css";
import { sendChatMessage, ChatResponse, BusinessLocation, ChatCoordinates } from "../services/chat";
import { useAuth } from "../context/AuthContext";
import { useSpeakable } from "../hooks/useSpeakable";

type Message = { 
  role: "user" | "bot"; 
  text: string; 
  suggestions?: string[];
  businesses?: BusinessLocation[];
};

export default function ChatWidget() {
  const { user } = useAuth();
  const prevUserIdRef = useRef<number | undefined>(undefined);
  const { onMouseEnter, onFocus } = useSpeakable();
  
  const [open, setOpen] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem("chatWidgetOpen") || "false"); } catch { return false; }
  });
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "¡Hola! Soy tu asistente de Inclumap. ¿En qué te puedo ayudar hoy?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<ChatCoordinates | null>(null);
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt">("prompt");
  const bodyRef = useRef<HTMLDivElement | null>(null);

  // Cargar mensajes del usuario actual cuando cambia
  useEffect(() => {
    const currentUserId = user?.user_id;
    
    // Si el usuario cambió (incluyendo de logged a guest o viceversa)
    if (prevUserIdRef.current !== currentUserId) {
      prevUserIdRef.current = currentUserId;
      
      const userId = currentUserId || 'guest';
      try {
        const raw = localStorage.getItem(`chatWidgetMessages_${userId}`);
        if (raw) {
          setMessages(JSON.parse(raw));
        } else {
          setMessages([{ role: "bot", text: "¡Hola! Soy tu asistente de Inclumap. ¿En qué te puedo ayudar hoy?" }]);
        }
      } catch {
        setMessages([{ role: "bot", text: "¡Hola! Soy tu asistente de Inclumap. ¿En qué te puedo ayudar hoy?" }]);
      }
      
      // Resetear ubicación cuando cambia de usuario
      setUserLocation(null);
      setLocationPermission("prompt");
    }
  }, [user?.user_id]);

  useEffect(() => { localStorage.setItem("chatWidgetOpen", JSON.stringify(open)); }, [open]);
  
  // Guardar mensajes del usuario actual
  useEffect(() => { 
    const userId = user?.user_id || 'guest';
    localStorage.setItem(`chatWidgetMessages_${userId}`, JSON.stringify(messages)); 
  }, [messages, user?.user_id]);
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [messages, loading, open]);

  // Solicitar ubicación al abrir el chat
  useEffect(() => {
    if (open && !userLocation && locationPermission === "prompt") {
      requestLocation();
    }
  }, [open]);

  const requestLocation = () => {
    if (!navigator.geolocation) {

      setLocationPermission("denied");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationPermission("granted");
      },
      (error) => {

        setLocationPermission("denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutos
      }
    );
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);
    try {
      const res: ChatResponse = await sendChatMessage(trimmed, userLocation || undefined);
      setMessages((prev) => [...prev, { 
        role: "bot", 
        text: res.response, 
        suggestions: res.suggestions,
        businesses: res.businesses 
      }]);
    } catch (e: any) {
      setError(e?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") handleSend(); };

  const openInGoogleMaps = (lat: number, lng: number, name: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(name)}`;
    window.open(url, '_blank');
  };

  // Componente para renderizar tarjetas de negocios
  const BusinessCard = ({ business }: { business: BusinessLocation }) => (
    <div style={{
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: 8,
      padding: 12,
      marginTop: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
            {business.name}
          </h4>
          <p style={{ margin: '4px 0', fontSize: 12, color: '#64748b' }}>
            📍 {business.address}
          </p>
          <p style={{ margin: '4px 0', fontSize: 12, color: '#0ea5e9', fontWeight: 600 }}>
            📏 A {business.distance} km de distancia
          </p>
        </div>
      </div>
      <button
        onClick={() => openInGoogleMaps(business.latitude, business.longitude, business.name)}
        style={{
          marginTop: 8,
          width: '100%',
          background: '#0ea5e9',
          color: '#fff',
          border: 0,
          borderRadius: 6,
          padding: '8px 12px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <i className="fas fa-map-marked-alt" />
        Ver en Google Maps
      </button>
    </div>
  );

  return (
    <>
      <button 
        className="chat-fab" 
        aria-label="Abrir chat" 
        title="Chat de asistencia"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={onMouseEnter}
        onFocus={onFocus}
      >
        <i className="fas fa-comments" />
      </button>

      {open && (
        <div className="chat-panel" role="dialog" aria-label="Chat flotante Inclumap">
          <div className="header">
            <span className="title">Chatbot Inclumap</span>
            {locationPermission === "granted" && (
              <span style={{ fontSize: 12, color: '#86efac', marginRight: 'auto', marginLeft: 8 }}>
                <i className="fas fa-map-marker-alt" /> Ubicación activa
              </span>
            )}
            <button 
              onClick={() => setOpen(false)} 
              aria-label="Cerrar chat" 
              style={{ background: "transparent", color: "#fff", border: 0, cursor: "pointer" }}
              onMouseEnter={onMouseEnter}
              onFocus={onFocus}
            >
              <i className="fas fa-times" />
            </button>
          </div>
          <div className="body" ref={bodyRef}>
            {messages.map((m, idx) => (
              <div key={idx} className={`row ${m.role}`}>
                <div className={`bubble ${m.role}`}>
                  {m.text}
                  {m.role === "bot" && m.suggestions && m.suggestions.length && !m.businesses ? (
                    <div style={{ marginTop: 6 }}>
                      <strong>Sugerencias:</strong>
                      <ul style={{ paddingLeft: 18, marginTop: 4 }}>
                        {m.suggestions.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {m.role === "bot" && m.businesses && m.businesses.length > 0 ? (
                    <div style={{ marginTop: 8 }}>
                      {m.businesses.map((business) => (
                        <BusinessCard key={business.id} business={business} />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {loading && <div className="loading">Escribiendo…</div>}
            {error && <div className="error-mini">{error}</div>}
          </div>
          <div className="footer">
            {locationPermission === "denied" && (
              <div style={{ 
                fontSize: 11, 
                color: '#f59e0b', 
                padding: '4px 8px', 
                background: '#fef3c7', 
                borderRadius: 4,
                marginBottom: 4,
                textAlign: 'center'
              }}>
                <i className="fas fa-exclamation-triangle" /> Activa la ubicación para mejores resultados
              </div>
            )}
            <input
              className="input"
              placeholder="Escribe tu mensaje"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              aria-label="Entrada de mensaje"
            />
            <button className="chat-btn" onClick={handleSend} disabled={loading || !input.trim()} style={{ background: "#0ea5e9", color: "#fff", border: 0, borderRadius: 8, padding: "8px 12px", fontWeight: 600 }}>
              <i className="fas fa-paper-plane" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
