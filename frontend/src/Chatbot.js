
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
  const [error, setError] = useState(null);
  
  // Ref to chat div for auto-scroll
  const chatEndRef = useRef(null);

  // Crisis keywords to check in bot responses
  const crisisKeywords = ['emergency', 'hotline', 'help immediately', 'crisis', 'suicide', 'self-harm'];

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
        
        if (containsCrisisKeyword) {
          setCrisisDetected(true);
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
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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

      {/* Crisis Alert */}
      {crisisDetected && (
        <div className="alert alert-danger alert-dismissible fade show shadow-sm mb-4" role="alert" style={{ 
          borderLeft: '4px solid #dc3545',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <strong>🚨 Crisis Support Available (India 🇮🇳)</strong>
          <p className="mb-2 mt-2">If you're in crisis, please reach out for immediate help:</p>
          <ul className="mb-2" style={{ fontSize: '0.9rem' }}>
            <li><strong>AASRA (24x7):</strong> <a href="tel:+919820466726" className="text-danger fw-bold">+91 9820466726</a></li>
            <li><strong>Vandrevala Foundation:</strong> <span className="text-danger fw-bold">1860 2662 345</span> / <span className="text-danger fw-bold">1800 2333 330</span></li>
            <li><strong>iCall Psychosocial Helpline:</strong> <a href="tel:+919152987821" className="text-danger fw-bold">+91 9152987821</a></li>
            <li><strong>NIMHANS Crisis Helpline:</strong> <span className="text-danger fw-bold">080-46110007</span></li>
            <li><strong>Emergency Services:</strong> Call <span className="text-danger fw-bold">112</span></li>
          </ul>
          <p className="mb-0 small fst-italic">You're not alone. Professional help is available 24/7.</p>
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setCrisisDetected(false)}
            aria-label="Close"
          ></button>
        </div>
      )}

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
          {messages.map((msg, index) => (
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
                  {msg.text}
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
          ))}
          
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

