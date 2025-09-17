import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Chatbot from "./Chatbot";  
import Resources from "./Resources";
import PeerHub from "./PeerHub";
import EmergencySupport from './EmergencySupport';


function Home() {
  return (
    <div>
      {/* Hero Section */}

      <header className="bg-light py-5">
        <div className="container text-center">
          <h1 className="display-4 text-primary">Welcome to SereneSpace</h1>
          <p className="lead">Your mental health companion, providing resources and support.</p>
          <a href="/chat" className="btn btn-success btn-lg mt-3">Try the Chatbot</a>
        </div>
      </header>

      {/* Add Emergency Support here */}
      <EmergencySupport />


      {/* Features Section */}
      <section className="container my-5">
        <div className="row">
          <div className="col-md-4 text-center">
            <h3>Peer Hub</h3>
            <p>Connect with others and share your experiences.</p>
          </div>
          <div className="col-md-4 text-center">
            <h3>Resources</h3>
            <p>Access psychoeducational material to improve wellbeing.</p>
          </div>
          <div className="col-md-4 text-center">
            <h3>Chatbot</h3>
            <p>Talk to our AI-powered mental health assistant.</p>
          </div>
        </div>
      </section>
    </div>
  );
}


function App() {
  return (
    <Router>
      <div>
        {/* Navbar */}
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
          <div className="container">
            <a className="navbar-brand" href="/">SereneSpace</a>
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
              <ul className="navbar-nav ms-auto">
                <li className="nav-item"><a className="nav-link" href="/">Home</a></li>
                <li className="nav-item"><a className="nav-link" href="/resources">Resources</a></li>
                <li className="nav-item"><a className="nav-link" href="/peerhub">Peer Hub</a></li>
                <li className="nav-item"><a className="nav-link" href="/chat">Chatbot</a></li>
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
        <footer className="bg-dark text-white text-center py-3 mt-5">
          <p>© 2025 SereneSpace | Built with React + Bootstrap</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
