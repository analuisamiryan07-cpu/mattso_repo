import { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Respuestas locales de fallback cuando el backend no está disponible.
 * Usa coincidencia de keywords — sin dependencias externas.
 */
const LOCAL_RESPONSES = [
  { keywords: ['hola', 'buenos', 'saludos', 'hey'], response: '¡Hola! Soy Juan 🦫, tu asistente en MATTSO. ¿En qué te puedo ayudar?' },
  { keywords: ['precio', 'cuesta', 'vale', 'valor', 'costo'], response: 'Los precios varían según el curso. Visita la sección "Capacitaciones" o "Certificaciones" para ver los detalles de cada uno.' },
  { keywords: ['inscri', 'matric', 'comprar', 'pago', 'pagar'], response: '¡Es fácil! Ve al catálogo, elige tu curso, agrégalo al carrito y sigue los pasos de pago.' },
  { keywords: ['certific'], response: 'Tenemos certificaciones avaladas por el Ministerio de Trabajo. Revisa la sección "Certificaciones" para ver todas las opciones disponibles.' },
  { keywords: ['capacita', 'curso'], response: 'Ofrecemos capacitaciones en Seguridad Industrial, Salud Ocupacional y más. Ve a "Capacitaciones" para ver el catálogo completo.' },
  { keywords: ['horario', 'hora', 'cuando'], response: 'Nuestras capacitaciones virtuales son flexibles — estudia a tu ritmo. Las presenciales tienen fechas específicas que puedes ver en el catálogo.' },
  { keywords: ['contacto', 'teléfono', 'correo', 'email'], response: 'Puedes contactarnos desde la página de Contacto o escribirnos a info@campusmatsso.com.' },
  { keywords: ['quien', 'nombre', 'llamas'], response: 'Soy Juan el Castor 🦫, ingeniero de MATTSO. Mi trabajo es ayudarte a encontrar la capacitación ideal.' },
];

function getLocalResponse(message) {
  const lower = message.toLowerCase();
  for (const entry of LOCAL_RESPONSES) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.response;
    }
  }
  return '¡Buena pregunta! Para información más detallada, te invito a visitar nuestras secciones de Capacitaciones y Certificaciones, o contáctanos directamente.';
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: '¡Hola! Soy Juan 🦫, ingeniero en MATTSO. ¿En qué te puedo ayudar hoy?', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { text: userMessage, sender: 'user' }]);
    setInput('');

    // Typing indicator
    setMessages((prev) => [...prev, { text: '...', sender: 'bot', isTyping: true }]);

    let botReply;
    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) throw new Error('Backend error');
      const data = await response.json();
      botReply = data.response || getLocalResponse(userMessage);
    } catch {
      // Backend no disponible — usa respuestas locales
      botReply = getLocalResponse(userMessage);
    }

    setMessages((prev) => {
      const updated = prev.filter((m) => !m.isTyping);
      return [...updated, { text: botReply, sender: 'bot' }];
    });
  };

  return (
    <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
      {!isOpen && (
        <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
          <img src="/juan.png" alt="Juan el Castor" className="chatbot-avatar" />
          <span className="chatbot-badge">1</span>
        </button>
      )}

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <img src="/juan.png" alt="Juan el Castor" className="chatbot-avatar-small" />
              <div>
                <h4>Juan el Castor</h4>
                <span>Soporte IA</span>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble ${msg.sender} ${msg.isTyping ? 'typing' : ''}`}>
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input" onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="Escribe tu pregunta..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={!input.trim()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
