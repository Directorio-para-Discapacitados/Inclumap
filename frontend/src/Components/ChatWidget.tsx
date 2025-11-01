import React, { useEffect, useRef, useState } from "react";
import "./ChatWidget.css";
import { sendChatMessage, ChatResponse } from "../services/chat";

 type Message = { role: "user" | "bot"; text: string; suggestions?: string[] };

export default function ChatWidget() {
  const [open, setOpen] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem("chatWidgetOpen") || "false"); } catch { return false; }
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const raw = localStorage.getItem("chatWidgetMessages");
      if (raw) return JSON.parse(raw);
    } catch {}
    return [{ role: "bot", text: "¡Hola! Soy tu asistente de Inclumap. ¿En qué te puedo ayudar hoy?" }];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { localStorage.setItem("chatWidgetOpen", JSON.stringify(open)); }, [open]);
  useEffect(() => { localStorage.setItem("chatWidgetMessages", JSON.stringify(messages)); }, [messages]);
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [messages, loading, open]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);
    try {
      const res: ChatResponse = await sendChatMessage(trimmed);
      setMessages((prev) => [...prev, { role: "bot", text: res.response, suggestions: res.suggestions }]);
    } catch (e: any) {
      setError(e?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") handleSend(); };

  return (
    <>
      <button className="chat-fab" aria-label="Abrir chat" onClick={() => setOpen((v) => !v)}>
        <i className="fas fa-comments" />
      </button>

      {open && (
        <div className="chat-panel" role="dialog" aria-label="Chat flotante Inclumap">
          <div className="header">
            <span className="title">Chatbot Inclumap</span>
            <button onClick={() => setOpen(false)} aria-label="Cerrar" style={{ background: "transparent", color: "#fff", border: 0, cursor: "pointer" }}>
              <i className="fas fa-times" />
            </button>
          </div>
          <div className="body" ref={bodyRef}>
            {messages.map((m, idx) => (
              <div key={idx} className={`row ${m.role}`}>
                <div className={`bubble ${m.role}`}>
                  {m.text}
                  {m.role === "bot" && m.suggestions && m.suggestions.length ? (
                    <div style={{ marginTop: 6 }}>
                      <strong>Sugerencias:</strong>
                      <ul style={{ paddingLeft: 18, marginTop: 4 }}>
                        {m.suggestions.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {loading && <div className="loading">Escribiendo…</div>}
            {error && <div className="error-mini">{error}</div>}
          </div>
          <div className="footer">
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
