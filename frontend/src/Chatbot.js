
import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function Chatbot() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I'm SereneBot. How can I help you today?", timestamp: new Date().toISOString() }
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [anonymous, setAnonymous] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [showCrisisCard, setShowCrisisCard] = useState(false);
  const [error, setError] = useState(null);
  
  // Ref to chat div for auto-scroll
  const chatEndRef = useRef(null);
  const crisisBoxRef = useRef(null);
  const crisisCardRef = useRef(null);

  // Crisis keywords to check in bot responses
  const crisisKeywords = ['emergency', 'hotline', 'help immediately', 'crisis', 'suicide', 'self-harm'];

  // Helper function to parse crisis helpline from bot message
  const parseCrisisHelpline = (message) => {
    // Check if message contains India Crisis Helplines
    if (message.includes('India Crisis Helplines') || message.includes('🇮🇳')) {
      // Extract the helpline section
      const lines = message.split('\n');
      const helplineLines = [];
      let inHelplineSection = false;
      
      for (const line of lines) {
        if (line.includes('India Crisis Helplines') || line.includes('🇮🇳')) {
          inHelplineSection = true;
        }
        if (inHelplineSection && line.trim()) {
          helplineLines.push(line.trim());
        }
      }
      
      return helplineLines.length > 0 ? helplineLines : null;
    }
    return null;
  };

  // Helper function to separate message text from helplines
  const separateMessageAndHelplines = (message) => {
    const helplines = parseCrisisHelpline(message);
    if (helplines) {
      // Find where helplines start and split
      const helplineStart = message.indexOf(helplines[0]);
      const mainMessage = message.substring(0, helplineStart).trim();
      const helplineText = message.substring(helplineStart).trim();
      return { mainMessage, helplineText, hasHelplines: true };
    }
    return { mainMessage: message, helplineText: null, hasHelplines: false };
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSend = async () => {
    if (input.trim() === "") return;

    const userMessage = { sender: "user", text: input, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput("");
    setError(null);

    const token = localStorage.getItem('token');
    
    // Show typing indicator
    setIsTyping(true);

    try {
      const headers = {
        "Content-Type": "application/json"
      };
      
      // Include JWT token if available
      if (token && !anonymous) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Use the new emotion-aware endpoint
      const res = await fetch("http://localhost:4000/api/chatbot/emotion", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ 
          message: userInput,
          sessionId: sessionId
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        const botMessage = { 
          sender: "bot", 
          text: data.reply || "I'm here to help.",
          emotion: data.emotion,
          timestamp: data.timestamp || new Date().toISOString()
        };
        setMessages(prev => [...prev, botMessage]);
        
        // Update session ID
        if (data.sessionId) {
          setSessionId(data.sessionId);
        }
        
        // Check for crisis keywords in the bot's response
        const containsCrisisKeyword = crisisKeywords.some(keyword => 
          data.reply.toLowerCase().includes(keyword)
        );
        
        // Check if message contains India helplines
        const hasHelplines = data.reply.includes('India Crisis Helplines') || data.reply.includes('🇮🇳');
        
        if (containsCrisisKeyword || hasHelplines) {
          setCrisisDetected(true);
          setShowCrisisCard(true);
        }
      } else {
        setError(data.error || "Failed to get response from bot");
        setMessages(prev => [...prev, { 
          sender: "bot", 
          text: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Network error. Please check your connection and try again.");
      setMessages(prev => [...prev, { 
        sender: "bot", 
        text: "Sorry, I'm having trouble connecting. Please try again.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Auto-scroll effect whenever messages change
  useEffect(() => {
    // If crisis card is shown, scroll to it first
    if (showCrisisCard && crisisCardRef.current) {
      setTimeout(() => {
        crisisCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } else {
      // Otherwise scroll to bottom
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, showCrisisCard]);

  // Auto-scroll to crisis box within message when it appears
  useEffect(() => {
    if (crisisBoxRef.current) {
      setTimeout(() => {
        crisisBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [messages]);

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent newline in input
      handleSend();
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f3e7ff 0%, #e8d5ff 50%, #dfc4ff 100%)',
      position: 'relative'
    }}>
      <div className="container py-4" style={{ maxWidth: '900px' }}>
        {/* Enhanced Header */}
        <div className="text-center mb-4">
          <h2 className="fw-bold mt-3" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem',
            fontSize: '2.5rem'
          }}>
            SereneBot
          </h2>
          <p className="text-muted">
            AI-powered emotional support and mental wellness companion
          </p>
        </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-warning alert-dismissible fade show shadow-sm mb-4" role="alert" style={{
          borderLeft: '4px solid #ffc107'
        }}>
          <strong>⚠️ Warning:</strong> {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Main Chat Card */}
      <div className="card border-0 shadow-lg" style={{ 
        borderRadius: '20px',
        overflow: 'hidden'
      }}>
        {/* Chat Header */}
        <div 
          className="card-header text-white py-3"
          style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderBottom: 'none'
          }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <span className="me-2" style={{ fontSize: '1.2rem' }}>💬</span>
              <span className="fw-semibold">
                Session {sessionId ? `#${sessionId}` : '(New)'}
              </span>
            </div>
            <div className="form-check form-switch">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="anonymousMode"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label className="form-check-label" htmlFor="anonymousMode" style={{ cursor: 'pointer' }}>
                🔒 Anonymous
              </label>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div 
          className="card-body p-4" 
          style={{ 
            height: "550px", 
            overflowY: "auto",
            background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)'
          }}
        >
          {/* Crisis Helpline Card at Top */}
          {showCrisisCard && (
            <div 
              ref={crisisCardRef}
              className="mb-4 shadow-lg"
              style={{
                backgroundColor: '#dc3545',
                color: '#ffffff',
                borderRadius: '16px',
                border: '4px solid #b02a37',
                padding: '20px',
                animation: 'pulseRed 2s infinite, slideDown 0.5s ease-out',
                position: 'relative'
              }}
            >
              <button
                onClick={() => setShowCrisisCard(false)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(255, 255, 255, 0.3)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  color: '#ffffff',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}
                aria-label="Close crisis card"
              >
                ×
              </button>
              <div className="d-flex align-items-center mb-3">
                <span style={{ fontSize: '2rem', marginRight: '12px' }}>🚨</span>
                <strong style={{ fontSize: '1.3rem' }}>CRISIS HELPLINES - IMMEDIATE SUPPORT</strong>
              </div>
              <p className="mb-3" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                If you're in crisis or need immediate support, please reach out now. You're not alone.
              </p>
              <div style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '15px',
                fontSize: '0.95rem',
                lineHeight: '1.9'
              }}>
                <div><strong>🇮🇳 India Crisis Helplines:</strong></div>
                <div className="mt-2">
                  • <strong>AASRA (24/7):</strong> <a href="tel:+919820466726" style={{ color: '#ffffff', textDecoration: 'underline' }}>+91 9820466726</a>
                </div>
                <div>
                  • <strong>Vandrevala Foundation:</strong> 1860 2662 345
                </div>
                <div>
                  • <strong>iCall:</strong> <a href="tel:+919152987821" style={{ color: '#ffffff', textDecoration: 'underline' }}>+91 9152987821</a>
                </div>
                <div>
                  • <strong>NIMHANS:</strong> 080-46110007
                </div>
                <div>
                  • <strong>Emergency:</strong> 112
                </div>
              </div>
              <p className="mt-3 mb-0 small fst-italic">
                📞 These numbers are available 24/7. A trained professional can help you through this.
              </p>
            </div>
          )}
          
          {messages.map((msg, index) => {
            const { mainMessage, helplineText, hasHelplines } = separateMessageAndHelplines(msg.text);
            
            return (
            <div 
              key={index} 
              className={`d-flex mb-3 ${msg.sender === "user" ? "justify-content-end" : "justify-content-start"}`}
              style={{ 
                animation: 'fadeIn 0.4s ease-in',
                animationFillMode: 'both',
                animationDelay: `${index * 0.05}s`
              }}
            >
              {msg.sender === "bot" && (
                <div 
                  className="me-2 d-flex align-items-end"
                  style={{ 
                    width: '35px',
                    height: '35px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0
                  }}
                >
                  🤖
                </div>
              )}
              
              <div style={{ maxWidth: '75%' }}>
                <div 
                  className="p-3 shadow-sm"
                  style={{ 
                    backgroundColor: msg.sender === "user" 
                      ? '#667eea' 
                      : '#ffffff',
                    color: msg.sender === "user" ? '#ffffff' : '#212529',
                    borderRadius: msg.sender === "user" 
                      ? '18px 18px 4px 18px' 
                      : '18px 18px 18px 4px',
                    wordWrap: 'break-word',
                    fontSize: '0.95rem',
                    lineHeight: '1.5',
                    border: msg.sender === "bot" ? '1px solid #e0e0e0' : 'none'
                  }}
                >
                  {mainMessage}
                  
                  {/* Crisis Helpline Red Box */}
                  {hasHelplines && msg.sender === "bot" && (
                    <div 
                      ref={crisisBoxRef}
                      className="mt-3 p-3 shadow"
                      style={{
                        backgroundColor: '#dc3545',
                        color: '#ffffff',
                        borderRadius: '12px',
                        border: '3px solid #b02a37',
                        animation: 'pulseRed 2s infinite',
                        fontWeight: '500'
                      }}
                    >
                      <div className="d-flex align-items-center mb-2">
                        <span style={{ fontSize: '1.5rem', marginRight: '8px' }}>🚨</span>
                        <strong style={{ fontSize: '1.1rem' }}>CRISIS HELPLINES</strong>
                      </div>
                      <div style={{ 
                        whiteSpace: 'pre-line',
                        fontSize: '0.9rem',
                        lineHeight: '1.8'
                      }}>
                        {helplineText}
                      </div>
                    </div>
                  )}
                </div>
                <div 
                  className={`mt-1 ${msg.sender === "user" ? "text-end" : "text-start"}`}
                  style={{ 
                    fontSize: '0.7rem',
                    color: '#6c757d'
                  }}
                >
                  {formatTime(msg.timestamp)}
                </div>
              </div>

              {msg.sender === "user" && (
                <div 
                  className="ms-2 d-flex align-items-end"
                  style={{ 
                    width: '35px',
                    height: '35px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0
                  }}
                >
                  👤
                </div>
              )}
            </div>
          )})}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="d-flex justify-content-start mb-3" style={{ animation: 'fadeIn 0.3s ease-in' }}>
              <div 
                className="me-2"
                style={{ 
                  width: '35px',
                  height: '35px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  flexShrink: 0
                }}
              >
                🤖
              </div>
              <div 
                className="p-3 shadow-sm"
                style={{ 
                  backgroundColor: '#ffffff',
                  borderRadius: '18px 18px 18px 4px',
                  border: '1px solid #e0e0e0'
                }}
              >
                <div className="d-flex align-items-center">
                  <div 
                    className="spinner-grow spinner-grow-sm me-2" 
                    role="status" 
                    style={{ 
                      width: '8px', 
                      height: '8px',
                      color: '#667eea'
                    }}
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <div 
                    className="spinner-grow spinner-grow-sm me-2" 
                    role="status" 
                    style={{ 
                      width: '8px', 
                      height: '8px',
                      color: '#667eea',
                      animationDelay: '0.15s'
                    }}
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <div 
                    className="spinner-grow spinner-grow-sm" 
                    role="status" 
                    style={{ 
                      width: '8px', 
                      height: '8px',
                      color: '#667eea',
                      animationDelay: '0.3s'
                    }}
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Footer */}
        <div className="card-footer bg-white border-0 p-3">
          <div className="d-flex align-items-center">
            <input
              type="text"
              className="form-control border-0 shadow-sm me-2"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              disabled={isTyping}
              style={{ 
                borderRadius: "25px",
                padding: "12px 20px",
                fontSize: "0.95rem",
                backgroundColor: '#f8f9fa'
              }}
            />
            <button 
              className="btn text-white shadow-sm" 
              onClick={handleSend}
              disabled={isTyping || input.trim() === ""}
              style={{ 
                borderRadius: "25px",
                padding: "12px 24px",
                background: input.trim() === "" 
                  ? '#6c757d' 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                fontWeight: '500',
                minWidth: '80px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isTyping ? (
                <span className="spinner-border spinner-border-sm" role="status"></span>
              ) : (
                "Send"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulseRed {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(220, 53, 69, 0);
          }
        }

        .card-body::-webkit-scrollbar {
          width: 8px;
        }
        
        .card-body::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .card-body::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
        }
        
        .card-body::-webkit-scrollbar-thumb:hover {
          background: #764ba2;
        }

        .btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4) !important;
        }

        .form-control:focus {
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25) !important;
          border-color: #667eea !important;
        }
      `}</style>
      </div>
    </div>
  );
}

export default Chatbot;

