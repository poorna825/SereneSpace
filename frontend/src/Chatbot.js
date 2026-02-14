
import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function Chatbot() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I'm SereneBot. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [anonymous, setAnonymous] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  
  // Ref to chat div for auto-scroll
  const chatEndRef = useRef(null);

  const handleSend = async () => {
    if (input.trim() === "") return;

    const userMessage = { sender: "user", text: input };
    setMessages(prev => [...prev, userMessage]);

    const token = localStorage.getItem('token');
    if (!token && !anonymous) {
      setMessages(prev => [...prev, { sender: "bot", text: "Please login or enable anonymous mode to chat." }]);
      setInput("");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/chatbot", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        },
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
        
        if (data.sessionId) setSessionId(data.sessionId);
        
        if (data.crisis) {
          setCrisisDetected(true);
          setMessages(prev => [...prev, { 
            sender: "bot", 
            text: "⚠️ I noticed you might be in distress. Please reach out to a mental health professional or call a crisis hotline immediately. You're not alone." 
          }]);
        }
      } else {
        setMessages(prev => [...prev, { sender: "bot", text: data.error || "Oops, something went wrong!" }]);
      }
    } catch (err) {
      console.error("Error:", err);
      setMessages(prev => [...prev, { sender: "bot", text: "Oops, something went wrong!" }]);
    }

    setInput("");
  };


    // Auto-scroll effect whenever messages change
    useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
        <div className="alert alert-danger text-center mb-3">
          <strong>Crisis Resources:</strong> National Suicide Prevention Lifeline: 988 | Crisis Text Line: Text HOME to 741741
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
          <div ref={chatEndRef} /> {/* Scroll target */}
        </div>

        <div className="card-footer d-flex">
          <input
            type="text"
            className="form-control me-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress} // Listen for Enter
            placeholder="Type your message..."
          />
          <button className="btn btn-primary" onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;

