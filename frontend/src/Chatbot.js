
import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function Chatbot() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I'm SereneBot. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  
  // Ref to chat div for auto-scroll
  const chatEndRef = useRef(null);

  const handleSend = async () => {
    if (input.trim() === "") return;

    const userMessage = { sender: "user", text: input };

    setMessages(prev => [...prev, userMessage]);

    try {
      const res = await fetch("http://localhost:5000/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input })
      });

      const data = await res.json();
      const botMessage = { sender: "bot", text: data.reply };

      setMessages(prev => [...prev, botMessage]);
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

      <div className="card shadow">
        <div className="card-body" style={{ height: "400px", overflowY: "auto" }}>
          {messages.map((msg, index) => (
            <div key={index} className={`mb-2 text-${msg.sender === "user" ? "end" : "start"}`}>
              <span className={`badge bg-${msg.sender === "user" ? "success" : "secondary"}`}>
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

