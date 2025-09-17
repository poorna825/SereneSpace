import React, { useState, useEffect, useRef } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

function PeerHub() {
  const [channels] = useState([
    { id: 1, name: "general" },
    { id: 2, name: "support" },
    { id: 3, name: "random" },
  ]);

  const [users] = useState([
    { id: 1, name: "Alice", online: true },
    { id: 2, name: "Bob", online: true },
    { id: 3, name: "Charlie", online: false },
    { id: 4, name: "You", online: true },
  ]);

  const currentUser = { id: 4, name: "You" };
  const [currentChannel, setCurrentChannel] = useState(channels[0]);
  const [dmUser, setDmUser] = useState(null);
  const [messages, setMessages] = useState([
    // General channel messages
    { channelId: 1, user: "Alice", text: "Hey everyone! How’s your day going?" },
    { channelId: 1, user: "You", text: "Hi Alice! I'm feeling a bit stressed today." },
    { channelId: 1, user: "Bob", text: "Same here, had a tough morning 😅" },
    { channelId: 1, user: "Charlie", text: "Anyone tried meditation today? It helps me calm down." },
    { channelId: 1, user: "You", text: "Not yet, might give it a try. Thanks for the tip!" },

    // Support channel messages
    { channelId: 2, user: "SereneBot", text: "Remember to take deep breaths and stay hydrated 💧" },
    { channelId: 2, user: "Alice", text: "Feeling anxious before exams, any advice?" },
    { channelId: 2, user: "You", text: "Try breaking your tasks into small steps. It helps!" },
    { channelId: 2, user: "Bob", text: "I’m here if anyone needs someone to talk to." },

    // Random channel messages
    { channelId: 3, user: "Charlie", text: "Check out this relaxing playlist I found 🎵" },
    { channelId: 3, user: "You", text: "Just made a cup of herbal tea, so cozy!" },
    { channelId: 3, user: "Alice", text: "Haha I’m watching cute animal videos 🐶" },
  ]);

  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  const handleSend = () => {
    if (!input.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (dmUser) {
      setMessages(prev => [
        ...prev,
        { dmWith: dmUser.id, from: currentUser.name, to: dmUser.name, text: input, time }
      ]);
    } else {
      setMessages(prev => [
        ...prev,
        { channelId: currentChannel.id, user: currentUser.name, text: input, time }
      ]);
    }

    setInput("");
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentChannel, dmUser]);

  const renderMessages = () => {
    const filtered = dmUser
      ? messages.filter(msg => (msg.dmWith === dmUser.id && (msg.from === currentUser.name || msg.to === currentUser.name)))
      : messages.filter(msg => msg.channelId === currentChannel.id);

    return filtered.map((msg, idx) => {
      const isSelf = msg.user === currentUser.name || msg.from === currentUser.name;
      return (
        <div key={idx} className={`d-flex mb-2 ${isSelf ? 'justify-content-end' : 'justify-content-start'}`}>
          <div className={`p-2 rounded ${isSelf ? 'bg-primary text-white' : 'bg-secondary text-white'}`} style={{ maxWidth: "70%" }}>
            <div><strong>{isSelf ? "You" : msg.user || msg.from}</strong></div>
            <div>{msg.text}</div>
            <div className="text-end" style={{ fontSize: "0.75rem", opacity: 0.8 }}>{msg.time}</div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="d-flex" style={{ height: "80vh", fontFamily: 'Arial, sans-serif' }}>
      {/* Sidebar */}
      <div className="bg-dark text-white p-3" style={{ width: "250px" }}>
        <h5 className="mb-3">Channels</h5>
        <ul className="list-unstyled">
          {channels.map(channel => (
            <li key={channel.id}>
              <button
                className={`btn btn-dark text-start w-100 mb-1 ${currentChannel.id === channel.id && !dmUser ? 'text-primary fw-bold' : ''}`}
                onClick={() => { setCurrentChannel(channel); setDmUser(null); }}
              >
                # {channel.name}
              </button>
            </li>
          ))}
        </ul>

        <h5 className="mt-4 mb-3">Users (DM)</h5>
        <ul className="list-unstyled">
          {users.filter(u => u.id !== currentUser.id).map(user => (
            <li key={user.id} className="mb-1">
              <button
                className={`btn btn-dark text-start w-100 mb-1 ${dmUser?.id === user.id ? 'text-primary fw-bold' : ''}`}
                onClick={() => setDmUser(user)}
              >
                <span className={`badge ${user.online ? "bg-success" : "bg-secondary"} me-2`}></span>
                {user.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Area */}
      <div className="flex-grow-1 d-flex flex-column">
        <div className="border-bottom p-2 bg-light">
          <strong>
            {dmUser ? `DM with ${dmUser.name}` : `# ${currentChannel.name}`}
          </strong>
        </div>

        <div className="flex-grow-1 p-3 overflow-auto" style={{ backgroundColor: "#36393f" }}>
          {renderMessages()}
          <div ref={chatEndRef} />
        </div>

        <div className="p-2 bg-dark d-flex">
          <input
            type="text"
            className="form-control me-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder={dmUser ? `Message ${dmUser.name}` : `Message #${currentChannel.name}`}
            style={{ backgroundColor: "#40444b", color: "white", border: "none" }}
          />
          <button className="btn btn-primary" onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default PeerHub;
