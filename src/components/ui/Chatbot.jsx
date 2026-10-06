import { useState, useRef, useEffect } from 'react';
import { PRIVACY_URL } from '@utils/privacy';
import './Chatbot.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const MAX_LENGTH = 500;

export default function Chatbot() {
  const [isOpen, setIsOpen]   = useState(false);
  const [messages, setMessages] = useState([
    { text: '¡Hola! Soy CertiBot de Sapper Industries. Puedo ayudarte con precios, requisitos, modalidades e inscripciones de nuestras certificaciones y capacitaciones. ¿Qué programa te interesa?', sender: 'bot', buttons: [] }
  ]);
  const [input, setInput]     = useState('');
  const messagesEndRef         = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const pushBot = (text, buttons = []) =>
    setMessages((prev) => [...prev.filter((m) => !m.isTyping), { text, sender: 'bot', buttons }]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { text: userMessage, sender: 'user', buttons: [] }]);
    setInput('');
    setMessages((prev) => [...prev, { text: '...', sender: 'bot', isTyping: true, buttons: [] }]);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await res.json().catch(() => ({}));
      // 400 = el backend rechazó el mensaje (vacío o muy largo): mostrar su motivo, no "no disponible"
      if (res.status === 400) {
        const motivo = Array.isArray(data.message) ? data.message[0] : data.message;
        pushBot(motivo || `Escribe un mensaje de hasta ${MAX_LENGTH} caracteres.`);
        return;
      }
      if (!res.ok) throw new Error('error');
      pushBot(data.response || '¿Podrías repetir tu consulta?', data.buttons || []);
    } catch {
      pushBot('El asistente no está disponible en este momento. Puedes contactarnos directamente.', [
        { label: 'Ir a Contacto', url: '/contacto' },
      ]);
    }
  };

  return (
    <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
      {!isOpen && (
        <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
          <img src="/juan.png" alt="CertiBot" className="chatbot-avatar" />
          <span className="chatbot-badge">1</span>
        </button>
      )}

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <img src="/juan.png" alt="CertiBot" className="chatbot-avatar-small" />
              <div>
                <h4>Juan el Castor</h4>
                <span>Soporte IA</span>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, idx) => {
              const itemCards  = (msg.buttons || []).filter((b) => b.type === 'item');
              const regularBtns = (msg.buttons || []).filter((b) => b.type !== 'item');
              return (
                <div key={idx} className={`chat-message-group ${msg.sender}`}>
                  <div className={`chat-bubble ${msg.sender} ${msg.isTyping ? 'typing' : ''}`}>
                    {msg.text}
                    {itemCards.length > 0 && (
                      <div className="chat-items-list">
                        {itemCards.map((item, i) => (
                          <a key={i} href={item.url} className="chat-item-card">
                            <span className="chat-item-name">{item.label}</span>
                            <div className="chat-item-meta">
                              <span className="chat-item-price">${item.precio}</span>
                              {item.modalidad && <span className="chat-item-badge">{item.modalidad}</span>}
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  {regularBtns.length > 0 && (
                    <div className="chat-buttons">
                      {regularBtns.map((btn, i) => {
                        const isExternal = btn.url.startsWith('http');
                        return isExternal ? (
                          <a key={i} href={btn.url} target="_blank" rel="noopener noreferrer" className="chat-btn">
                            {btn.label}
                          </a>
                        ) : (
                          <a key={i} href={btn.url} className="chat-btn">
                            {btn.label}
                          </a>
                        );
                      })}
                    </div>
                  )}
                  {idx === 0 && (
                    <p className="chat-privacy-note">
                      Este asistente es automático. Para mejorarlo guardamos hasta 90 días algunas preguntas
                      que no entiende, sin tus datos personales. No escribas tu cédula ni datos bancarios.{' '}
                      <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">Política de privacidad</a>
                    </p>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Escribe tu pregunta..."
              maxLength={MAX_LENGTH}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={!input.trim()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
