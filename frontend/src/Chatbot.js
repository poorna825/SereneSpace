
import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function Chatbot() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I'm SereneBot. How can I help you today?" }
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

  const handleSend = async () => {
    if (input.trim() === "") return;

    const userMessage = { sender: "user", text: input };
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
          timestamp: data.timestamp
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
          text: "Sorry, I encountered an error. Please try again." 
        }]);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Network error. Please check your connection and try again.");
      setMessages(prev => [...prev, { 
        sender: "bot", 
        text: "Sorry, I'm having trouble connecting. Please try again." 
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
    <div className="container py-5">
      <h2 className="text-center text-primary mb-4">
        Chat with SereneBot 🤖
        <small className="d-block text-muted fs-6 mt-2">
          AI-powered emotional support and mental wellness companion
        </small>
      </h2>

      {crisisDetected && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <strong>🚨 Crisis Support Available (India 🇮🇳)</strong>
          <p className="mb-2">If you're in crisis, please reach out for immediate help:</p>
          <ul className="mb-2">
            <li><strong>AASRA (24x7):</strong> <a href="tel:+919820466726" className="text-danger">+91 9820466726</a></li>
            <li><strong>Vandrevala Foundation:</strong> <span className="text-danger">1860 2662 345</span> / <span className="text-danger">1800 2333 330</span></li>
            <li><strong>iCall Psychosocial Helpline:</strong> <a href="tel:+919152987821" className="text-danger">+91 9152987821</a></li>
            <li><strong>NIMHANS Crisis Helpline:</strong> <span className="text-danger">080-46110007</span></li>
            <li><strong>Emergency Services:</strong> Call <span className="text-danger">112</span></li>
          </ul>
          <p className="mb-0 small"><em>You're not alone. Professional help is available 24/7.</em></p>
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setCrisisDetected(false)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {error && (
        <div className="alert alert-warning alert-dismissible fade show" role="alert">
          <strong>Warning:</strong> {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      <div className="card shadow">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <span>
            💬 Session {sessionId ? `#${sessionId}` : '(New)'}
          </span>
          <div className="form-check form-switch">
            <input 
              className="form-check-input" 
              type="checkbox" 
              id="anonymousMode"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="anonymousMode">
              Anonymous Mode
            </label>
          </div>
        </div>
        <div className="card-body" style={{ height: "500px", overflowY: "auto", backgroundColor: "#f8f9fa" }}>
          {messages.map((msg, index) => (
            <div key={index} className={`mb-3 text-${msg.sender === "user" ? "end" : "start"}`}>
              <div style={{ display: 'inline-block', maxWidth: '80%' }}>
                <span 
                  className={`badge p-3 shadow-sm`} 
                  style={{ 
                    backgroundColor: msg.sender === "user" ? "#0d6efd" : "#6c757d",
                    whiteSpace: "pre-wrap",
                    borderRadius: "12px",
                    fontSize: "0.95rem",
                    textAlign: "left"
                  }}
                >
                  {msg.text}
                </span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="mb-2 text-start">
              <span className="badge bg-secondary p-2 shadow-sm" style={{ borderRadius: "12px" }}>
                <span className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </span>
                SereneBot is analyzing your message...
              </span>
            </div>
          )}
          <div ref={chatEndRef} /> {/* Scroll target */}
        </div>

        <div className="card-footer bg-white">
          <div className="d-flex">
            <input
              type="text"
              className="form-control me-2"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share your thoughts or feelings..."
              disabled={isTyping}
              style={{ borderRadius: "20px" }}
            />
            <button 
              className="btn btn-primary px-4" 
              onClick={handleSend}
              disabled={isTyping || input.trim() === ""}
              style={{ borderRadius: "20px" }}
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
    </div>
  );
}

export default Chatbot;

