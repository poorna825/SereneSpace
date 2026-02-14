
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

      const res = await fetch("http://localhost:4000/api/chatbot", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ 
          message: input,
          anonymous: anonymous,
          sessionId: sessionId
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        const botMessage = { sender: "bot", text: data.reply || "I'm here to help." };
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
      <h2 className="text-center text-primary mb-4">Chat with SereneBot</h2>

      {crisisDetected && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <strong>🚨 Crisis Support Available</strong>
          <p className="mb-1">If you're in crisis, please reach out for immediate help:</p>
          <ul className="mb-0">
            <li><strong>National Suicide Prevention Lifeline:</strong> 988</li>
            <li><strong>Crisis Text Line:</strong> Text HOME to 741741</li>
            <li><strong>Emergency Services:</strong> Call 911</li>
          </ul>
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
          <span>Chat Session {sessionId ? `#${sessionId}` : '(New)'}</span>
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
        <div className="card-body" style={{ height: "400px", overflowY: "auto" }}>
          {messages.map((msg, index) => (
            <div key={index} className={`mb-2 text-${msg.sender === "user" ? "end" : "start"}`}>
              <span className={`badge bg-${msg.sender === "user" ? "success" : "secondary"} p-2`} style={{ maxWidth: "80%", whiteSpace: "pre-wrap" }}>
                {msg.text}
              </span>
            </div>
          ))}
          {isTyping && (
            <div className="mb-2 text-start">
              <span className="badge bg-secondary p-2">
                <span className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </span>
                Bot is typing...
              </span>
            </div>
          )}
          <div ref={chatEndRef} /> {/* Scroll target */}
        </div>

        <div className="card-footer d-flex">
          <input
            type="text"
            className="form-control me-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isTyping}
          />
          <button 
            className="btn btn-primary" 
            onClick={handleSend}
            disabled={isTyping || input.trim() === ""}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;

