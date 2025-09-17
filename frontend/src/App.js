import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Chatbot from "./Chatbot";  
import Resources from "./Resources";
import PeerHub from "./PeerHub";
import EmergencySupport from './EmergencySupport';
import { FaUserFriends, FaBookOpen, FaRobot } from "react-icons/fa";

const features = [
  {
    icon: <FaUserFriends size={48} className="text-primary mb-3"/>,
    title: "Peer Hub",
    description: "Connect with others and share your experiences.",
    image: "https://cdn.pixabay.com/photo/2017/06/27/11/48/team-spirit-2447163_1280.jpg"
  },
  {
    icon: <FaBookOpen size={48} className="text-success mb-3"/>,
    title: "Resources",
    description: "Access psychoeducational material to improve wellbeing.",
    image: "https://cdn.pixabay.com/photo/2016/02/16/21/07/christmas-background-1204029_1280.jpg"
    
  },
  {
    icon: <FaRobot size={48} className="text-info mb-3"/>,
    title: "Chatbot",
    description: "Talk to our AI-powered mental health assistant.",
    image: "https://cdn.pixabay.com/photo/2023/02/04/17/28/chat-7767694_1280.jpg"
  }
];

function Home() {
  return (
    <>
      {/* Hero Section */}
      <header className="py-5 text-center text-white" style={{background: "linear-gradient(45deg, #6a11cb, #2575fc)"}}>
        <div className="container">
          <h1 className="display-4 fw-bold mb-3">Welcome to SereneSpace</h1>
          <p className="lead mb-4">Your mental health companion, providing resources and support.</p>
          <Link to="/chat" className="btn btn-lg btn-light shadow">Try the Chatbot</Link>
        </div>
      </header>

      {/* Emergency Support */}
      <section className="container my-5">
        <EmergencySupport />
      </section>

      {/* Features */}
      <section className="container my-5">
        <div className="row g-4">
          {features.map(({icon, title, description, image}, i) => (
            <div className="col-md-4" key={i}>
              <div className="card border-0 shadow-sm h-100">
                <img src={image} alt={title} className="card-img-top rounded-top" style={{height: '200px', objectFit: 'cover'}}/>
                <div className="card-body text-center">
                  {icon}
                  <h3 className="card-title fw-bold">{title}</h3>
                  <p className="card-text">{description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function App() {
  return (
    <Router>
      <div>
        {/* Navbar */}
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow">
          <div className="container">
            <Link className="navbar-brand fs-3 fw-bold" to="/">SereneSpace</Link>
            <button 
              className="navbar-toggler" 
              type="button" 
              data-bs-toggle="collapse" 
              data-bs-target="#navbarNav" 
              aria-controls="navbarNav" 
              aria-expanded="false" 
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav ms-auto fs-5">
                <li className="nav-item"><Link className="nav-link" to="/">Home</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/resources">Resources</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/peerhub">Peer Hub</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/chat">Chatbot</Link></li>
              </ul>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/peerhub" element={<PeerHub />} />
          <Route path="/chat" element={<Chatbot />} />
        </Routes>

        {/* Footer */}
        <footer className="bg-dark text-white text-center py-3 mt-5 shadow">
          <p className="mb-0 fs-6">© 2025 SereneSpace | Built with React + Bootstrap</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
