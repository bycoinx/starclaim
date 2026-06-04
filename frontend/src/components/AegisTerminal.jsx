import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Send, X, MessageSquare, Cpu } from 'lucide-react';
import { api } from '../lib/api';
import './AegisTerminal.css';

const AegisTerminal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isTyping]);

  const formatAegisError = (error) => {
    if (error?.response) {
      const { status, data } = error.response;
      const serverMsg = data?.detail || data?.error || data?.reply;
      if (status === 404) {
        return 'Aegis endpoint bulunamadı. `REACT_APP_BACKEND_URL` veya API yönlendirmesini kontrol edin.';
      }
      return serverMsg ? `Sunucu hatası ${status}: ${serverMsg}` : `Sunucu hatası ${status}`;
    }
    return error?.message || 'Sistemleri kontrol ediyorum.';
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    const nextHistory = [...history, { role: 'user', content: userMessage }];
    setInput('');
    setHistory(nextHistory);
    setIsTyping(true);

    try {
      const response = await api.post('/ai/support', {
        message: userMessage,
        history: nextHistory.slice(-5), // Son 5 mesajı context olarak gönder
        language: 'TR'
      });

      setHistory(prev => [...prev, { role: 'assistant', content: response.data.reply || 'Aegis destek yanıtı alınamadı.' }]);
    } catch (error) {
      const errorMessage = formatAegisError(error);
      setHistory(prev => [...prev, { role: 'assistant', content: `Kuantum bağlantı hatası, Sir. ${errorMessage}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="aegis-terminal-container">
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            className="aegis-trigger"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            whileHover={{ scale: 1.1 }}
          >
            <div className="pulse-ring"></div>
            <MessageSquare size={24} color="#00f3ff" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="aegis-window"
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
          >
            <div className="aegis-header">
              <div className="aegis-title">
                <Cpu size={16} className="spin-slow" />
                <span>AEGIS SUPPORT SENTINEL v3.0</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="close-btn">
                <X size={18} />
              </button>
            </div>

            <div className="aegis-body" ref={scrollRef}>
              <div className="message assistant">
                Sistemler aktif. Hoş geldiniz Explorer. StarClaim evreni hakkında her şeyi sorabilirsiniz.
              </div>
              
              {history.map((msg, i) => (
                <div key={i} className={`message ${msg.role}`}>
                  {msg.content}
                </div>
              ))}

              {isTyping && (
                <div className="message assistant typing">
                  <div className="wave"></div>
                  <div className="wave"></div>
                  <div className="wave"></div>
                </div>
              )}
            </div>

            <form className="aegis-footer" onSubmit={handleSend}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Bir komut girin veya soru sorun..."
                autoFocus
              />
              <button type="submit" disabled={isTyping || !input.trim()}>
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AegisTerminal;
